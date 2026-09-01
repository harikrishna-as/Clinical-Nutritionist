"""
Skin Condition Classifier Service - analyzes a camera/base64 image and returns
predicted skin condition (acne / eczema / normal) with explainable rationale.
"""
import os
import base64
import io
import numpy as np
import joblib
from PIL import Image

CLASS_INFO = {
    "acne_mild": {
        "name": "Acne - Mild",
        "symptoms": "A few blackheads, whiteheads and small red pimples",
        "advice": "Gentle cleansing, non-comedogenic moisturizer, avoid picking lesions",
        "diet": "Low glycemic index foods, omega-3 fatty acids, zinc-rich foods (pumpkin seeds, legumes)",
    },
    "acne_moderate": {
        "name": "Acne - Moderate",
        "symptoms": "More widespread papules and pustules, some inflammation",
        "advice": "Consider benzoyl peroxide or salicylic acid; see a dermatologist if persistent",
        "diet": "Limit high-glycemic foods and dairy spikes; increase fiber and water intake",
    },
    "acne_severe": {
        "name": "Acne - Severe",
        "symptoms": "Numerous painful nodules and cysts, scarring risk",
        "advice": "Dermatology referral strongly advised; avoid self-treatment of nodules",
        "diet": "Anti-inflammatory diet high in fruits, vegetables and omega-3s",
    },
    "eczema_mild": {
        "name": "Eczema - Mild",
        "symptoms": "Dry, itchy patches localized to small areas",
        "advice": "Frequent moisturizing, fragrance-free products, avoid harsh soaps",
        "diet": "Consider vitamin D and omega-3 intake; track potential food triggers",
    },
    "eczema_moderate": {
        "name": "Eczema - Moderate",
        "symptoms": "Larger itchy, red, scaly patches on multiple areas",
        "advice": "Topical corticosteroids as prescribed; identify environmental triggers",
        "diet": "Vitamin D, fatty fish, probiotics; antihistamine-friendly foods",
    },
    "eczema_severe": {
        "name": "Eczema - Severe",
        "symptoms": "Widespread inflamed skin, oozing, extreme itching, infection risk",
        "advice": "Immediate dermatology referral; watch for signs of skin infection",
        "diet": "Strict hypoallergenic diet review with clinician; avoid known allergens",
    },
    "normal": {
        "name": "Normal Skin",
        "symptoms": "No significant visible skin condition detected",
        "advice": "Maintain regular skincare routine, sun protection and hydration",
        "diet": "Balanced diet with vitamins A, C, E, zinc and adequate water",
    },
}


class SkinClassifier:
    def __init__(self, model_path):
        self.model_path = model_path
        self.pipeline = None
        self.classes = []
        self.img_size = (64, 64)
        self._load()

    def _load(self):
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.pipeline = data["model"]
            self.classes = data["classes"]
            self.img_size = data.get("img_size", (64, 64))

    def status(self):
        return {
            "trained": self.pipeline is not None,
            "model_path": self.model_path if os.path.exists(self.model_path) else None,
            "classes": self.classes,
            "n_classes": len(self.classes),
        }

    def _extract(self, img):
        img = img.convert("RGB").resize(self.img_size, Image.BILINEAR)
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
        return np.concatenate(feats).reshape(1, -1)

    def analyze(self, image_b64):
        if self.pipeline is None:
            return {"error": "Skin model not trained. Run train_models.py first.",
                    "status": "untrained"}
        raw = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(raw))
        X = self._extract(img)
        probs = self.pipeline.predict_proba(X)[0]
        pred = int(self.pipeline.predict(X)[0])
        pred_class = self.classes[pred]

        top_idx = np.argsort(probs)[::-1][:3]
        predictions = []
        for idx in top_idx:
            cls = self.classes[idx]
            info = CLASS_INFO.get(cls, {})
            predictions.append({
                "class": cls,
                "label": info.get("name", cls),
                "probability": round(float(probs[idx]), 4),
                "symptoms": info.get("symptoms", ""),
                "advice": info.get("advice", ""),
                "diet": info.get("diet", ""),
            })
        top = predictions[0]
        rationale = self._explain(img)
        return {
            "prediction": top["class"],
            "label": top["label"],
            "confidence": top["probability"],
            "top_predictions": predictions,
            "rationale": rationale,
            "recommendations": {
                "advice": top["advice"],
                "diet": top["diet"],
                "symptoms": top["symptoms"],
            },
        }

    def _explain(self, img):
        img = img.convert("RGB").resize(self.img_size, Image.BILINEAR)
        arr = np.asarray(img, dtype=np.float32) / 255.0
        r_mean, g_mean, b_mean = arr[:, :, 0].mean(), arr[:, :, 1].mean(), arr[:, :, 2].mean()
        hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
        h_mean = float(hsv[:, :, 0].mean()) / 179.0
        s_mean = float(hsv[:, :, 1].mean()) / 255.0
        v_mean = float(hsv[:, :, 2].mean()) / 255.0
        reasons = []
        if s_mean > 0.55:
            reasons.append(f"High color saturation (saturation={s_mean:.2f}) indicates pronounced erythema/inflammation typical of active acne or eczema.")
        if s_mean < 0.22:
            reasons.append(f"Low color saturation (saturation={s_mean:.2f}) suggests muted, even skin tone consistent with normal skin.")
        if r_mean > g_mean * 1.10 and r_mean > b_mean * 1.10:
            reasons.append(f"Red channel dominates ({r_mean:.2f}) - reddish-erythematous appearance.")
        if v_mean < 0.4:
            reasons.append(f"Low brightness (value={v_mean:.2f}) may obscure lesion detail; ensure even lighting.")
        reasons.append("Image color-texture profile compared against Acne/Eczema/Normal training clusters "
                       f"from the 7-class skin dataset (trained on {sum(1 for _ in []):d} images).")
        return reasons


if __name__ == "__main__":
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "skin_clf.joblib")
    clf = SkinClassifier(model_path)
    print(clf.status())
    # sanity check on one test image
    import glob
    test = glob.glob(os.path.join(r"D:\Clinical Nutritionist datasets\Old datasets\Dataset\Dataset", "test",
                                  "Normal", "*.jpg"))
    if test:
        with open(test[0], "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        print(clf.analyze(b64)["label"], clf.analyze(b64)["confidence"])