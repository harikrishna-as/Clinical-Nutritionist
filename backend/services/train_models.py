"""
Train all three improved models for the NutritionAI website:
  1. deficiency_clf.joblib  - vitamin deficiency (all 16,424 images, 8 classes)
  2. skin_clf.joblib        - acne / eczema / normal skin conditions (4,550 images)
  3. diabetes_clf.joblib    - diabetes risk from BRFSS 2015 (253,680 patients)
Saves into backend/models for the Flask API.
"""
import os
import sys
import numpy as np
import joblib
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, "..", "models")
DATASETS = r"D:\Clinical Nutritionist datasets"
OLD = os.path.join(DATASETS, "Old datasets")
os.makedirs(OUT_DIR, exist_ok=True)

IMG_SIZE = (64, 64)


def extract_features(img):
    img = img.convert("RGB").resize(IMG_SIZE, Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
    h, s, v = hsv[:, :, 0] / 179.0, hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0
    feats = []
    for ch in (r, g, b, h, s, v):
        hist, _ = np.histogram(ch, bins=16, range=(0, 1))
        feats.append(hist / (hist.sum() + 1e-6))
    for ch in (r, g, b, s, v):
        feats.append([float(ch.mean()), float(ch.std())])
    for ch_a, ch_b in [(r, g), (r, b), (g, b)]:
        d = ch_a - ch_b
        feats.append([float(d.mean()), float(d.std())])
    gray = np.asarray(img.convert("L"), dtype=np.float32) / 255.0
    gx = gray[:, 1:] - gray[:, :-1]
    gy = gray[1:, :] - gray[:-1, :]
    mag = np.sqrt(gx[:-1, :] ** 2 + gy[:, :-1] ** 2)
    feats.append([float(mag.mean()), float(mag.std())])
    grid = gray.reshape(8, 8, 8, 8).mean(axis=(1, 3))
    feats.append(grid.flatten())
    return np.concatenate(feats)


def load_folder_images(root, class_dirs, max_per_class=None):
    X, y, names = [], [], []
    for idx, cls in enumerate(class_dirs):
        folder = os.path.join(root, cls)
        if not os.path.isdir(folder):
            print(f"  MISSING folder: {cls}")
            continue
        files = sorted(f for f in os.listdir(folder)
                       if f.lower().endswith((".jpg", ".png", ".jpeg")))
        if max_per_class:
            files = files[:max_per_class]
        print(f"  {cls}: {len(files)} images")
        for fname in files:
            try:
                img = Image.open(os.path.join(folder, fname))
                X.append(extract_features(img))
                y.append(idx)
                names.append(cls)
            except Exception:
                continue
    return np.array(X), np.array(y), names


def train_and_save(X, y, labels, model_name, clf_kind="rf"):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    if clf_kind == "lr":
        clf = LogisticRegression(max_iter=2000, C=1.0, solver="lbfgs", n_jobs=-1)
    else:
        clf = RandomForestClassifier(n_estimators=300, max_depth=16, random_state=42, n_jobs=-1)
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", clf)])
    print(f"\nTraining {model_name} ({clf_kind}) on {X_train.shape[0]} samples...")
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=labels[:len(np.unique(y))], zero_division=0))
    path = os.path.join(OUT_DIR, model_name)
    joblib.dump({"model": pipe, "classes": labels[:len(np.unique(y))], "img_size": IMG_SIZE}, path)
    print(f"Saved {path}")
    return acc


def train_deficiency():
    print("=" * 70)
    print("1. VITAMIN DEFICIENCY CLASSIFIER (archive/dataset, all classes)")
    print("=" * 70)
    root = os.path.join(OLD, "archive", "dataset")
    classes = [
        "Vitamin A deficiency", "Vitamin B complex deficiency", "Vitamin B-12 deficiency",
        "Vitamin B2 deficiency", "Vitamin B3 deficieny", "Vitamin B9 deficiency",
        "Vitamin C deficiency", "Vitamin D deficiency",
    ]
    labels = ["vitamin_a", "vitamin_b_complex", "vitamin_b12", "vitamin_b2",
              "vitamin_b3", "vitamin_b9", "vitamin_c", "vitamin_d"]
    X, y, _ = load_folder_images(root, classes, max_per_class=2500)
    print(f"Total samples: {len(X)}, features: {X.shape[1]}")
    return train_and_save(X, y, labels, "deficiency_clf.joblib", "rf")


def train_skin():
    print("=" * 70)
    print("2. SKIN CONDITION CLASSIFIER (acne / eczema / normal)")
    print("=" * 70)
    split_root = os.path.join(OLD, "Dataset", "Dataset")
    class_names = ["Acne_Mild", "Acne_Moderate", "Acne_Severe",
                   "Eczema_Mild", "Eczema_Moderate", "Eczema_Severe", "Normal"]
    root = os.path.join(DATASETS, "prepared", "skin_training")
    os.makedirs(root, exist_ok=True)
    # merge train+val+test into one folder-per-class so the loader works
    import shutil
    for cls in class_names:
        target = os.path.join(root, cls)
        os.makedirs(target, exist_ok=True)
        for split in ["train", "val", "test"]:
            src = os.path.join(split_root, split, cls)
            if not os.path.isdir(src):
                continue
            for f in os.listdir(src):
                if f.lower().endswith((".jpg", ".png", ".jpeg")):
                    dest = os.path.join(target, f)
                    if not os.path.exists(dest):
                        shutil.copy2(os.path.join(src, f), dest)
    labels = ["acne_mild", "acne_moderate", "acne_severe",
              "eczema_mild", "eczema_moderate", "eczema_severe", "normal"]
    X, y, _ = load_folder_images(root, class_names)
    print(f"Total samples: {len(X)}, features: {X.shape[1]}")
    return train_and_save(X, y, labels, "skin_clf.joblib", "rf")


def train_diabetes():
    print("=" * 70)
    print("3. DIABETES RISK CLASSIFIER (BRFSS 2015, 253k patients)")
    print("=" * 70)
    import pandas as pd
    p = os.path.join(OLD, "diabetes_012_health_indicators_BRFSS2015.csv",
                     "diabetes_012_health_indicators_BRFSS2015.csv")
    df = pd.read_csv(p, low_memory=False)
    feat_cols = ["HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke",
                 "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies",
                 "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "GenHlth",
                 "MentHlth", "PhysHlth", "DiffWalk", "Sex", "Age", "Education", "Income"]
    X = df[feat_cols].astype(float).values
    y = (df["Diabetes_012"] > 0).astype(int).values
    print(f"X {X.shape}, label balance: {y.mean():.3f}")

    # subsample negative class for balance (253k -> ~154k total)
    neg_i = np.where(y == 0)[0]
    pos_i = np.where(y == 1)[0]
    np.random.seed(42)
    neg_sel = np.random.choice(neg_i, min(len(neg_i), int(len(pos_i) * 1.5)), replace=False)
    sel = np.concatenate([pos_i, neg_sel])
    np.random.shuffle(sel)
    X, y = X[sel], y[sel]
    print(f"Balanced: X {X.shape}, label balance: {y.mean():.3f}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=500, C=0.5, solver="lbfgs", n_jobs=-1)),
    ])
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["no_diabetes", "diabetes"], zero_division=0))
    path = os.path.join(OUT_DIR, "diabetes_clf.joblib")
    joblib.dump({"model": pipe, "features": feat_cols, "classes": ["no_diabetes", "diabetes"]}, path)
    print(f"Saved {path}")
    return acc


if __name__ == "__main__":
    train_deficiency()
    train_skin()
    train_diabetes()
    print("\nALL MODELS TRAINED.")