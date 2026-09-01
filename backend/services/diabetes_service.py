"""
Diabetes Risk Service - uses the BRFSS 2015 trained model to estimate
diabetes risk from patient vitals and lifestyle factors (explainable).
"""
import os
import numpy as np
import joblib

FEATURE_DEFAULTS = {
    "HighBP": 0, "HighChol": 0, "CholCheck": 1, "BMI": 25.0, "Smoker": 0,
    "Stroke": 0, "HeartDiseaseorAttack": 0, "PhysActivity": 1, "Fruits": 1,
    "Veggies": 1, "HvyAlcoholConsump": 0, "AnyHealthcare": 1, "NoDocbcCost": 0,
    "GenHlth": 2, "MentHlth": 0, "PhysHlth": 0, "DiffWalk": 0, "Sex": 1,
    "Age": 9, "Education": 4, "Income": 6,
}

RISK_LEVELS = [
    (0.15, "Low", "Your estimated diabetes risk is low. Maintain a balanced diet, regular physical activity and routine checkups."),
    (0.35, "Moderate", "Your estimated diabetes risk is moderate. Consider reducing refined carbs and sugar, increasing fiber, and consulting a clinician for a fasting glucose test."),
    (0.60, "High", "Your estimated diabetes risk is high. Strongly recommend clinical evaluation (HbA1c / fasting glucose) and a structured dietary intervention: high fiber, low glycemic index, portion control."),
    (1.01, "Very High", "Your estimated diabetes risk is very high. Immediate clinical consultation is advised. Prioritize whole foods, weight management, and regular glucose monitoring."),
]


class DiabetesRiskService:
    def __init__(self, model_path):
        self.model_path = model_path
        self.pipeline = None
        self.features = []
        self.classes = []
        self._load()

    def _load(self):
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.pipeline = data["model"]
            self.features = data.get("features", [])
            self.classes = data.get("classes", [])

    def status(self):
        return {
            "trained": self.pipeline is not None,
            "model_path": self.model_path if os.path.exists(self.model_path) else None,
            "features": self.features,
            "n_features": len(self.features),
        }

    def predict(self, patient):
        if self.pipeline is None:
            return {"error": "Diabetes model not trained. Run train_models.py first.",
                    "status": "untrained"}
        row = []
        missing = []
        for f in self.features:
            if f in patient and patient[f] is not None and patient[f] != "":
                try:
                    row.append(float(patient[f]))
                except (TypeError, ValueError):
                    row.append(FEATURE_DEFAULTS.get(f, 0))
                    missing.append(f)
            else:
                row.append(FEATURE_DEFAULTS.get(f, 0))
                missing.append(f)
        X = np.array(row).reshape(1, -1)
        proba = float(self.pipeline.predict_proba(X)[0][1])
        risk = self.classes[1] if self.pipeline.predict(X)[0] == 1 else self.classes[0]
        level, label, advice = RISK_LEVELS[0]
        for thr, lvl, adv in RISK_LEVELS:
            if proba >= thr:
                level, label, advice = lvl, lvl, adv
        # explainable: top contributing factors (coefficients from logistic model)
        coef = getattr(self.pipeline.named_steps.get("clf"), "coef_", None)
        factors = []
        if coef is not None:
            std_row = self.pipeline.named_steps["scaler"].transform(X)[0]
            contrib = std_row * coef[0]
            top = np.argsort(np.abs(contrib))[::-1][:5]
            for i in top:
                if 0 <= i < len(self.features):
                    direction = "raises" if contrib[i] > 0 else "lowers"
                    factors.append({
                        "feature": self.features[i],
                        "value": float(patient.get(self.features[i], FEATURE_DEFAULTS.get(self.features[i]))),
                        "contribution": round(float(contrib[i]), 4),
                        "effect": direction,
                    })
        return {
            "risk_score": round(proba, 4),
            "risk_percent": round(proba * 100, 1),
            "prediction": risk,
            "risk_level": label,
            "advice": advice,
            "top_factors": factors,
            "missing_features": missing,
        }


if __name__ == "__main__":
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "diabetes_clf.joblib")
    svc = DiabetesRiskService(model_path)
    print(svc.status())
    print(svc.predict({"BMI": 32, "Age": 12, "HighBP": 1, "GenHlth": 4, "Smoker": 1}))