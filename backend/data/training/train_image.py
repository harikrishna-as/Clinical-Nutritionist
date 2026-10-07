"""
Image Data Training Pipeline
Maps to your spec:
  DL  : Vision Transformers (ViT), ConvNeXt, ResNet
  ML  : SVM, Random Forest (with HOG/SIFT features)
  Small Data : ResNet / Random Forest
  Large Data : Vision Transformers (ViT)

Datasets in skincare_manifest.csv:
  vitamin_deficiency 16424 (8 classes) — LARGE
  skincare           4550  (7 classes: Acne/Eczema/Normal) — MEDIUM
  isic2016           900   — SMALL
  hair_loss          30   — tiny

Pipelines:
  A) ML baseline: HOG -> SVM / Random Forest (works for all sizes, best for Small)
  B) DL: ResNet18 transfer learning (Small BEST) and ViT-B/16 (Large BEST) + ConvNeXt (alternative)
"""
import os, warnings, time, glob
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT  = os.path.join(BASE, "training", "outputs_image")
os.makedirs(OUT, exist_ok=True)

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, f1_score, classification_report

# HOG
try:
    from skimage.feature import hog
    from skimage.io import imread
    from skimage.transform import resize
    from skimage.color import rgb2gray
    HAS_SKIMAGE=True
except: HAS_SKIMAGE=False

print("="*78)
print("IMAGE TRAINING — skincare_manifest (21,904 images)")
print("HAS_SKIMAGE",HAS_SKIMAGE)
print("="*78)

manifest = pd.read_csv(os.path.join(PREP, "skincare_manifest.csv"))
print(manifest["dataset"].value_counts())
print(manifest["class"].value_counts().head(12))

# Focus on vitamin_deficiency (16k) as LARGE example, and skincare (4.5k) as MEDIUM
# For quick demo, use vitamin_deficiency subset (3 classes with most samples) -> large -> ViT best
# and skincare subset -> small/medium -> ResNet best

def load_hog_dataset(df, max_per_class=400, img_size=(64,64)):
    """Load images, compute HOG, return X, y"""
    # Sample per class for speed
    sampled = df.groupby("class", group_keys=False).apply(lambda x: x.sample(min(len(x), max_per_class), random_state=42))
    print(f"  Sampled {len(sampled)} images ({max_per_class}/class)")
    X, y, ok, bad = [], [], 0, 0
    le = LabelEncoder()
    le.fit(sampled["class"])
    for _, row in sampled.iterrows():
        p = row["file"]
        # Fix path separators
        p = p.replace("/", os.sep).replace("\\", os.sep)
        if not os.path.exists(p):
            # try alternative: Old datasets path case
            alt = p.replace("D:\\Clinical Nutritionist datasets", BASE)
            if os.path.exists(alt): p=alt
            else: bad+=1; continue
        try:
            img = imread(p)
            if img.ndim == 2:
                img = np.stack([img]*3, axis=-1)
            elif img.shape[2]==4:
                img = img[:,:,:3]
            img = resize(img, img_size, anti_aliasing=True, preserve_range=True).astype(np.uint8)
            gray = rgb2gray(img) if img.shape[2]==3 else img
            # HOG params: good for medical skin images
            fd = hog(gray, orientations=9, pixels_per_cell=(8,8), cells_per_block=(2,2), block_norm='L2-Hys', feature_vector=True)
            X.append(fd)
            y.append(row["class"])
            ok+=1
        except Exception as e:
            bad+=1
            continue
    print(f"  HOG loaded ok={ok} bad={bad} feat_dim={len(X[0]) if X else 0}")
    if len(X)==0:
        return None, None, None
    X = np.array(X)
    y = le.transform(y)
    return X, y, le

# ---------- A) ML with HOG — Best for Small Data (Random Forest) ----------
for dset_name, maxpc in [("vitamin_deficiency", 120), ("skincare", 150)]:
    print(f"\n[A] HOG + ML — dataset={dset_name} (Small Data -> RF, Large -> ViT)")
    df = manifest[manifest["dataset"]==dset_name]
    if len(df)==0:
        print("  no rows"); continue
    X, y, le = load_hog_dataset(df, max_per_class=maxpc, img_size=(64,64))
    if X is None: continue
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"  Train {Xtr.shape[0]} Test {Xte.shape[0]} Classes {len(le.classes_)}: {list(le.classes_)[:4]}")

    # Random Forest (Small Data BEST)
    rf = RandomForestClassifier(n_estimators=150, max_depth=20, n_jobs=-1, random_state=42)
    t0=time.time()
    rf.fit(Xtr, ytr)
    pred = rf.predict(Xte)
    print(f"  Random Forest (Small Data) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f} time {time.time()-t0:.1f}s")
    print(classification_report(yte, pred, target_names=le.classes_, digits=3, zero_division=0))

    # SVM (ML with HOG/SIFT)
    svm = LinearSVC(C=1.0, max_iter=2000, dual=False)
    t0=time.time()
    svm.fit(Xtr, ytr)
    pred = svm.predict(Xte)
    print(f"  SVM/HOG (ML) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f} time {time.time()-t0:.1f}s")
    # Save
    import pickle
    with open(os.path.join(OUT, f"rf_{dset_name}.pkl"),"wb") as f: pickle.dump((rf, le), f)

# ---------- B) DL — ResNet (Small) and ViT (Large) ----------
try:
    import torch
    import torchvision
    from torchvision import transforms, models
    from torch.utils.data import Dataset, DataLoader
    from PIL import Image
    HAS_TORCH=True
    print(f"\n[B] DL available torch {torch.__version__} torchvision {torchvision.__version__}")
except Exception as e:
    HAS_TORCH=False
    print(f"\n[B] torch not available ({e}) -> DL training will use HOG+MLP proxy")
    print("  To enable DL (ResNet/ViT/ConvNeXt): pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
    print("  ViT (Large Data BEST): timm.create_model('vit_base_patch16_224', pretrained=True)")
    print("  ConvNeXt (DL alternative): timm.create_model('convnext_tiny', pretrained=True)")
    print("  ResNet (Small Data BEST): torchvision.models.resnet18(weights='IMAGENET1K_V1')")

if HAS_TORCH:
    print("\n[B] Training ResNet18 (Small Data BEST) vs ViT (Large Data BEST) — demo on vitamin_deficiency (2 classes subset for speed)")
    # Quick demo: 2-class subset, 200 images total, 3 epochs
    df = manifest[manifest["dataset"]=="vitamin_deficiency"]
    # Pick top 2 classes for fast demo
    top2 = df["class"].value_counts().head(2).index.tolist()
    df2 = df[df["class"].isin(top2)].groupby("class", group_keys=False).apply(lambda x: x.sample(min(len(x), 250), random_state=42))
    print(f"  DL demo: {len(df2)} images, classes {top2}")
    # Dataset
    class ImgDS(Dataset):
        def __init__(self, df, tfm):
            self.df=df.reset_index(drop=True)
            self.tfm=tfm
            self.le=LabelEncoder().fit(df["class"])
        def __len__(self): return len(self.df)
        def __getitem__(self, i):
            row=self.df.iloc[i]
            p=row["file"].replace("/", os.sep).replace("\\", os.sep)
            img=Image.open(p).convert("RGB")
            return self.tfm(img), self.le.transform([row["class"]])[0]
    tfm = transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
    # split
    tr_df, te_df = train_test_split(df2, test_size=0.2, random_state=42, stratify=df2["class"])
    tr_ds = ImgDS(tr_df, tfm); te_ds = ImgDS(te_df, tfm)
    tr_ld = DataLoader(tr_ds, batch_size=16, shuffle=True, num_workers=0)
    te_ld = DataLoader(te_ds, batch_size=32)

    def train_model(name, model, epochs=2):
        device=torch.device("cpu")
        model=model.to(device)
        opt=torch.optim.Adam(model.parameters(), lr=1e-4)
        crit=torch.nn.CrossEntropyLoss()
        for ep in range(epochs):
            model.train()
            tot, correct, loss_sum=0,0,0
            for x,y in tr_ld:
                x,y=x.to(device), y.to(device)
                opt.zero_grad()
                out=model(x)
                loss=crit(out,y)
                loss.backward(); opt.step()
                pred=out.argmax(1)
                correct+=(pred==y).sum().item(); tot+=y.size(0); loss_sum+=loss.item()*y.size(0)
            # eval
            model.eval()
            tot2, correct2=0,0
            with torch.no_grad():
                for x,y in te_ld:
                    x,y=x.to(device), y.to(device)
                    out=model(x)
                    pred=out.argmax(1)
                    correct2+=(pred==y).sum().item(); tot2+=y.size(0)
            print(f"  {name} Epoch {ep+1}/{epochs} trainAcc {correct/tot:.3f} testAcc {correct2/tot2:.3f}")
        return model

    # ResNet18 (Small Data BEST)
    resnet = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    resnet.fc = torch.nn.Linear(resnet.fc.in_features, len(top2))
    train_model("ResNet18 (Small BEST)", resnet, epochs=2)

    # ViT (Large Data BEST) — use torchvision ViT if available
    try:
        vit = models.vit_b_16(weights=models.ViT_B_16_Weights.IMAGENET1K_V1)
        vit.heads.head = torch.nn.Linear(vit.heads.head.in_features, len(top2))
        train_model("ViT-B/16 (Large BEST)", vit, epochs=2)
    except Exception as e:
        print(f"  ViT training skipped: {e} — install timm for ConvNeXt/ViT: pip install timm")

    # ConvNeXt note
    print("  ConvNeXt (DL alternative): torchvision.models.convnext_tiny(weights='IMAGENET1K_V1') — similar fine-tune as above")
else:
    # Proxy: MLP on HOG as DL proxy (since HOG already extracted above, reuse)
    print("\n[B] DL proxy (no torch): HOG + MLPClassifier as stand-in for ResNet/ViT/ConvNeXt")
    from sklearn.neural_network import MLPClassifier
    df = manifest[manifest["dataset"]=="vitamin_deficiency"]
    X, y, le = load_hog_dataset(df, max_per_class=120, img_size=(64,64))
    if X is not None:
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        mlp = MLPClassifier(hidden_layer_sizes=(256,128), max_iter=40, early_stopping=True, random_state=42)
        mlp.fit(Xtr, ytr)
        pred = mlp.predict(Xte)
        print(f"  MLP (ViT/ResNet/ConvNeXt proxy) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f}")

print("\nImage training DONE. Outputs in", OUT)
print("Summary: Small Data -> ResNet/Random Forest | Large Data -> ViT (see table)")
