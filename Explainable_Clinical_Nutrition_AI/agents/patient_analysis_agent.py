"""
Patient Analysis Agent - Analyzes EHR, lab reports, medical history
Uses Classification (Unit 3) and Regression (Unit 2) models
"""
import numpy as np
import pandas as pd
from agents.base_agent import BaseAgent


class PatientAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Patient Analysis Agent",
            description="Analyzes patient health records, lab reports, and medical history"
        )
        self.risk_thresholds = {
            "glucose_normal": 100, "glucose_prediabetic": 126,
            "bp_systolic_normal": 120, "bp_systolic_high": 140,
            "cholesterol_normal": 200, "cholesterol_high": 240,
            "bmi_normal": 25, "bmi_obese": 30
        }

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Starting patient health analysis...")

        health_profile = {
            "demographics": self._extract_demographics(patient_data),
            "health_metrics": self._extract_health_metrics(patient_data),
            "risk_assessment": self._assess_risks(patient_data),
            "nutritional_needs": self._estimate_nutritional_needs(patient_data),
            "recommended_foods": [],
            "avoid_foods": [],
            "reasoning": ""
        }

        health_profile["recommended_foods"] = self._get_health_based_foods(
            health_profile["risk_assessment"], knowledge_graph
        )
        health_profile["avoid_foods"] = self._get_foods_to_avoid(
            health_profile["risk_assessment"]
        )
        health_profile["reasoning"] = self._generate_reasoning(health_profile)

        self.log(f"Analysis complete. Risks identified: {sum(1 for v in health_profile['risk_assessment'].values() if v)}")
        return health_profile

    def _extract_demographics(self, data):
        return {
            "age": data.get("Age", 50),
            "gender": data.get("Gender", "Unknown"),
            "bmi": data.get("BMI", 25),
        }

    def _extract_health_metrics(self, data):
        return {
            "blood_glucose": data.get("Blood_Glucose", 100),
            "systolic_bp": data.get("Blood_Pressure_Systolic", 120),
            "diastolic_bp": data.get("Blood_Pressure_Diastolic", 80),
            "cholesterol": data.get("Cholesterol_Level", 200),
            "diagnosis": data.get("Diagnosis", "General"),
            "severity": data.get("Severity", "Medium"),
        }

    def _assess_risks(self, data):
        metrics = self._extract_health_metrics(data)
        demographics = self._extract_demographics(data)
        risks = {
            "diabetes_risk": metrics["blood_glucose"] > self.risk_thresholds["glucose_prediabetic"],
            "hypertension_risk": metrics["systolic_bp"] > self.risk_thresholds["bp_systolic_high"],
            "obesity_risk": demographics["bmi"] > self.risk_thresholds["bmi_obese"],
            "heart_disease_risk": metrics["cholesterol"] > self.risk_thresholds["cholesterol_high"],
            "elderly_risk": demographics["age"] > 65,
        }
        return risks

    def _estimate_nutritional_needs(self, data):
        demographics = self._extract_demographics(data)
        metrics = self._extract_health_metrics(data)
        age = demographics["age"]
        bmi = demographics["bmi"]
        gender = demographics["gender"]

        base_calories = 2000 if gender == "M" else 1800
        if age > 65:
            base_calories -= 200
        if metrics["diagnosis"] and "obesity" in str(metrics["diagnosis"]).lower():
            base_calories -= 500

        protein_g = 0.8 * (70 if gender == "M" else 60)
        if metrics["diagnosis"] and "kidney" in str(metrics["diagnosis"]).lower():
            protein_g *= 0.6

        return {
            "target_calories": base_calories,
            "protein_g": round(protein_g, 1),
            "carbs_g": round(base_calories * 0.45 / 4, 1),
            "fat_g": round(base_calories * 0.25 / 9, 1),
            "fiber_g": 30 if age > 50 else 25,
            "sodium_mg": 1500 if metrics["systolic_bp"] > 140 else 2300,
            "water_ml": 2500 if age > 65 else 3000
        }

    def _get_health_based_foods(self, risks, knowledge_graph=None):
        foods = []
        if risks.get("diabetes_risk"):
            foods.extend([
                {"name": "Quinoa", "score": 0.9, "reason": "Low GI, high fiber"},
                {"name": "Salmon", "score": 0.85, "reason": "Omega-3, protein"},
                {"name": "Leafy Greens", "score": 0.9, "reason": "Low calorie, high nutrients"},
            ])
        if risks.get("hypertension_risk"):
            foods.extend([
                {"name": "Banana", "score": 0.8, "reason": "High potassium"},
                {"name": "Oatmeal", "score": 0.85, "reason": "Beta-glucan lowers BP"},
                {"name": "Beets", "score": 0.8, "reason": "Nitric oxide vasodilation"},
            ])
        if risks.get("heart_disease_risk"):
            foods.extend([
                {"name": "Walnuts", "score": 0.85, "reason": "Omega-3 fatty acids"},
                {"name": "Olive Oil", "score": 0.9, "reason": "Monounsaturated fats"},
                {"name": "Avocado", "score": 0.85, "reason": "Heart-healthy fats"},
            ])
        if not any(risks.values()):
            foods.extend([
                {"name": "Balanced Meal", "score": 0.8, "reason": "General health maintenance"},
                {"name": "Fruits", "score": 0.85, "reason": "Vitamins and antioxidants"},
            ])
        return foods

    def _get_foods_to_avoid(self, risks):
        avoid = []
        if risks.get("diabetes_risk"):
            avoid.extend(["Sugary drinks", "White bread", "Pastries"])
        if risks.get("hypertension_risk"):
            avoid.extend(["Processed meats", "Pickles", "Canned soups"])
        if risks.get("heart_disease_risk"):
            avoid.extend(["Trans fats", "Red meat", "Fried foods"])
        if risks.get("obesity_risk"):
            avoid.extend(["Sweets", "Chips", "Soda"])
        return avoid

    def _generate_reasoning(self, profile):
        risks = profile["risk_assessment"]
        active_risks = [k.replace("_risk", "") for k, v in risks.items() if v]
        if active_risks:
            return (f"Patient has elevated risk for: {', '.join(active_risks)}. "
                   f"Nutritional targets adjusted accordingly.")
        return "Patient shows no major nutritional risk factors. Maintaining balanced diet recommended."
