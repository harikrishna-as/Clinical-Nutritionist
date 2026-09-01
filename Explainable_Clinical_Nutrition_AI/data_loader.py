"""
Unit 1: Data Integration - Loading and merging all clinical nutrition datasets
"""
import pandas as pd
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATASETS, NUTRIENT_COLUMNS


class DataLoader:
    def __init__(self):
        self.datasets = {}
        self.integrated_data = None

    def load_all(self):
        print("[DataLoader] Loading all datasets...")
        for name, path in DATASETS.items():
            try:
                if os.path.exists(path):
                    df = pd.read_csv(path, low_memory=False, on_bad_lines="skip")
                    self.datasets[name] = df
                    print(f"  Loaded {name}: {df.shape[0]} rows x {df.shape[1]} cols")
                else:
                    print(f"  SKIPPED {name}: file not found at {path}")
            except Exception as e:
                print(f"  ERROR loading {name}: {e}")
        return self.datasets

    def load_food_nutrition(self):
        if "food_nutrition" not in self.datasets:
            self.datasets["food_nutrition"] = pd.read_csv(
                DATASETS["food_nutrition"], on_bad_lines="skip"
            )
        return self.datasets["food_nutrition"]

    def load_healthcare(self):
        if "healthcare" not in self.datasets:
            self.datasets["healthcare"] = pd.read_csv(DATASETS["healthcare"])
        return self.datasets["healthcare"]

    def load_synthea(self):
        synthea_keys = [k for k in self.datasets if k.startswith("synthea_")]
        if not synthea_keys:
            for name in ["synthea_patients", "synthea_conditions", "synthea_observations",
                         "synthea_medications", "synthea_allergies", "synthea_encounters"]:
                try:
                    self.datasets[name] = pd.read_csv(DATASETS[name], low_memory=False)
                except Exception:
                    pass
        return {k: self.datasets[k] for k in self.datasets if k.startswith("synthea_")}

    def load_usda_data(self):
        usda_keys = ["usda_food", "usda_food_nutrient", "usda_nutrient", "usda_food_category"]
        for name in usda_keys:
            if name not in self.datasets and name in DATASETS:
                try:
                    self.datasets[name] = pd.read_csv(DATASETS[name], low_memory=False)
                except Exception:
                    pass
        return {k: self.datasets[k] for k in self.datasets if k.startswith("usda_")}

    def load_cn_data(self):
        cn_keys = ["cn_food_descriptions", "cn_nutrient_values", "cn_nutrient_descriptions",
                    "cn_food_categories", "cn_portions"]
        for name in cn_keys:
            if name not in self.datasets and name in DATASETS:
                try:
                    self.datasets[name] = pd.read_csv(DATASETS[name], low_memory=False)
                except Exception:
                    pass
        return {k: self.datasets[k] for k in self.datasets if k.startswith("cn_")}

    def integrate_patient_food_data(self):
        """Integrate patient healthcare data with food nutrition data"""
        print("[DataLoader] Integrating patient and food data...")

        healthcare = self.load_healthcare()
        food = self.load_food_nutrition()

        patient_nutrition = pd.DataFrame()
        for idx, row in healthcare.iterrows():
            patient_profiles = []
            age = row.get("Age", 50)
            gender = row.get("Gender", "M")
            diagnosis = row.get("Diagnosis", "General")
            severity = row.get("SeverityLevel", "Medium")
            patient_seed = hash(row.get("PatientID", str(idx))) % 10000

            matching_foods = self._match_foods_to_patient(food, diagnosis, severity, patient_seed)
            if not matching_foods.empty:
                profile = {
                    "PatientID": row.get("PatientID", ""),
                    "Age": age,
                    "Gender": gender,
                    "Diagnosis": diagnosis,
                    "Severity": severity,
                    "Avg_Calories": matching_foods["Calories (kcal)"].mean(),
                    "Avg_Protein": matching_foods["Protein (g)"].mean(),
                    "Avg_Carbs": matching_foods["Carbohydrates (g)"].mean(),
                    "Avg_Fat": matching_foods["Fat (g)"].mean(),
                    "Avg_Fiber": matching_foods["Fiber (g)"].mean(),
                    "Avg_Sugar": matching_foods["Sugars (g)"].mean(),
                    "Avg_Sodium": matching_foods["Sodium (mg)"].mean(),
                    "Food_Count": len(matching_foods),
                    "Readmitted": 1 if row.get("Readmitted") == "Yes" else 0,
                    "TreatmentCost_USD": row.get("TreatmentCost_USD", 0),
                    "LengthOfStay_Days": row.get("LengthOfStay_Days", 0),
                }
                patient_nutrition = pd.concat(
                    [patient_nutrition, pd.DataFrame([profile])], ignore_index=True
                )

        self.integrated_data = patient_nutrition
        print(f"  Integrated dataset: {patient_nutrition.shape[0]} patients")
        return patient_nutrition

    def _match_foods_to_patient(self, food_df, diagnosis, severity, patient_seed=None):
        """Match foods based on patient diagnosis, severity, and patient-specific factors"""
        matched = food_df.copy()
        diagnosis_lower = str(diagnosis).lower()

        if "diabetes" in diagnosis_lower:
            matched = matched[matched["Sugars (g)"] < matched["Sugars (g)"].quantile(0.75)]
        elif "heart" in diagnosis_lower or "cardio" in diagnosis_lower:
            matched = matched[matched["Cholesterol (mg)"] < matched["Cholesterol (mg)"].quantile(0.75)]
        elif "obesity" in diagnosis_lower or "weight" in diagnosis_lower:
            matched = matched[matched["Calories (kcal)"] < matched["Calories (kcal)"].median()]
        elif "cancer" in diagnosis_lower or "tumor" in diagnosis_lower:
            matched = matched[matched["Protein (g)"] > matched["Protein (g)"].quantile(0.25)]
        elif "stroke" in diagnosis_lower:
            matched = matched[matched["Sodium (mg)"] < matched["Sodium (mg)"].quantile(0.75)]
        elif "migraine" in diagnosis_lower or "headache" in diagnosis_lower:
            matched = matched[matched["Fiber (g)"] > matched["Fiber (g)"].quantile(0.25)]

        if severity == "High":
            matched = matched[matched["Fiber (g)"] > matched["Fiber (g)"].quantile(0.25)]
            matched = matched[matched["Protein (g)"] > matched["Protein (g)"].quantile(0.25)]
        elif severity == "Low":
            matched = matched[matched["Calories (kcal)"] < matched["Calories (kcal)"].quantile(0.50)]

        if len(matched) < 10:
            matched = food_df.copy()

        import numpy as np
        rng = np.random.RandomState(patient_seed if patient_seed else 42)
        n_sample = min(50, len(matched))
        indices = rng.choice(matched.index, size=n_sample, replace=False)
        return matched.loc[indices]

    def get_summary(self):
        summary = {}
        for name, df in self.datasets.items():
            summary[name] = {
                "rows": df.shape[0],
                "columns": df.shape[1],
                "column_names": list(df.columns),
                "missing_pct": (df.isnull().sum() / len(df) * 100).to_dict()
            }
        return summary


if __name__ == "__main__":
    loader = DataLoader()
    loader.load_all()
    integrated = loader.integrate_patient_food_data()
    print("\n=== Integrated Data Sample ===")
    print(integrated.head(10))
    print("\n=== Dataset Summary ===")
    for name, info in loader.get_summary().items():
        print(f"{name}: {info['rows']} rows x {info['columns']} cols")
