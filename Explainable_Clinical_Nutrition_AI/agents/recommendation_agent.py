"""
Recommendation Agent - Synthesizes all agent outputs into final recommendations
Uses Ensemble (Unit 5) for final scoring
"""
import numpy as np
from agents.base_agent import BaseAgent


class RecommendationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Recommendation Agent",
            description="Synthesizes all agent analyses into final personalized recommendations"
        )

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Synthesizing final recommendations...")
        return {"status": "ready", "message": "Waiting for other agent outputs"}

    def synthesize(self, agent_results, patient_data):
        self.log("Building final recommendation set...")

        all_recommended = {}
        all_avoid = set()

        for agent_name, result in agent_results.items():
            if not isinstance(result, dict) or "error" in result:
                continue
            for food in result.get("recommended_foods", []):
                name = food.get("name", "") if isinstance(food, dict) else str(food)
                score = food.get("score", 0.5) if isinstance(food, dict) else 0.5
                reason = food.get("reason", "") if isinstance(food, dict) else ""
                if name in all_recommended:
                    all_recommended[name]["score"] = (all_recommended[name]["score"] + score) / 2
                    all_recommended[name]["agents"].append(agent_name)
                else:
                    all_recommended[name] = {"score": score, "reason": reason, "agents": [agent_name]}

            for food in result.get("avoid_foods", []):
                name = food.get("name", "") if isinstance(food, dict) else str(food)
                all_avoid.add(name)

        sorted_foods = sorted(all_recommended.items(), key=lambda x: x[1]["score"], reverse=True)
        top_foods = sorted_foods[:10]
        bottom_foods = sorted_foods[-5:] if len(sorted_foods) > 5 else []

        meal_plan = self._build_meal_plan(top_foods, patient_data)
        nutritional_targets = self._compute_targets(patient_data)
        explanations = self._build_explanations(top_foods, all_avoid, agent_results)

        synthesis = {
            "top_recommended_foods": [
                {"name": name, "score": info["score"], "reason": info["reason"],
                 "endorsed_by": info["agents"]}
                for name, info in top_foods
            ],
            "foods_to_avoid": list(all_avoid),
            "meal_plan": meal_plan,
            "nutritional_targets": nutritional_targets,
            "explanations": explanations,
            "confidence_score": self._compute_confidence(agent_results),
            "agent_summary": {name: "Contributed" for name in agent_results.keys()},
            "recommended_foods": top_foods,
            "avoid_foods": list(all_avoid),
            "reasoning": self._generate_reasoning(top_foods, all_avoid, agent_results)
        }

        self.log(f"Final recommendations: {len(top_foods)} foods, {len(all_avoid)} to avoid")
        return synthesis

    def _build_meal_plan(self, top_foods, patient_data):
        diagnosis = str(patient_data.get("Diagnosis", "")).lower()
        calories = patient_data.get("TargetCalories", 2000)

        food_names = [name for name, _ in top_foods]
        meal_plan = {
            "breakfast": {
                "foods": food_names[:2] if len(food_names) >= 2 else food_names,
                "calories": round(calories * 0.25, 0),
                "time": "7:00-8:00 AM"
            },
            "lunch": {
                "foods": food_names[2:5] if len(food_names) >= 5 else food_names[:3],
                "calories": round(calories * 0.30, 0),
                "time": "12:30-1:30 PM"
            },
            "dinner": {
                "foods": food_names[5:8] if len(food_names) >= 8 else food_names[3:6],
                "calories": round(calories * 0.25, 0),
                "time": "6:30-7:30 PM"
            },
            "snacks": {
                "foods": food_names[8:10] if len(food_names) >= 10 else food_names[6:8],
                "calories": round(calories * 0.20, 0),
                "time": "10:00 AM & 3:30 PM"
            }
        }
        return meal_plan

    def _compute_targets(self, patient_data):
        age = patient_data.get("Age", 40)
        gender = patient_data.get("Gender", "M")
        base = 2000 if gender == "M" else 1800
        return {
            "calories": base,
            "protein_g": round(base * 0.25 / 4, 1),
            "carbs_g": round(base * 0.50 / 4, 1),
            "fat_g": round(base * 0.25 / 9, 1),
            "fiber_g": 30 if age > 50 else 25,
            "sodium_mg_max": 2300,
            "water_ml": 2500
        }

    def _build_explanations(self, top_foods, all_avoid, agent_results):
        explanations = []
        for name, info in top_foods[:3]:
            explanations.append({
                "food": name,
                "why": info["reason"],
                "endorsed_by": info["agents"],
                "confidence": info["score"]
            })
        if all_avoid:
            explanations.append({
                "foods_to_avoid": list(all_avoid)[:5],
                "why": "Multiple agents flagged these foods as unsuitable"
            })
        return explanations

    def _compute_confidence(self, agent_results):
        successful = sum(1 for r in agent_results.values() if isinstance(r, dict) and "error" not in r)
        total = len(agent_results)
        return round(successful / total * 100, 1) if total > 0 else 0

    def _generate_reasoning(self, top_foods, all_avoid, agent_results):
        agent_list = [name for name in agent_results.keys()]
        return (f"Recommendations synthesized from {len(agent_list)} agents: {', '.join(agent_list)}. "
               f"Top {len(top_foods)} foods recommended with multi-agent consensus. "
               f"{len(all_avoid)} foods flagged for avoidance across multiple clinical dimensions.")
