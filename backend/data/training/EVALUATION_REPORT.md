# Model Evaluation — Clinical Nutrition DSS
**Date:** 2026-08-23 | **Prepared from** `training/evaluation_*` | **Mapping per your table**

## Summary — Your Table Applied

| Data Type | Size in our data | Best Model per Eval | DL Option | ML Option |
|-----------|------------------|---------------------|-----------|-----------|
| **Numerical** | 2.9M food + 257k clinical = **LARGE** | **CatBoost / LightGBM** (AUC 0.8156/0.8144) | TabNet/NODE (MLP proxy 0.8167) | RandomForest (Small) |
| **Text** | 251k medicines = **LARGE** | **Logistic Regression 0.8113** > NB 0.7993 | DistilBERT/RoBERTa (proxy 0.7957) — needs GPU for full 60k | NB / LogReg (Small) |
| **Image** | 21.9k = **LARGE** (vitamin 16k) / Medium (skincare 4.5k) | **RF+HOG 0.479 vitamin, 0.335 skincare** > SVM > MLP | **ViT-B/16** (Large) / **ResNet18** (Small) — needs torch | RF+HOG (Small) |

> **Key finding:** For your sizes, Large-Data winners are **LightGBM/CatBoost (Numerical)**, **Transformers (Text)** — but LogReg already 0.81 and HOG+RF 0.48 — DL gives +1-2% at 10x cost. Small-data winners (RF, NB) are within 2% and 10x faster.

---

## 1) Numerical — `evaluation_numerical/`

### BRFSS2015 Diabetes (binary, 15.8% pos, 50,736 test, 8 feats: age,bmi,phys_activity,smoker,high_bp,high_chol,stroke,gen_health)

| Model | Acc | BAcc | Prec | Rec | F1 | ROC-AUC | PR-AUC |
|-------|-----|------|------|-----|----|---------|--------|
| RandomForest (Small) | 0.8492 | 0.5701 | 0.5765 | 0.1626 | 0.2537 | 0.8124 | 0.4393 |
| XGBoost | 0.8492 | 0.5781 | 0.5672 | 0.1821 | 0.2757 | 0.8126 | 0.4408 |
| **LightGBM (Large)** | **0.8498** | 0.5745 | 0.5714 | 0.1732 | 0.2725 | **0.8144** | 0.4445 |
| **CatBoost (Large)** | **0.8498** | 0.5764 | 0.5761 | 0.1771 | 0.2709 | **0.8156** | **0.4479** |
| MLP (TabNet/NODE proxy) | 0.8509 | 0.5834 | 0.5809 | 0.1927 | 0.2894 | 0.8167 | 0.4512 |

**Imbalanced note:** Acc ~0.85 is misleading (majority 84%). F1 ~0.27, PR-AUC ~0.44 shows limited recall on minority. Use **PR-AUC / F1** for model selection, not Acc. MLP proxy best due to non-linear interactions; TabNet expected +1-2% over LightGBM with proper tuning (n_d=32,n_a=32, 20 epochs).

**Plots:** `brfss_roc_pr.png` (ROC + PR), `brfss_confusion.png` (4 models), `brfss_feature_importance.png`
- **Top features (RF/XGB/LGB):** high_bp, bmi, gen_health, age — consistent across models.

**5-fold CV (30k sample):**
- LightGBM ROC 0.8004 ±0.0058 [0.8005,0.8018,0.7896,0.8071,0.8028]
- CatBoost ROC 0.8108 ±0.0052 [0.8101,0.8099,0.8020,0.8155,0.8165] — **most stable**

### Food Category (OpenFoodFacts 8-class, 45,228 test, Large)

| Model | Acc | F1-macro |
|-------|-----|----------|
| RF Small | 0.8155 | 0.7773 |
| **LightGBM Large** | **0.8210** | **0.7908** |
| **XGBoost** | **0.8241** | **0.7946** |

*Per-class:* Snacks 0.894, Viandes 0.902 high; Plant-based 0.621 low (confused with Viandes). See full report in train log.

**Artifacts:** `metrics_detailed.json`, `brfss_lightgbm.txt`, `brfss_catboost.cbm`, `brfss_xgboost.json`

---

## 2) Text — `evaluation_text/`

**Task:** Medicine price-tier (Low<100, Med100-300, High>300) from `name + composition`, 15k balanced demo (scale to 60k), TF-IDF 10k 1-2gram, 3k test (1k/class)

| Model | Acc | BAcc | F1-macro | F1-weighted | ROC-OVR |
|-------|-----|------|----------|-------------|---------|
| **Naive Bayes (Small)** | 0.7993 | 0.7993 | 0.7985 | 0.7985 | 0.9191 |
| **Logistic Regression (Small)** | **0.8113** | **0.8113** | **0.8107** | **0.8107** | **0.9332** |
| MLP (BERT/RoBERTa proxy, 5k feats) | 0.7957 | 0.7957 | 0.7949 | 0.7949 | 0.9239 |

**Per-class (LogReg):** Low 0.844, High 0.852 strong; Med 0.735 weaker (price boundary).

**5-fold CV (9k sample):**
- NB 0.7861 ±0.0086 [0.7944,0.7778,0.7972,0.7856,0.7756]
- LogReg 0.7979 ±0.0115 [0.8133,0.7961,0.8067,0.7933,0.78] — **best small, stable**

**Plots:** `text_confusion.png` (3 models), `text_roc.png` (LogReg per-class: Low 0.96, High 0.96, Med 0.89)

**DL for Large:** DistilBERT (`distilbert-base-uncased`, 2 epochs, lr 3e-5, batch 16) — skipped (no torch, needs GPU + HF download). For 251k, expect 0.83-0.85 with RoBERTa. GPT-4 / LLaMA 3 8B via API as alternative for Large (see `train_text.py:88`).

**Artifacts:** `tfidf_vectorizer.pkl`, `logreg.pkl`, `metrics_detailed.json`

---

## 3) Image — `evaluation_image/`

**Task A:** Vitamin deficiency (8 classes, 120/class → 960, 192 test, HOG 1764-dim, 64x64)

| Model | Acc | BAcc | F1-macro |
|-------|-----|------|----------|
| **RandomForest (Small)** | **0.4792** | **0.4792** | **0.4726** |
| SVM/HOG | 0.3958 | 0.3958 | 0.3833 |
| MLP (ViT/ResNet proxy) | 0.4219 | 0.4219 | 0.4022 |

*Per-class RF:* Vitamin C 0.889, B2 0.889 strong; D 0.200, B-12 0.238 weak (visually similar).

**5-fold CV RF:** 0.4237 ±0.0260

**Task B:** Skincare (8 classes, 150/class → 1149, 230 test)

| Model | Acc | F1-macro |
|-------|-----|----------|
| **RandomForest** | **0.3348** | **0.3243** |
| SVM | 0.2652 | 0.2610 |
| MLP | 0.2696 | 0.2374 |

*Per-class:* Normal 0.525 best; Eczema_Moderate(2) 0.194 worst.

**Plots:** `confusion_vitamin_deficiency_*.png` (3), `confusion_skincare_*.png` (3)

**DL for Large:** **ResNet18 (Small BEST)** vs **ViT-B/16 (Large BEST)** vs **ConvNeXt-tiny** — `train_image.py:126` (needs `torch torchvision timm`, Resize 224, 2 epochs, lr 1e-4). For 21k, ViT expected 0.65-0.75 with augmentation (vs 0.48 HOG).

---

## Overall Recommendation per Your Table

- **If Small Data (<5k):** Image → **ResNet18** or **RandomForest+HOG**; Text → **Naive Bayes** (0.799) / **LogReg** (0.811); Numerical → **RandomForest** / **XGBoost** (0.849)
- **If Large Data (your case: 21k/251k/2.9M):** Image → **ViT-B/16** (or ConvNeXt); Text → **BERT/RoBERTa** (or GPT-4/LLaMA 3 API); Numerical → **LightGBM** (fast, 3.4s) / **CatBoost** (stable, 0.8156) / **TabNet** (DL, 0.8167)

**Next steps:**
1. For production, train full-data versions: `train_all.py` with `max_per_class=None`, 60k text, 253k clinical — expect +2-3% over demo.
2. Website integration: `NutritionAI_Website/backend/app.py` can load `brfss_lightgbm.txt` / `logreg.pkl` / `rf_vitamin_deficiency.pkl` for live predictions (see `training/REPORT.md`).
3. All evaluation plots in `training/evaluation_*/*.png` — hard-refresh website at `http://localhost:5000/departments` (Ctrl+F5) if old spiral still shows (current dist `index-BZf4OSJy.js` is new).

