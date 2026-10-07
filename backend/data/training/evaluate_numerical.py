"""
Comprehensive evaluation for Numerical models
- BRFSS2015 diabetes (binary, imbalanced)
- OpenFoodFacts food category (8-class)
Metrics: acc, balanced_acc, precision, recall, f1 macro/micro/weighted, ROC AUC, PR AUC, confusion matrix, reports
Plots: ROC, PR, confusion matrix, feature importance
"""
import os, warnings, json, time
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT_N = os.path.join(BASE, "training", "outputs_numerical")
EV = os.path.join(BASE, "training", "evaluation_numerical")
os.makedirs(EV, exist_ok=True)

import pandas as pd, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, precision_score, recall_score, f1_score,
                             roc_auc_score, average_precision_score, confusion_matrix, classification_report,
                             roc_curve, precision_recall_curve)
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
import pickle

# Load BRFSS data again for eval
from sklearn.ensemble import RandomForestClassifier
try: import xgboost as xgb; HAS_XGB=True
except: HAS_XGB=False
try: import lightgbm as lgb; HAS_LGB=True
except: HAS_LGB=False
try: import catboost as cb; HAS_CB=True
except: HAS_CB=False
try: from sklearn.neural_network import MLPClassifier; HAS_MLP=True
except: HAS_MLP=False

clin = pd.read_csv(os.path.join(PREP, "clinical_patients_unified.csv"), low_memory=False)
brf = clin[clin["dataset"]=="BRFSS2015"].copy()
brf["age"] = pd.to_numeric(brf["age"], errors="coerce")
features = ["age","bmi","phys_activity","smoker","high_bp","high_chol","stroke","gen_health"]
for c in features: brf[c]=pd.to_numeric(brf[c], errors="coerce")
brf=brf.dropna(subset=["target_diabetes"])
X = brf[features].copy()
y = brf["target_diabetes"].astype(int)
imp = SimpleImputer(strategy="median")
Ximp = imp.fit_transform(X)
Xtr, Xte, ytr, yte = train_test_split(Ximp, y, test_size=0.2, random_state=42, stratify=y)

# Load models
models={}
# RF
import pickle as pk
# retrain quickly for eval to get proba (or load if exists) - retrain for consistency
rf = RandomForestClassifier(n_estimators=200, max_depth=12, n_jobs=-1, random_state=42)
rf.fit(Xtr, ytr)
models["RandomForest_Small"] = rf

if HAS_XGB:
    clf = xgb.XGBClassifier(n_estimators=300, max_depth=8, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, n_jobs=-1, eval_metric="logloss", random_state=42)
    clf.fit(Xtr, ytr)
    models["XGBoost"] = clf
if HAS_LGB:
    clf = lgb.LGBMClassifier(n_estimators=400, learning_rate=0.05, num_leaves=64, n_jobs=-1, random_state=42, verbose=-1)
    clf.fit(Xtr, ytr)
    models["LightGBM_Large"] = clf
if HAS_CB:
    clf = cb.CatBoostClassifier(iterations=400, depth=8, learning_rate=0.05, loss_function="Logloss", verbose=False, random_seed=42)
    clf.fit(Xtr, ytr)
    models["CatBoost_Large"] = clf
# MLP proxy for TabNet/Node
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
Xtr_s = scaler.fit_transform(Xtr); Xte_s = scaler.transform(Xte)
mlp = MLPClassifier(hidden_layer_sizes=(128,64), max_iter=30, early_stopping=True, random_state=42)
mlp.fit(Xtr_s, ytr)
models["MLP_TabNet_NODE_proxy"] = (mlp, scaler)  # tuple

# Evaluate each
results={}
for name, m in models.items():
    if name=="MLP_TabNet_NODE_proxy":
        mlp, scaler = m
        ypred = mlp.predict(Xte_s)
        yprob = mlp.predict_proba(Xte_s)[:,1]
    else:
        ypred = m.predict(Xte)
        yprob = m.predict_proba(Xte)[:,1] if hasattr(m,"predict_proba") else np.zeros(len(ypred))
    acc = accuracy_score(yte, ypred)
    bacc = balanced_accuracy_score(yte, ypred)
    prec = precision_score(yte, ypred, zero_division=0)
    rec = recall_score(yte, ypred, zero_division=0)
    f1 = f1_score(yte, ypred, zero_division=0)
    try: roc = roc_auc_score(yte, yprob)
    except: roc = float('nan')
    try: pr = average_precision_score(yte, yprob)
    except: pr = float('nan')
    cm = confusion_matrix(yte, ypred).tolist()
    results[name] = {"acc":acc,"bacc":bacc,"prec":prec,"rec":rec,"f1":f1,"roc_auc":roc,"pr_auc":pr,"cm":cm, "yprob": yprob.tolist()[:5]}
    print(f"{name:22} Acc {acc:.4f} BAcc {bacc:.4f} Prec {prec:.4f} Rec {rec:.4f} F1 {f1:.4f} ROC {roc:.4f} PR {pr:.4f}")
    print(classification_report(yte, ypred, digits=3))

# ROC + PR plots combined
plt.figure(figsize=(12,5))
ax1=plt.subplot(1,2,1)
for name,m in models.items():
    if name=="MLP_TabNet_NODE_proxy":
        _, scaler = m; X = Xte_s; prob = m[0].predict_proba(X)[:,1]
    else: prob = m.predict_proba(Xte)[:,1]
    fpr,tpr,_ = roc_curve(yte, prob)
    ax1.plot(fpr,tpr,label=f"{name} AUC={roc_auc_score(yte,prob):.3f}")
ax1.plot([0,1],[0,1],'k--'); ax1.set_xlabel("FPR"); ax1.set_ylabel("TPR"); ax1.set_title("BRFSS Diabetes ROC (Numerical)"); ax1.legend(fontsize=7); ax1.grid(alpha=0.3)
ax2=plt.subplot(1,2,2)
for name,m in models.items():
    if name=="MLP_TabNet_NODE_proxy":
        prob = m[0].predict_proba(Xte_s)[:,1]
    else: prob = m.predict_proba(Xte)[:,1]
    prec, rec, _ = precision_recall_curve(yte, prob)
    ax2.plot(rec,prec,label=f"{name} AP={average_precision_score(yte,prob):.3f}")
ax2.set_xlabel("Recall"); ax2.set_ylabel("Precision"); ax2.set_title("PR Curve (imbalanced 15.8% pos)"); ax2.legend(fontsize=7); ax2.grid(alpha=0.3)
plt.tight_layout(); plt.savefig(os.path.join(EV,"brfss_roc_pr.png"), dpi=150); plt.close()
print("Saved", os.path.join(EV,"brfss_roc_pr.png"))

# Confusion matrices
fig, axes = plt.subplots(2,3, figsize=(12,7))
axes=axes.flatten()
for ax, (name,m) in zip(axes, models.items()):
    if name=="MLP_TabNet_NODE_proxy":
        pred = m[0].predict(Xte_s)
    else: pred = m.predict(Xte)
    cm = confusion_matrix(yte, pred)
    im=ax.imshow(cm, cmap="Blues")
    ax.set_title(name, fontsize=9)
    ax.set_xlabel("Pred"); ax.set_ylabel("True")
    for i in range(2):
        for j in range(2):
            ax.text(j,i,cm[i,j], ha="center", va="center", fontsize=8, color="white" if cm[i,j]>cm.max()/2 else "black")
plt.tight_layout(); plt.savefig(os.path.join(EV,"brfss_confusion.png"), dpi=150); plt.close()
print("Saved confusion")

# Feature importance (RF, XGB, LGB, CatBoost)
plt.figure(figsize=(10,4))
for name,m in models.items():
    if name in ["RandomForest_Small","XGBoost","LightGBM_Large"]:
        if hasattr(m, "feature_importances_"):
            imp = m.feature_importances_
            plt.bar(np.arange(len(features))+list(models.keys()).index(name)*0.15, imp, width=0.15, label=name)
plt.xticks(np.arange(len(features))+0.2, features, rotation=20, fontsize=7)
plt.legend(fontsize=7); plt.title("Feature Importance (BRFSS)"); plt.tight_layout()
plt.savefig(os.path.join(EV,"brfss_feature_importance.png"), dpi=150); plt.close()

# Cross-validation (5-fold) for best large models
print("\n5-fold CV (LightGBM & CatBoost, 30k sample for speed)")
sample_idx = np.random.choice(len(Ximp), 30000, replace=False)
Xcv, ycv = Ximp[sample_idx], y.iloc[sample_idx] if hasattr(y,"iloc") else y[sample_idx]
skf = StratifiedKFold(5, shuffle=True, random_state=42)
for name in ["LightGBM_Large","CatBoost_Large"]:
    if name not in models: continue
    m = models[name]
    # clone with same params but quick
    scores = cross_val_score(m, Xcv, ycv, cv=skf, scoring="roc_auc", n_jobs=1)
    print(f"  {name} CV ROC-AUC 5-fold mean {scores.mean():.4f} std {scores.std():.4f} scores {np.round(scores,4)}")

# Save detailed JSON
with open(os.path.join(EV,"metrics_detailed.json"),"w") as f:
    # remove yprob lists for json
    out = {k:{kk:vv for kk,vv in v.items() if kk!="yprob"} for k,v in results.items()}
    json.dump(out, f, indent=2)
print("Saved detailed metrics to", os.path.join(EV,"metrics_detailed.json"))

# Food category evaluation (OFF 8-class) - quick
print("\n--- Food Category (OFF 8-class, Large Data) ---")
off = pd.read_csv(os.path.join(PREP, "openfoodfacts_sample.csv"), usecols=["category","energy_kcal","protein_g","fat_g","carbs_g","fiber_g","sugars_g","sodium_mg","cholesterol_mg"])
off = off[off["category"].notna() & (off["category"]!="") & (off["category"]!="nan") & (off["category"]!="undefined")]
off["cat_main"] = off["category"].str.split(",").str[0].str.strip()
off = off[off["cat_main"].str.len()>3]
top = off["cat_main"].value_counts().head(8).index
off = off[off["cat_main"].isin(top)]
Xf = off[["energy_kcal","protein_g","fat_g","carbs_g","fiber_g","sugars_g","sodium_mg","cholesterol_mg"]].fillna(0).values
le = LabelEncoder(); yf = le.fit_transform(off["cat_main"])
Xtr, Xte, ytr, yte = train_test_split(Xf, yf, test_size=0.2, random_state=42, stratify=yf)
# Use best model LightGBM for report
if HAS_LGB:
    clf = lgb.LGBMClassifier(n_estimators=300, learning_rate=0.05, n_jobs=-1, random_state=42, verbose=-1)
    clf.fit(Xtr, ytr); pred = clf.predict(Xte)
    print(classification_report(yte, pred, target_names=le.classes_, digits=3, zero_division=0))
    print(f"Acc {accuracy_score(yte,pred):.4f} macro F1 {f1_score(yte,pred, average='macro'):.4f}")

print("\nNumerical evaluation DONE")
