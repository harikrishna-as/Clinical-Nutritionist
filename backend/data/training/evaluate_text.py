"""
Text evaluation — medicines price tier (3-class)
Metrics: acc, balanced acc, precision/recall/F1 macro/micro/weighted, confusion, ROC OVR
Plots: confusion matrix, per-class ROC
"""
import os, warnings, json
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT_T = os.path.join(BASE, "training", "outputs_text")
EV = os.path.join(BASE, "training", "evaluation_text")
os.makedirs(EV, exist_ok=True)

import pandas as pd, numpy as np, pickle, time
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, precision_score, recall_score, f1_score,
                             confusion_matrix, classification_report, roc_curve, auc, RocCurveDisplay)
from sklearn.preprocessing import label_binarize
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold

# Load data same as train_text
med = pd.read_csv(os.path.join(PREP, "medicines_clean.csv"), low_memory=False)
med["text"] = (med["name"].fillna("") + " " + med["short_composition1"].fillna("") + " " + med["short_composition2"].fillna("")).str.lower()
med["price_inr"] = pd.to_numeric(med["price_inr"], errors="coerce")
med = med.dropna(subset=["price_inr","text"])
med = med[med["text"].str.len()>5]
def tier(p):
    if p < 100: return 0
    elif p < 300: return 1
    else: return 2
med["tier"] = med["price_inr"].apply(tier)
med_s = med.groupby("tier", group_keys=False).apply(lambda x: x.sample(min(len(x), 5000), random_state=42))
X_text = med_s["text"].values
y = med_s["tier"].values
Xtr_t, Xte_t, ytr, yte = train_test_split(X_text, y, test_size=0.2, random_state=42, stratify=y)

# Load vectorizer + models
with open(os.path.join(OUT_T,"tfidf_vectorizer.pkl"),"rb") as f: vectorizer = pickle.load(f)
with open(os.path.join(OUT_T,"logreg.pkl"),"rb") as f: logreg = pickle.load(f)

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier

# Re-train NB for eval to get proba
Xtr = vectorizer.transform(Xtr_t); Xte = vectorizer.transform(Xte_t)
nb = MultinomialNB(alpha=0.5)
nb.fit(Xtr, ytr)

# MLP proxy
vec2 = TfidfVectorizer(max_features=5000, ngram_range=(1,2), stop_words="english")
Xtr2 = vec2.fit_transform(Xtr_t); Xte2 = vec2.transform(Xte_t)
mlp = MLPClassifier(hidden_layer_sizes=(256,128), max_iter=20, early_stopping=True, random_state=42)
mlp.fit(Xtr2, ytr)

models = {
    "NaiveBayes_Small": (nb, Xte, "tfidf10k"),
    "LogisticRegression_Small": (logreg, Xte, "tfidf10k"),
    "MLP_BERT_proxy": (mlp, Xte2, "tfidf5k")
}

results={}
for name, (mdl, Xt, feat) in models.items():
    ypred = mdl.predict(Xt)
    yprob = mdl.predict_proba(Xt) if hasattr(mdl,"predict_proba") else None
    acc = accuracy_score(yte, ypred)
    bacc = balanced_accuracy_score(yte, ypred)
    prec_macro = precision_score(yte, ypred, average="macro", zero_division=0)
    rec_macro = recall_score(yte, ypred, average="macro", zero_division=0)
    f1_macro = f1_score(yte, ypred, average="macro", zero_division=0)
    f1_weighted = f1_score(yte, ypred, average="weighted", zero_division=0)
    # ROC OVR
    y_bin = label_binarize(yte, classes=[0,1,2])
    try:
        roc_ovr = 0
        for i in range(3):
            fpr,tpr,_ = roc_curve(y_bin[:,i], yprob[:,i])
            roc_ovr += auc(fpr,tpr)
        roc_ovr/=3
    except: roc_ovr=float('nan')
    cm = confusion_matrix(yte, ypred).tolist()
    results[name]={"acc":acc,"bacc":bacc,"prec_macro":prec_macro,"rec_macro":rec_macro,"f1_macro":f1_macro,"f1_weighted":f1_weighted,"roc_ovr":roc_ovr,"cm":cm}
    print(f"\n{name} ({feat})")
    print(f" Acc {acc:.4f} BAcc {bacc:.4f} Prec_macro {prec_macro:.4f} Rec_macro {rec_macro:.4f} F1_macro {f1_macro:.4f} F1_weighted {f1_weighted:.4f} ROC-OVR {roc_ovr:.4f}")
    print(classification_report(yte, ypred, target_names=["Low<100","Med100-300","High>300"], digits=3, zero_division=0))

# Confusion matrices
fig, axes = plt.subplots(1,3, figsize=(12,3.5))
for ax, (name,(mdl,Xt,_)) in zip(axes, models.items()):
    pred = mdl.predict(Xt)
    cm = confusion_matrix(yte, pred)
    im=ax.imshow(cm, cmap="Blues")
    ax.set_title(name, fontsize=8)
    ax.set_xlabel("Pred"); ax.set_ylabel("True")
    ax.set_xticks([0,1,2]); ax.set_yticks([0,1,2])
    ax.set_xticklabels(["Low","Med","High"], fontsize=7); ax.set_yticklabels(["Low","Med","High"], fontsize=7)
    for i in range(3):
        for j in range(3):
            ax.text(j,i,cm[i,j], ha="center", va="center", fontsize=7, color="white" if cm[i,j]>cm.max()/2 else "black")
plt.tight_layout(); plt.savefig(os.path.join(EV,"text_confusion.png"), dpi=150); plt.close()
print("Saved", os.path.join(EV,"text_confusion.png"))

# ROC per class (LogReg best)
plt.figure(figsize=(9,4))
for idx, cls in enumerate(["Low<100","Med100-300","High>300"]):
    y_bin = label_binarize(yte, classes=[0,1,2])
    # LogReg prob
    prob = logreg.predict_proba(Xte)[:,idx]
    fpr,tpr,_ = roc_curve(y_bin[:,idx], prob)
    plt.plot(fpr,tpr,label=f"{cls} AUC={auc(fpr,tpr):.3f}")
plt.plot([0,1],[0,1],"k--"); plt.xlabel("FPR"); plt.ylabel("TPR"); plt.title("Text Price-Tier ROC OVR (LogReg, Small Data)")
plt.legend(fontsize=7); plt.grid(alpha=0.3); plt.tight_layout()
plt.savefig(os.path.join(EV,"text_roc.png"), dpi=150); plt.close()

# Cross-val for best large/small
print("\n5-fold CV (LogReg & NB, 9k sample for speed)")
sample_idx = np.random.choice(len(X_text), 9000, replace=False)
X_s = X_text[sample_idx]; y_s = y[sample_idx]
# vectorize inside CV would be leak; do quick manual CV with same vectorizer fitted on full? use pipeline
from sklearn.pipeline import Pipeline
pipe_nb = Pipeline([("tfidf", TfidfVectorizer(max_features=10000, ngram_range=(1,2), stop_words="english")), ("clf", MultinomialNB(alpha=0.5))])
pipe_lr = Pipeline([("tfidf", TfidfVectorizer(max_features=10000, ngram_range=(1,2), stop_words="english")), ("clf", LogisticRegression(max_iter=100, solver="saga", n_jobs=-1, C=2.0))])
skf = StratifiedKFold(5, shuffle=True, random_state=42)
for name, pipe in [("NaiveBayes", pipe_nb), ("LogReg", pipe_lr)]:
    scores = cross_val_score(pipe, X_s, y_s, cv=skf, scoring="accuracy", n_jobs=1)
    print(f"  {name} CV Acc 5-fold mean {scores.mean():.4f} std {scores.std():.4f} scores {np.round(scores,4)}")

with open(os.path.join(EV,"metrics_detailed.json"),"w") as f:
    json.dump(results, f, indent=2)
print("Saved", os.path.join(EV,"metrics_detailed.json"))
print("\nText evaluation DONE")
