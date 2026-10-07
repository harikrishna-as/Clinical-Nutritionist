"""
Text Data Training Pipeline
Maps to your spec:
  DL  : BERT, GPT-4, LLaMA 3, RoBERTa  -> we use DistilBERT/RoBERTa via transformers (lightweight)
  ML  : Logistic Regression, Naive Bayes (TF-IDF)
  Small Data : Naive Bayes / Logistic Regression
  Large Data : Transformers (GPT/LLaMA)  (251k medicines = LARGE)

Tasks:
  1) Medicine price-tier classification from text (name + composition)
  2) Food name category inference (optional, from food_nutrient_unified)
"""
import os, warnings, re, time
warnings.filterwarnings("ignore")
BASE = r"D:\Clinical Nutritionist datasets"
PREP = os.path.join(BASE, "prepared")
OUT  = os.path.join(BASE, "training", "outputs_text")
os.makedirs(OUT, exist_ok=True)

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.preprocessing import LabelEncoder

print("="*78)
print("TEXT TRAINING — Medicines (251k) + Food Names")
print("="*78)

# ---------- Medicines: price tier from text (Large -> Transformers, Small -> NB/LR) ----------
med = pd.read_csv(os.path.join(PREP, "medicines_clean.csv"), low_memory=False)
print(f"Medicines rows {med.shape[0]}")
# Create text field
med["text"] = (med["name"].fillna("") + " " + med["short_composition1"].fillna("") + " " + med["short_composition2"].fillna("")).str.lower()
# Target: price tier (low <100, med 100-300, high >300) — balanced classes
med["price_inr"] = pd.to_numeric(med["price_inr"], errors="coerce")
med = med.dropna(subset=["price_inr","text"])
med = med[med["text"].str.len()>5]
def tier(p):
    if p < 100: return 0
    elif p < 300: return 1
    else: return 2
med["tier"] = med["price_inr"].apply(tier)
print(med["tier"].value_counts())
# Sample 15k for quick training (stratified) — fast demo, use 60k for full Large Data
med_s = med.groupby("tier", group_keys=False).apply(lambda x: x.sample(min(len(x), 5000), random_state=42))
print(f"Sampled {med_s.shape[0]} balanced (demo 15k; scale to 60k for full Large Data)")
X_text = med_s["text"].values
y = med_s["tier"].values

Xtr_t, Xte_t, ytr, yte = train_test_split(X_text, y, test_size=0.2, random_state=42, stratify=y)

# TF-IDF -> ML baselines (Small Data BEST)
vectorizer = TfidfVectorizer(max_features=10000, ngram_range=(1,2), stop_words="english")
Xtr = vectorizer.fit_transform(Xtr_t)
Xte = vectorizer.transform(Xte_t)
print(f"TF-IDF shape train {Xtr.shape} test {Xte.shape}")

# Naive Bayes (Small Data BEST)
nb = MultinomialNB(alpha=0.5)
t0=time.time()
nb.fit(Xtr, ytr)
pred = nb.predict(Xte)
print(f"Naive Bayes (Small Data) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f} time {time.time()-t0:.1f}s")
print(classification_report(yte,pred, digits=3))

# Logistic Regression (Small Data)
lr = LogisticRegression(max_iter=100, n_jobs=-1, C=2.0, solver="saga")
t0=time.time()
lr.fit(Xtr, ytr)
pred = lr.predict(Xte)
print(f"Logistic Regression (Small) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f} time {time.time()-t0:.1f}s")
print(classification_report(yte,pred, digits=3))
import pickle
with open(os.path.join(OUT,"tfidf_vectorizer.pkl"),"wb") as f: pickle.dump(vectorizer,f)
with open(os.path.join(OUT,"logreg.pkl"),"wb") as f: pickle.dump(lr,f)

# DL: Transformers (Large Data BEST) — DistilBERT / RoBERTa
try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
    from datasets import Dataset
    HAS_TRANSFORMERS=True
except Exception as e:
    HAS_TRANSFORMERS=False
    print(f"Transformers not available ({e}) -> using sklearn MLP as DL proxy")
    from sklearn.neural_network import MLPClassifier
    # MLP on TF-IDF as proxy for BERT
    mlp = MLPClassifier(hidden_layer_sizes=(256,128), max_iter=20, early_stopping=True, random_state=42)
    # Use truncated TF-IDF (5000 feats) for MLP speed
    vec2 = TfidfVectorizer(max_features=5000, ngram_range=(1,2), stop_words="english")
    Xtr2 = vec2.fit_transform(Xtr_t)
    Xte2 = vec2.transform(Xte_t)
    mlp.fit(Xtr2, ytr)
    pred = mlp.predict(Xte2)
    print(f"MLP (BERT/RoBERTa proxy) Acc {accuracy_score(yte,pred):.4f} F1-macro {f1_score(yte,pred, average='macro'):.4f}")

if HAS_TRANSFORMERS:
    print("\n[DL] Fine-tuning DistilBERT (RoBERTa alternative) — Large Data BEST")
    # Sample smaller for quick demo (6k) to avoid long training; full 60k would take hours
    # Use 3000 train / 1000 test for demo
    demo_n = 6000
    idx = np.random.choice(len(Xtr_t), min(demo_n, len(Xtr_t)), replace=False)
    Xtr_d = Xtr_t[idx]
    ytr_d = ytr[idx]
    # Use distilbert-base-uncased (lightweight BERT)
    model_name = "distilbert-base-uncased"
    try:
        tok = AutoTokenizer.from_pretrained(model_name, local_files_only=False)
        # Quick tokenization test
        enc = tok(list(Xtr_d[:2]), truncation=True, padding=True, max_length=64)
        print(f" Tokenizer {model_name} ready, vocab {len(tok)}")
        # Build HF dataset
        def tok_fn(ex): return tok(ex["text"], truncation=True, padding=True, max_length=64)
        import datasets as ds
        train_ds = ds.Dataset.from_dict({"text": list(Xtr_d), "label": list(ytr_d)})
        test_ds = ds.Dataset.from_dict({"text": list(Xte_t[:1000]), "label": list(yte[:1000])})
        train_ds = train_ds.map(tok_fn, batched=True)
        test_ds = test_ds.map(tok_fn, batched=True)
        train_ds.set_format(type="torch", columns=["input_ids","attention_mask","label"])
        test_ds.set_format(type="torch", columns=["input_ids","attention_mask","label"])
        model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=3)
        args = TrainingArguments(output_dir=os.path.join(OUT,"bert_out"), per_device_train_batch_size=16, per_device_eval_batch_size=32,
                                 num_train_epochs=2, logging_steps=50, eval_strategy="epoch", save_strategy="no", report_to="none", learning_rate=3e-5)
        from sklearn.metrics import accuracy_score as acc
        def comp(p): return {"accuracy": acc(p.label_ids, p.predictions.argmax(-1))}
        trainer = Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=test_ds, compute_metrics=comp, tokenizer=tok)
        trainer.train()
        res = trainer.evaluate()
        print(f" DistilBERT (BERT/RoBERTa proxy) eval {res}")
        # For GPT-4 / LLaMA 3 note: these are API/large models. For production, use OpenAI API or LLaMA 3 8B via transformers:
        #   model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")  — requires GPU + HF token
        #   For GPT-4, use openai.ChatCompletion.create(model="gpt-4", ...)
        print(" Note: GPT-4 (OpenAI API) and LLaMA 3 (meta-llama/Meta-Llama-3-8B) are large-scale alternatives for >100k text — use API fine-tuning for best Large Data performance.")
    except Exception as e:
        print(f" DistilBERT training skipped (no internet/GPU): {e}")
        print("  -> For Large Text, use: BERT/RoBERTa via HuggingFace, or GPT-4 API / LLaMA 3 8B as per your table.")

print("\nText training DONE. Outputs in", OUT)
