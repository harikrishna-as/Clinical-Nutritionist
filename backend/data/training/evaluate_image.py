"""
Image evaluation — HOG + RF/SVM/MLP for vitamin_deficiency and skincare
Plots: confusion matrices, per-class F1 bars
"""
import os, warnings, pickle, json
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT_I = os.path.join(BASE, "training", "outputs_image")
EV = os.path.join(BASE, "training", "evaluation_image")
os.makedirs(EV, exist_ok=True)

import pandas as pd, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, confusion_matrix, classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.neural_network import MLPClassifier

from skimage.feature import hog
from skimage.io import imread
from skimage.transform import resize
from skimage.color import rgb2gray

manifest = pd.read_csv(os.path.join(PREP, "skincare_manifest.csv"))

def load_hog_dataset(df, max_per_class=120, img_size=(64,64)):
    sampled = df.groupby("class", group_keys=False).apply(lambda x: x.sample(min(len(x), max_per_class), random_state=42))
    X, y = [], []
    le = LabelEncoder().fit(sampled["class"])
    ok=0
    for _, row in sampled.iterrows():
        p = row["file"].replace("/", os.sep).replace("\\", os.sep)
        if not os.path.exists(p):
            alt = p.replace("D:\\Clinical Nutritionist datasets", BASE)
            if os.path.exists(alt): p=alt
            else: continue
        try:
            img = imread(p)
            if img.ndim==2: img=np.stack([img]*3, axis=-1)
            elif img.shape[2]==4: img=img[:,:,:3]
            img = resize(img, img_size, anti_aliasing=True, preserve_range=True).astype(np.uint8)
            gray = rgb2gray(img) if img.shape[2]==3 else img
            fd = hog(gray, orientations=9, pixels_per_cell=(8,8), cells_per_block=(2,2), block_norm='L2-Hys')
            X.append(fd); y.append(row["class"]); ok+=1
        except: continue
    if not X: return None, None, None
    X=np.array(X); y=le.transform(y)
    return X, y, le

results={}
for dset_name, maxpc in [("vitamin_deficiency",120), ("skincare",150)]:
    print(f"\n{'='*60}\n{dset_name} — HOG evaluation\n{'='*60}")
    df = manifest[manifest["dataset"]==dset_name]
    X, y, le = load_hog_dataset(df, max_per_class=maxpc)
    if X is None: continue
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train {Xtr.shape[0]} Test {Xte.shape[0]} Classes {len(le.classes_)}")

    # Load or retrain
    rf = RandomForestClassifier(n_estimators=150, max_depth=20, n_jobs=-1, random_state=42)
    svm = LinearSVC(C=1.0, max_iter=2000, dual=False)
    mlp = MLPClassifier(hidden_layer_sizes=(256,128), max_iter=40, early_stopping=True, random_state=42)
    rf.fit(Xtr, ytr); svm.fit(Xtr, ytr); mlp.fit(Xtr, ytr)

    for name, mdl in [("RandomForest_Small", rf), ("SVM_HOG_ML", svm), ("MLP_ViT_ResNet_proxy", mlp)]:
        ypred = mdl.predict(Xte)
        acc = accuracy_score(yte, ypred)
        bacc = balanced_accuracy_score(yte, ypred)
        f1_macro = f1_score(yte, ypred, average="macro", zero_division=0)
        f1_weighted = f1_score(yte, ypred, average="weighted", zero_division=0)
        print(f"\n{name} Acc {acc:.4f} BAcc {bacc:.4f} F1-macro {f1_macro:.4f} F1-weighted {f1_weighted:.4f}")
        print(classification_report(yte, ypred, target_names=le.classes_, digits=3, zero_division=0))
        results[f"{dset_name}_{name}"] = {"acc":acc,"bacc":bacc,"f1_macro":f1_macro,"f1_weighted":f1_weighted, "cm": confusion_matrix(yte, ypred).tolist(), "classes": list(le.classes_)}

        # Confusion matrix plot
        cm = confusion_matrix(yte, ypred)
        plt.figure(figsize=(7,5.5))
        im=plt.imshow(cm, cmap="Blues")
        plt.title(f"{dset_name} — {name}\nAcc {acc:.3f} F1-macro {f1_macro:.3f}", fontsize=9)
        plt.xlabel("Pred"); plt.ylabel("True")
        plt.xticks(np.arange(len(le.classes_)), le.classes_, rotation=45, ha="right", fontsize=6)
        plt.yticks(np.arange(len(le.classes_)), le.classes_, fontsize=6)
        for i in range(len(le.classes_)):
            for j in range(len(le.classes_)):
                plt.text(j,i,cm[i,j], ha="center", va="center", fontsize=6, color="white" if cm[i,j]>cm.max()/2 else "black")
        plt.colorbar(im, fraction=0.046)
        plt.tight_layout()
        fn = os.path.join(EV, f"confusion_{dset_name}_{name}.png")
        plt.savefig(fn, dpi=150); plt.close()
        print(" Saved", fn)

    # Cross-val for RF (best small)
    print(f"\n5-fold CV (RF, {dset_name})")
    skf = StratifiedKFold(5, shuffle=True, random_state=42)
    # sample 800 for speed
    if len(X) > 800:
        idx = np.random.choice(len(X), 800, replace=False)
        Xcv, ycv = X[idx], y[idx]
    else: Xcv, ycv = X, y
    scores = cross_val_score(RandomForestClassifier(n_estimators=100, max_depth=20, n_jobs=-1, random_state=42), Xcv, ycv, cv=skf, scoring="accuracy")
    print(f" CV Acc mean {scores.mean():.4f} std {scores.std():.4f} scores {np.round(scores,4)}")
    results[f"{dset_name}_CV"] = {"cv_acc_mean": float(scores.mean()), "cv_acc_std": float(scores.std()), "scores": scores.tolist()}

with open(os.path.join(EV,"metrics_detailed.json"),"w") as f:
    json.dump(results, f, indent=2)
print("\nSaved", os.path.join(EV,"metrics_detailed.json"))
print("\nImage evaluation DONE")
