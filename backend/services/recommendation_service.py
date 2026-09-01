"""
Recommendation Service - generates personalized nutrition recommendations
by running the project's real multi-agent system.
"""
import os
import sys


class RecommendationService:
    def __init__(self, ai_root):
        self.ai_root = ai_root
        sys.path.insert(0, ai_root)

    def generate(self, patient):
        try:
            return self._run_full(patient)
        except Exception:
            return self._fallback(patient)

    def _build_sample(self, patient):
        age = int(float(patient.get("Age", 45)))
        gender = str(patient.get("Gender", "M")).upper()
        weight = float(patient.get("Weight", 70))
        height_cm = float(patient.get("Height", 170))
        activity = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}.get(
            str(patient.get("ActivityLevel", "moderate")).lower(), 1.375)
        if gender == "M":
            bmr = 10 * weight + 6.25 * height_cm - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height_cm - 5 * age - 161
        calories = int(round(bmr * activity))

        return {
            "PatientID": patient.get("PatientID", "WEB_001"),
            "Age": age,
            "Gender": gender,
            "BMI": float(patient.get("BMI", 25)),
            "Blood_Glucose": float(patient.get("Blood_Glucose", 100)),
            "Blood_Pressure_Systolic": float(patient.get("Blood_Pressure_Systolic", 120)),
            "Blood_Pressure_Diastolic": float(patient.get("Blood_Pressure_Diastolic", 80)),
            "Cholesterol_Level": float(patient.get("Cholesterol_Level", 200)),
            "Diagnosis": patient.get("Diagnosis", "General"),
            "Severity": patient.get("Severity", "Medium"),
            "Weight": weight,
            "Height": height_cm,
            "Allergies": patient.get("Allergies", []),
            "Medications": patient.get("Medications", []),
            "CulturalPreference": patient.get("CulturalPreference", "General"),
            "ActivityLevel": patient.get("ActivityLevel", "moderate"),
            "TargetCalories": calories,
        }

    def _run_full(self, patient):
        from agents.base_agent import AgentOrchestrator
        from agents.patient_analysis_agent import PatientAnalysisAgent
        from agents.nutrition_agent import NutritionAgent
        from agents.allergy_agent import AllergyAgent
        from agents.medication_diet_agent import MedicationDietAgent
        from agents.cultural_agent import CulturalAgent
        from agents.recommendation_agent import RecommendationAgent
        from knowledge_graph.food_knowledge_graph import FoodKnowledgeGraph

        sample = self._build_sample(patient)

        kg = FoodKnowledgeGraph()
        kg.build_from_datasets()

        orchestrator = AgentOrchestrator()
        for agent in [PatientAnalysisAgent(), NutritionAgent(), AllergyAgent(),
                      MedicationDietAgent(), CulturalAgent(), RecommendationAgent()]:
            orchestrator.register_agent(agent)

        agent_results = orchestrator.run_all_agents(sample, kg)
        consensus = orchestrator.get_recommendations()

        recommendations = []
        for food in consensus.get("recommended_foods", [])[:12]:
            if isinstance(food, (list, tuple)) and len(food) == 2:
                recommendations.append({"name": food[0], "score": round(float(food[1]), 3)})
            elif isinstance(food, dict):
                recommendations.append(food)
            else:
                recommendations.append({"name": str(food), "score": 0.5})

        foods_to_avoid = list(consensus.get("foods_to_avoid", []))[:10]

        agent_summary = []
        for name, result in agent_results.items():
            reasoning = ""
            if isinstance(result, dict):
                reasoning = result.get("reasoning", "")
            agent_summary.append({"agent": name, "reasoning": reasoning})

        return {
            "calories_target": sample["TargetCalories"],
            "risk_level": sample["Severity"],
            "diagnosis": sample["Diagnosis"],
            "recommendations": recommendations,
            "foods_to_avoid": foods_to_avoid,
            "reasoning_chain": consensus.get("reasoning_chain", []),
            "agents": agent_summary,
            "engine": "live",
        }

    def _fallback(self, patient):
        diagnosis = patient.get("Diagnosis", "General")
        rules = {
            "Diabetes": {
                "calories": 1800, "advice": ["Low glycemic index foods", "High fiber ≥ 30g", "Limit sugar ≤ 25g"],
                "recommendations": ["Oats", "Leafy Greens", "Quinoa", "Lentils", "Berries"],
                "avoid": ["Sugary drinks", "White bread", "Candy"],
            },
            "Hypertension": {
                "calories": 2000, "advice": ["Reduce sodium ≤ 1500mg", "Increase potassium", "DASH diet pattern"],
                "recommendations": ["Spinach", "Bananas", "Yogurt", "Whole grains"],
                "avoid": ["Processed meats", "Pickles", "Excess salt"],
            },
            "Obesity": {
                "calories": 1600, "advice": ["Calorie deficit ~500 kcal", "High protein ≥ 30%", "Reduce saturated fat"],
                "recommendations": ["Grilled Chicken", "Quinoa", "Leafy Greens", "Berries"],
                "avoid": ["Fried foods", "Sweets", "Sugary drinks"],
            },
            "General": {
                "calories": 2200, "advice": ["Balanced macronutrients", "5 servings vegetables daily"],
                "recommendations": ["Quinoa", "Leafy Greens", "Olive Oil", "Grilled Chicken", "Oatmeal"],
                "avoid": ["Fried foods", "Excessive alcohol", "Processed snacks"],
            },
        }
        rule = rules.get(diagnosis, rules["General"])
        return {
            "calories_target": rule["calories"],
            "risk_level": patient.get("Severity", "Medium"),
            "diagnosis": diagnosis,
            "recommendations": [{"name": f, "score": 0.8} for f in rule["recommendations"]],
            "foods_to_avoid": rule["avoid"],
            "advice": rule["advice"],
            "engine": "fallback",
        }
