"""
Medication-Diet Interaction Agent
Analyzes drug-nutrient interactions using Association Rules (Unit 4: Apriori)
"""
from agents.base_agent import BaseAgent


class MedicationDietAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Medication Diet Agent",
            description="Analyzes medication-food interactions and contraindications"
        )
        self.interaction_db = {
            "Warfarin": {
                "avoid": ["Vitamin K rich foods (leafy greens in excess)", "Cranberry juice", "Grapefruit"],
                "caution": ["Green tea", "Fish oil supplements"],
                "reason": "Vitamin K antagonizes warfarin; cranberry/grapefruit alter metabolism"
            },
            "Metformin": {
                "avoid": ["Excessive alcohol", "High sugar meals"],
                "supplement": ["Vitamin B12"],
                "reason": "Alcohol increases lactic acidosis risk; B12 depletion common"
            },
            "Lisinopril": {
                "avoid": ["Potassium supplements", "Salt substitutes"],
                "include": ["Low sodium foods"],
                "reason": "ACE inhibitors increase potassium; salt substitutes contain potassium chloride"
            },
            "Levothyroxine": {
                "avoid": ["Soy products", "Calcium supplements", "Iron supplements", "Coffee"],
                "timing": "Take on empty stomach, 30-60 min before food",
                "reason": "Soy, calcium, iron reduce absorption"
            },
            "Statins": {
                "avoid": ["Grapefruit", "Seville oranges"],
                "include": ["Fiber-rich foods", "Plant sterols"],
                "reason": "Grapefruit inhibits CYP3A4 enzyme"
            },
            "Aspirin": {
                "avoid": ["Alcohol", "Spicy foods"],
                "include": ["Vitamin C rich foods"],
                "reason": "Increases GI bleeding risk"
            },
            "Iron supplements": {
                "avoid": ["Tea", "Coffee", "Dairy", "Calcium"],
                "include": ["Vitamin C rich foods", "Citrus"],
                "reason": "Tannins and calcium inhibit iron absorption"
            }
        }

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Analyzing medication-diet interactions...")

        medications = patient_data.get("Medications", [])
        if isinstance(medications, str):
            medications = [m.strip() for m in medications.split(",") if m.strip()]

        profile = {
            "current_medications": medications,
            "interactions": self._check_interactions(medications),
            "timing_schedule": self._create_timing_schedule(medications),
            "supplementation_needs": self._check_supplements(medications),
            "recommended_foods": [],
            "avoid_foods": [],
            "reasoning": ""
        }

        for interaction in profile["interactions"]:
            for food in interaction.get("avoid", []):
                profile["avoid_foods"].append({"name": food, "score": 0.0,
                                                "reason": f"Interacts with {interaction['medication']}"})
            for food in interaction.get("include", []):
                profile["recommended_foods"].append({"name": food, "score": 0.8,
                                                      "reason": f"Beneficial with {interaction['medication']}"})

        profile["reasoning"] = self._generate_reasoning(profile)
        self.log(f"Medications analyzed: {len(medications)}")
        return profile

    def _check_interactions(self, medications):
        interactions = []
        for med in medications:
            for known_med, rules in self.interaction_db.items():
                if known_med.lower() in med.lower():
                    interactions.append({
                        "medication": med,
                        "known_drug": known_med,
                        "avoid": rules.get("avoid", []),
                        "include": rules.get("include", []),
                        "caution": rules.get("caution", []),
                        "reason": rules.get("reason", "")
                    })
        return interactions

    def _create_timing_schedule(self, medications):
        schedule = {"morning_fast": [], "with_food": [], "afternoon": [], "evening": []}
        for med in medications:
            if any(kw in med.lower() for kw in ["levothyroxine", "thyroid"]):
                schedule["morning_fast"].append(med)
            elif any(kw in med.lower() for kw in ["metformin", "aspirin"]):
                schedule["with_food"].append(med)
            else:
                schedule["afternoon"].append(med)
        return schedule

    def _check_supplements(self, medications):
        supplements = []
        for med in medications:
            if "metformin" in med.lower():
                supplements.append({"name": "Vitamin B12", "reason": "Metformin depletes B12"})
            if "statin" in med.lower():
                supplements.append({"name": "CoQ10", "reason": "Statins reduce CoQ10"})
            if "ppi" in med.lower() or "omeprazole" in med.lower():
                supplements.append({"name": "Magnesium", "reason": "PPIs reduce absorption"})
        return supplements

    def _generate_reasoning(self, profile):
        interactions = profile["interactions"]
        if not interactions:
            return "No significant medication-food interactions identified for current medications."
        reasons = [f"{i['medication']}: {i['reason']}" for i in interactions]
        return f"Found {len(interactions)} medication-food interactions: {'; '.join(reasons)}"
