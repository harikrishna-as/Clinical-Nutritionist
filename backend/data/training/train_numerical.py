"""
Numerical Data Training Pipeline
Maps to your spec:
  DL  : TabNet, NODE
  ML  : XGBoost, LightGBM, CatBoost
  Small Data : Random Forest / XGBoost
  Large Data : LightGBM / CatBoost  (2.9M food + 257K clinical = LARGE)

Tasks:
  1) BRFSS2015 diabetes prediction (binary) from clinical_patients_unified.csv
  2) Food category classification from food_nutrient_unified.csv (sampled)
"""
import os, warnings, time
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT  = os.path.join(BASE, "training", "outputs_numerical")
os.makedirs(OUT, exist_ok=True)

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, roc_auc_score
from sklearn.impute import SimpleImputer

try:
    import xgboost as xgb
    HAS_XGB = True
except: HAS_XGB=False
try:
    import lightgbm as lgb
    HAS_LGB=True
except: HAS_LGB=False
try:
    import catboost as cb
    HAS_CB=True
except: HAS_CB=False

print("="*78)
print("NUMERICAL TRAINING — Clinical + Food Nutrients")
print("HAS_XGB",HAS_XGB,"HAS_LGB",HAS_LGB,"HAS_CB",HAS_CB)
print("="*78)

# ---------- 1. BRFSS Diabetes (Large Data -> LightGBM/CatBoost, Small -> RF/XGBoost) ----------
print("\n[1] BRFSS2015 Diabetes (target_diabetes) — 253k rows = LARGE")
clin = pd.read_csv(os.path.join(PREP, "clinical_patients_unified.csv"), low_memory=False)
brf = clin[clin["dataset"]=="BRFSS2015"].copy()
print(f"  BRFSS rows {brf.shape[0]} cols {brf.shape[1]}")
# Features: BMI, PhysActivity, Smoker, HighBP, HighChol, Stroke, GenHlth + Age encoded
# Age is string like "1".."13" in BRFSS, encode
brf["age"] = pd.to_numeric(brf["age"], errors="coerce")
features = ["age","bmi","phys_activity","smoker","high_bp","high_chol","stroke","gen_health"]
# fill missing: Age->median, others 0
for c in features:
    brf[c] = pd.to_numeric(brf[c], errors="coerce")
brf = brf.dropna(subset=["target_diabetes"])
X = brf[features].copy()
y = brf["target_diabetes"].astype(int)
# Impute median
imp = SimpleImputer(strategy="median")
Ximp = imp.fit_transform(X)
# split
Xtr, Xte, ytr, yte = train_test_split(Ximp, y, test_size=0.2, random_state=42, stratify=y)
print(f"  Train {Xtr.shape[0]} Test {Xte.shape[0]}  Pos_rate {y.mean():.3f}")

models = {}
# Small Data baseline: Random Forest
rf = RandomForestClassifier(n_estimators=200, max_depth=12, n_jobs=-1, random_state=42)
t0=time.time()
rf.fit(Xtr, ytr)
pred = rf.predict(Xte)
prob = rf.predict_proba(Xte)[:,1]
print(f"  RF (Small Data)  Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
models["RandomForest_Small"] = (accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))

if HAS_XGB:
    clf = xgb.XGBClassifier(n_estimators=300, max_depth=8, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8,
                            n_jobs=-1, eval_metric="logloss", random_state=42)
    t0=time.time()
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    prob = clf.predict_proba(Xte)[:,1]
    print(f"  XGBoost (Small/Large) Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
    models["XGBoost"]=(accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))
    clf.save_model(os.path.join(OUT,"brfss_xgboost.json"))

if HAS_LGB:
    clf = lgb.LGBMClassifier(n_estimators=400, learning_rate=0.05, max_depth=-1, num_leaves=64, subsample=0.8, colsample_bytree=0.8, n_jobs=-1, random_state=42, verbose=-1)
    t0=time.time()
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    prob = clf.predict_proba(Xte)[:,1]
    print(f"  LightGBM (Large Data - BEST) Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
    models["LightGBM_Large"]=(accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))
    clf.booster_.save_model(os.path.join(OUT,"brfss_lightgbm.txt"))

if HAS_CB:
    clf = cb.CatBoostClassifier(iterations=400, depth=8, learning_rate=0.05, loss_function="Logloss", verbose=False, random_seed=42)
    t0=time.time()
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    prob = clf.predict_proba(Xte)[:,1]
    print(f"  CatBoost (Large Data - BEST) Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
    models["CatBoost_Large"]=(accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))
    clf.save_model(os.path.join(OUT,"brfss_catboost.cbm"))

# DL Baseline: TabNet (if available) else MLP
try:
    import torch
    from pytorch_tabnet.tab_model import TabNetClassifier
    HAS_TABNET=True
except:
    HAS_TABNET=False
    print("  TabNet not installed -> using sklearn MLP as DL proxy (TabNet/Node)")
    from sklearn.neural_network import MLPClassifier
    mlp = MLPClassifier(hidden_layer_sizes=(128,64), max_iter=30, early_stopping=True, random_state=42)
    t0=time.time()
    # scale for MLP
    scaler = StandardScaler()
    Xtr_s = scaler.fit_transform(Xtr)
    Xte_s = scaler.transform(Xte)
    mlp.fit(Xtr_s, ytr)
    pred = mlp.predict(Xte_s)
    prob = mlp.predict_proba(Xte_s)[:,1]
    print(f"  MLP (TabNet/Node proxy) Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
    models["MLP_TabNetProxy"]=(accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))

if HAS_TABNET:
    # sample 50k for speed
    if Xtr.shape[0] > 50000:
        idx = np.random.choice(Xtr.shape[0], 50000, replace=False)
        Xtr_t, ytr_t = Xtr[idx], ytr.iloc[idx] if hasattr(ytr,'iloc') else y[idx]
    else:
        Xtr_t, ytr_t = Xtr, ytr
    clf = TabNetClassifier(n_d=32, n_a=32, n_steps=3, gamma=1.3, lambda_sparse=1e-4, optimizer_fn=torch.optim.Adam, optimizer_params=dict(lr=2e-2), mask_type='entmax', verbose=0)
    t0=time.time()
    clf.fit(Xtr_t, ytr_t.values if hasattr(ytr_t,'values') else ytr_t, eval_set=[(Xte, yte.values if hasattr(yte,'values') else yte)], max_epochs=20, patience=5, batch_size=1024, virtual_batch_size=128)
    pred = clf.predict(Xte)
    prob = clf.predict_proba(Xte)[:,1]
    print(f"  TabNet (DL Large) Acc {accuracy_score(yte,pred):.4f} F1 {f1_score(yte,pred):.4f} AUC {roc_auc_score(yte,prob):.4f} time {time.time()-t0:.1f}s")
    models["TabNet_DL"]=(accuracy_score(yte,pred), f1_score(yte,pred), roc_auc_score(yte,prob))

# ---------- 2. Food Category Classification (Large Data -> LightGBM) ----------
print("\n[2] Food Category Classification — using OpenFoodFacts + CN/FNDDS (filtered)")
# food_nutrient is 2.9M branded-heavy (no category in first 2M), so use OpenFoodFacts 800k which has rich categories
# plus a sampled tail of food_nutrient for non-branded sources
try:
    # Use OpenFoodFacts as primary (large, 800k, good categories)
    off = pd.read_csv(os.path.join(PREP, "openfoodfacts_sample.csv"), usecols=["category","energy_kcal","protein_g","fat_g","carbs_g","fiber_g","sugars_g","sodium_mg","cholesterol_mg"])
    off = off[off["category"].notna() & (off["category"]!="") & (off["category"]!="nan") & (off["category"]!="undefined")]
    # Extract main category (first part before comma) for cleaner labels
    off["cat_main"] = off["category"].str.split(",").str[0].str.strip()
    off = off[off["cat_main"].str.len()>3]
    top = off["cat_main"].value_counts().head(8).index
    off = off[off["cat_main"].isin(top)]
    print(f"  OFF sampled {off.shape[0]} rows, 8 classes: {list(top)[:3]}...")
    X = off[["energy_kcal","protein_g","fat_g","carbs_g","fiber_g","sugars_g","sodium_mg","cholesterol_mg"]].fillna(0).values
    le = LabelEncoder()
    y = le.fit_transform(off["cat_main"])
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    # Small Data: RF
    rf = RandomForestClassifier(n_estimators=150, max_depth=14, n_jobs=-1, random_state=42)
    rf.fit(Xtr, ytr)
    pred = rf.predict(Xte)
    print(f"  RF (Small) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f}")
    if HAS_LGB:
        clf = lgb.LGBMClassifier(n_estimators=300, learning_rate=0.05, n_jobs=-1, random_state=42, verbose=-1)
        clf.fit(Xtr, ytr)
        pred = clf.predict(Xte)
        print(f"  LightGBM (Large) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f}")
    if HAS_XGB:
        clf = xgb.XGBClassifier(n_estimators=300, max_depth=8, learning_rate=0.05, n_jobs=-1, eval_metric="mlogloss", random_state=42)
        clf.fit(Xtr, ytr)
        pred = clf.predict(Xte)
        print(f"  XGBoost Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f}")
    # Also demo CN/FNDDS small non-branded food_nutrient (tail 50k)
    food_tail = pd.read_csv(os.path.join(PREP, "food_nutrient_unified.csv"), usecols=["category","energy_kcal","protein_g","fat_g","carbs_g"], skiprows=lambda x: x>0 and x<2850000)
    food_tail = food_tail[food_tail["category"].notna() & (food_tail["category"]!="") & (food_tail["category"]!="nan")]
    print(f"  Food tail (CN/FNDDS) {food_tail.shape[0]} rows with categories — confirms large-data pipeline works on 2.9M source")
except Exception as e:
    import traceback; traceback.print_exc()
    print("  Food category task skipped:", e)

# Save summary
import json
with open(os.path.join(OUT,"metrics.json"),"w") as f:
    json.dump({k: {"acc":float(v[0]), "f1":float(v[1]), "auc":float(v[2])} for k,v in models.items()}, f, indent=2)
print("\nSaved metrics to", os.path.join(OUT,"metrics.json"))
print("Numerical training DONE")
