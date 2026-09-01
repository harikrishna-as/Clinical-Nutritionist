"""
Train a lightweight vitamin deficiency classifier from the actual image datasets.
Uses HSV + RGB color histograms and texture features with a RandomForest.
Images are resized, features extracted, and a model is saved for the web API.
"""
import os
import sys
import numpy as np
import joblib
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

BASE = r"D:\Clinical Nutritionist datasets\archive\dataset"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(OUT_DIR, exist_ok=True)

CLASSES = [
    "Vitamin A deficiency",
    "Vitamin B complex deficiency",
    "Vitamin B-12 deficiency",
    "Vitamin B2 deficiency",
    "Vitamin B3 deficieny",
    "Vitamin B9 deficiency",
    "Vitamin C deficiency",
    "Vitamin D deficiency",
]

# Class IDs for the API (short labels)
LABELS = [
    "vitamin_a", "vitamin_b_complex", "vitamin_b12", "vitamin_b2",
    "vitamin_b3", "vitamin_b9", "vitamin_c", "vitamin_d",
]
IMG_SIZE = (64, 64)
MAX_PER_CLASS = 400  # cap for training speed


def extract_features(img):
    img = img.convert("RGB").resize(IMG_SIZE, Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
    h, s, v = hsv[:, :, 0] / 179.0, hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0

    feats = []
    # 16-bin histograms per channel
    for ch in (r, g, b, h, s, v):
        hist, _ = np.histogram(ch, bins=16, range=(0, 1))
        feats.append(hist / (hist.sum() + 1e-6))

    # global statistics
    for ch in (r, g, b, s, v):
        feats.append([float(ch.mean()), float(ch.std())])

    # channel difference moments
    for ch_a, ch_b in [(r, g), (r, b), (g, b)]:
        d = ch_a - ch_b
        feats.append([float(d.mean()), float(d.std())])

    # edge density via gradient magnitude (Sobel-like using numpy diff)
    gray = np.asarray(img.convert("L"), dtype=np.float32) / 255.0
    gx = gray[:, 1:] - gray[:, :-1]  # (64,63)
    gy = gray[1:, :] - gray[:-1, :]  # (63,64)
    mag = np.sqrt(gx[:-1, :] ** 2 + gy[:, :-1] ** 2)  # (63,63)
    feats.append([float(mag.mean()), float(mag.std())])

    # brightness variance grid (8x8) as texture
    grid = gray.reshape(8, 8, 8, 8).mean(axis=(1, 3))
    feats.append(grid.flatten())

    return np.concatenate(feats)


def load_all():
    X, y = [], []
    for idx, cls in enumerate(CLASSES):
        folder = os.path.join(BASE, cls)
        if not os.path.isdir(folder):
            print(f"  MISSING folder: {cls}")
            continue
        files = [f for f in os.listdir(folder)
                 if f.lower().endswith((".jpg", ".png", ".jpeg"))]
        files = files[:MAX_PER_CLASS]
        print(f"  {cls}: {len(files)} images")
        for fname in files:
            try:
                img = Image.open(os.path.join(folder, fname))
                feats = extract_features(img)
                X.append(feats)
                y.append(idx)
            except Exception:
                continue
    return np.array(X), np.array(y)


def main():
    print("Loading images and extracting features...")
    X, y = load_all()
    print(f"Total samples: {len(X)}, features: {X.shape[1]}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200, max_depth=14, random_state=42, n_jobs=-1)),
    ])
    print("Training RandomForest classifier...")
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=LABELS[:len(np.unique(y))], zero_division=0))

    model_path = os.path.join(OUT_DIR, "deficiency_clf.joblib")
    joblib.dump({"model": pipe, "classes": LABELS[:len(np.unique(y))], "img_size": IMG_SIZE}, model_path)
    print(f"Saved model to {model_path}")


if __name__ == "__main__":
    main()
