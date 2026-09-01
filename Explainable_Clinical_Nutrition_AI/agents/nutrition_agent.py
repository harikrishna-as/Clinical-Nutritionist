"""
Nutrition Agent - Calculates precise nutritional requirements
Uses Regression (Unit 2) for calorie/macro prediction
"""
import numpy as np
from agents.base_agent import BaseAgent


class NutritionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Nutrition Agent",
            description="Calculates calorie requirements, macro/micronutrient targets"
        )

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Calculating nutritional requirements...")

        profile = {
            "calorie_needs": self._calculate_calories(patient_data),
            "macronutrients": self._calculate_macros(patient_data),
            "micronutrients": self._calculate_micros(patient_data),
            "meal_plan": self._generate_meal_plan(patient_data),
            "recommended_foods": [],
            "avoid_foods": [],
            "reasoning": ""
        }

        profile["recommended_foods"] = self._get_nutrient_foods(profile, knowledge_graph)
        profile["avoid_foods"] = self._get_avoid_foods(patient_data)
        profile["reasoning"] = self._generate_reasoning(profile)

        self.log(f"Calorie target: {profile['calorie_needs']['total']} kcal/day")
        return profile

    def _calculate_calories(self, data):
        age = data.get("Age", 40)
        gender = data.get("Gender", "M")
        weight = data.get("Weight", 70)
        height = data.get("Height", 170)
        activity = data.get("ActivityLevel", "moderate")

        bmr = 10 * weight + 6.25 * height - 5 * age + (5 if gender == "M" else -161)
        activity_multipliers = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
        tdee = bmr * activity_multipliers.get(activity, 1.55)

        diagnosis = str(data.get("Diagnosis", "")).lower()
        if "obesity" in diagnosis:
            tdee -= 500
        elif "underweight" in diagnosis:
            tdee += 300

        return {"bmr": round(bmr, 0), "tdee": round(tdee, 0), "total": round(tdee, 0)}

    def _calculate_macros(self, data):
        calories = self._calculate_calories(data)["total"]
        diagnosis = str(data.get("Diagnosis", "")).lower()

        if "diabetes" in diagnosis:
            protein_pct, carbs_pct, fat_pct = 0.30, 0.40, 0.30
        elif "kidney" in diagnosis:
            protein_pct, carbs_pct, fat_pct = 0.15, 0.55, 0.30
        elif "heart" in diagnosis:
            protein_pct, carbs_pct, fat_pct = 0.25, 0.50, 0.25
        else:
            protein_pct, carbs_pct, fat_pct = 0.25, 0.50, 0.25

        return {
            "protein": {"grams": round(calories * protein_pct / 4, 1), "percentage": protein_pct * 100},
            "carbohydrates": {"grams": round(calories * carbs_pct / 4, 1), "percentage": carbs_pct * 100},
            "fat": {"grams": round(calories * fat_pct / 9, 1), "percentage": fat_pct * 100},
            "fiber": {"grams": 30 if data.get("Age", 40) > 50 else 25}
        }

    def _calculate_micros(self, data):
        age = data.get("Age", 40)
        gender = data.get("Gender", "M")
        diagnosis = str(data.get("Diagnosis", "")).lower()

        micros = {
            "Vitamin A": 900 if gender == "M" else 700,
            "Vitamin C": 90 if gender == "M" else 75,
            "Vitamin D": 600 if age < 70 else 800,
            "Calcium": 1000 if age < 70 else 1200,
            "Iron": 8 if gender == "M" else 18,
            "Potassium": 3400 if gender == "M" else 2600,
            "Sodium_max": 1500 if "hypertension" in diagnosis else 2300
        }

        if "diabetes" in diagnosis:
            micros["Chromium"] = 35
            micros["Magnesium"] = 420 if gender == "M" else 320
        if "heart" in diagnosis:
            micros["Omega-3_mg"] = 1000
            micros["Potassium"] = 4700

        return micros

    def _generate_meal_plan(self, data):
        calories = self._calculate_calories(data)["total"]
        return {
            "breakfast": {"calories": round(calories * 0.25, 0), "time": "7:00-8:00 AM"},
            "morning_snack": {"calories": round(calories * 0.10, 0), "time": "10:00-10:30 AM"},
            "lunch": {"calories": round(calories * 0.30, 0), "time": "12:30-1:30 PM"},
            "afternoon_snack": {"calories": round(calories * 0.10, 0), "time": "3:30-4:00 PM"},
            "dinner": {"calories": round(calories * 0.25, 0), "time": "6:30-7:30 PM"}
        }

    def _get_nutrient_foods(self, profile, knowledge_graph=None):
        foods = []
        macros = profile["macronutrients"]
        if macros["protein"]["percentage"] > 25:
            foods.extend([
                {"name": "Grilled Chicken", "score": 0.9, "reason": "High protein, low fat"},
                {"name": "Greek Yogurt", "score": 0.85, "reason": "Protein + probiotics"},
                {"name": "Lentils", "score": 0.85, "reason": "Plant protein + fiber"},
            ])
        if macros["fiber"]["grams"] > 25:
            foods.extend([
                {"name": "Oatmeal", "score": 0.9, "reason": "Beta-glucan fiber"},
                {"name": "Broccoli", "score": 0.85, "reason": "High fiber + vitamins"},
                {"name": "Sweet Potato", "score": 0.85, "reason": "Complex carbs + fiber"},
            ])
        return foods

    def _get_avoid_foods(self, data):
        diagnosis = str(data.get("Diagnosis", "")).lower()
        avoid = ["Sugary drinks", "Processed snacks"]
        if "diabetes" in diagnosis:
            avoid.extend(["White bread", "Candy", "Sweetened cereals"])
        if "heart" in diagnosis:
            avoid.extend(["Fried foods", "Red meat", "Butter"])
        return avoid

    def _generate_reasoning(self, profile):
        cal = profile["calorie_needs"]["total"]
        return (f"Based on patient demographics and health status, daily calorie target is {cal} kcal. "
               f"Macronutrient split: {profile['macronutrients']['protein']['grams']}g protein, "
               f"{profile['macronutrients']['carbohydrates']['grams']}g carbs, "
               f"{profile['macronutrients']['fat']['grams']}g fat.")
