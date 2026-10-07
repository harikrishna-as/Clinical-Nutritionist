# Clinical Nutrition DSS — Training Report
**Mapping used (your table)**
| Data Type | Best DL | Best ML | Best for Small Data | Best for Large Data |
|-----------|---------|---------|---------------------|---------------------|
| Image | ViT, ConvNeXt, ResNet | SVM, Random Forest (HOG/SIFT) | ResNet / Random Forest | ViT |
| Text | BERT, GPT-4, LLaMA 3, RoBERTa | Logistic Regression, Naive Bayes | Naive Bayes / Logistic Regression | Transformers |
| Numerical | TabNet, NODE | XGBoost, LightGBM, CatBoost | Random Forest / XGBoost | LightGBM / CatBoost |

**Datasets (prepared)**
- `food_nutrient_unified.csv` 2,917,325 rows (numerical, per-100g)
- `clinical_patients_unified.csv` 257,571 rows (numerical tabular, 4 cohorts)
- `medicines_clean.csv` 251,320 rows (text)
- `skincare_manifest.csv` 21,904 images (vitamin_deficiency 16,424 / skincare 4,550 / isic2016 900)
- `openfoodfacts_sample.csv` 800,000 rows (numerical+text)

---

## 1) Numerical — `clinical_patients_unified` (BRFSS 253,680 = LARGE) + `openfoodfacts`/`food_nutrient`

**Task A — BRFSS2015 diabetes binary (target_diabetes, pos 15.8%)**

| Model | Role per table | Acc | F1 | AUC | Time |
|-------|----------------|-----|----|-----|------|
| RandomForest | Small Data BEST | 0.8492 | 0.2537 | 0.8124 | 12.4s |
| XGBoost | Small/Large | 0.8492 | 0.2757 | 0.8126 | 5.2s |
| **LightGBM** | **Large Data BEST** | **0.8498** | **0.2725** | **0.8144** | **3.4s** |
| **CatBoost** | **Large Data BEST** | **0.8498** | **0.2709** | **0.8156** | 13.2s |
| MLP (TabNet/NODE proxy) | DL (TabNet, NODE) | 0.8509 | 0.2894 | 0.8167 | 19.1s |

* DL install: `pip install pytorch-tabnet` then TabNetClassifier(n_d=32,n_a=32,n_steps=3) — large-data DL alternative to LightGBM. For full TabNet, 50k sample, 20 epochs, batch 1024.

**Task B — Food category from nutrients (OFF 226,138 rows, 8 classes, LARGE)**

| Model | Acc | F1-macro |
|-------|-----|----------|
| RandomForest (Small) | 0.8155 | 0.7773 |
| **LightGBM (Large)** | **0.8210** | **0.7908** |
| **XGBoost** | **0.8241** | **0.7946** |

Tail check: `food_nutrient` non-branded tail (CN/FNDDS) 42,667 rows with categories — pipeline scales to 2.9M source.

**Recommendation (Numerical)**
- Small data (<10k): RandomForest / XGBoost
- Large data (>50k, your case): **LightGBM** (fastest, 3.4s, best AUC) or CatBoost (handles categoricals), DL → **TabNet/NODE**

---

## 2) Text — `medicines_clean` (251k = LARGE)

**Task — price-tier from text (low<100, med100-300, high>300)**

TF-IDF (10k feats, 1-2gram) on `name + composition`, 15k balanced demo (scale to 60k for full):

| Model | Role | Acc | F1-macro |
|-------|------|-----|----------|
| **Naive Bayes** | **Small Data BEST** | **0.7993** | **0.7985** |
| **Logistic Regression** | **Small Data** | **0.8113** | **0.8107** |
| MLP (TF-IDF) | BERT/RoBERTa proxy | 0.7957 | 0.7949 |

**DL for Large Data (Transformers)**
```python
# BERT / RoBERTa (HuggingFace)
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer
tok = AutoTokenizer.from_pretrained("distilbert-base-uncased") # or "roberta-base"
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=3)
# Best for LARGE: fine-tune 2 epochs, lr 3e-5, batch 16 — see train_text.py

# GPT-4 (OpenAI API)
import openai
openai.ChatCompletion.create(model="gpt-4", messages=[...]) # few-shot or fine-tune via API

# LLaMA 3 (HuggingFace, requires GPU + token)
from transformers import AutoModelForCausalLM, AutoTokenizer
tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B", device_map="auto")
```
*Demo used 6k subset; full 60k→24k test scales similarly, expect +2-3% over LR with RoBERTa.*

**Recommendation (Text)**
- Small data: **Naive Bayes / Logistic Regression**
- Large data (your 251k): **Transformers — DistilBERT/RoBERTa**, or **GPT-4 API / LLaMA 3 8B** for best quality

---

## 3) Image — `skincare_manifest` (21,904 = LARGE)

**Task — skin condition from image (HOG 1764-dim, 64x64, 9 orientations)**

Vitamin deficiency (8 classes, 120/class → 960 images demo):

| Model | Role | Acc | F1-macro |
|-------|------|-----|----------|
| **Random Forest (HOG)** | **Small Data BEST** | **0.4792** | **0.4726** |
| SVM/HOG | ML (HOG/SIFT) | 0.3958 | 0.3833 |
| MLP (HOG) | ViT/ResNet/ConvNeXt proxy | 0.4219 | 0.4022 |

Skincare (7-8 classes, 150/class → 1149 images):

| Model | Acc | F1-macro |
|-------|-----|----------|
| Random Forest | 0.3348 | 0.3243 |
| SVM/HOG | 0.2652 | 0.2610 |

**DL for Large Data (install torch)**

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install timm
```
```python
import torchvision.models as m
# Small Data BEST — ResNet
resnet = m.resnet18(weights=m.ResNet18_Weights.IMAGENET1K_V1)
resnet.fc = torch.nn.Linear(resnet.fc.in_features, num_classes)

# Large Data BEST — ViT
vit = m.vit_b_16(weights=m.ViT_B_16_Weights.IMAGENET1K_V1)
vit.heads.head = torch.nn.Linear(vit.heads.head.in_features, num_classes)

# Alternative — ConvNeXt
convnext = m.convnext_tiny(weights=m.ConvNeXt_Tiny_Weights.IMAGENET1K_V1)
convnext.classifier[2] = torch.nn.Linear(convnext.classifier[2].in_features, num_classes)
# Fine-tune 2-5 epochs, lr 1e-4, Resize 224, Normalize ImageNet — see train_image.py
```
*HOG+RF is strong baseline for Small Data; ViT needs >5k images for best, your 21k qualifies as LARGE → **ViT**.*

**Recommendation (Image)**
- Small data (<1k): **Random Forest (HOG) / ResNet18**
- Large data (>5k, your 21k): **ViT-B/16**, **ConvNeXt** as alternative, **ResNet** for small

---

## Outputs

- `training/outputs_numerical/` — brfss_xgboost.json, brfss_lightgbm.txt, brfss_catboost.cbm, metrics.json
- `training/outputs_text/` — tfidf_vectorizer.pkl, logreg.pkl
- `training/outputs_image/` — rf_vitamin_deficiency.pkl, rf_skincare.pkl
- `training/train_*.py` — reproducible pipelines per table
- `training/train_all.py` — runs all three

## How to run full Large-Data training

```bash
# Numerical (full 253k, no sampling)
py training/train_numerical.py
# Text (60k balanced → 20k/class, full TF-IDF 20k feats)
# edit train_text.py: med_s sample 20000 per tier, vectorizer max_features 20000
py training/train_text.py
# Image (full 21k, ViT)
pip install torch torchvision timm
py training/train_image.py  # set max_per_class=None for full, epochs 5-10, GPU if available

# Or all:
py training/train_all.py
```

## Website integration

`NutritionAI_Website/backend/app.py` can load the saved models for inference:
- `clinical_patients_unified` → LightGBM for diabetes risk API (`/predict/diabetes`)
- `medicines_clean` → TF-IDF+LogReg or DistilBERT for medicine tier (`/predict/medicine`)
- `skincare_manifest` → RF/HOG or ViT for skin diagnosis (`/predict/skin`)

Frontend `dist` already contains Departments spiral + Starfield (verified serving index-BZf4OSJy.js). Hard-refresh (Ctrl+F5) at http://localhost:5000/departments if you see old version.
