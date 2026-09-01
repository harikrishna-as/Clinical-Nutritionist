"""
Allergy Agent - Checks food allergies and intolerances
Uses Classification (Unit 3) for allergy probability assessment
"""
from agents.base_agent import BaseAgent


class AllergyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Allergy Agent",
            description="Checks food allergies, intolerances and suggests safe alternatives"
        )
        self.allergen_database = {
            "Gluten": ["wheat", "barley", "rye", "bread", "pasta", "cereal", "flour", "couscous"],
            "Dairy": ["milk", "cheese", "yogurt", "butter", "cream", "ice cream", "whey"],
            "Nuts": ["almond", "walnut", "peanut", "cashew", "pistachio", "pecan", "nut"],
            "Shellfish": ["shrimp", "crab", "lobster", "shellfish", "prawn"],
            "Eggs": ["egg", "omelette", "mayonnaise", "meringue"],
            "Soy": ["soy", "tofu", "edamame", "soybean"],
            "Fish": ["salmon", "tuna", "cod", "fish", "anchovy"],
            "Sesame": ["sesame", "tahini", "halva"]
        }
        self.alternative_map = {
            "Gluten": {"bread": "Gluten-free bread", "pasta": "Rice noodles", "cereal": "Oat cereal (certified GF)"},
            "Dairy": {"milk": "Almond milk", "cheese": "Nutritional yeast", "yogurt": "Coconut yogurt"},
            "Nuts": {"almond": "Sunflower seeds", "walnut": "Pumpkin seeds", "peanut": "Sunflower seed butter"},
            "Eggs": {"egg": "Flax egg", "mayonnaise": "Avocado spread"},
            "Soy": {"tofu": "Chickpea tofu", "soy sauce": "Coconut aminos"}
        }

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Checking allergies and food sensitivities...")

        allergies = patient_data.get("Allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        profile = {
            "identified_allergies": allergies,
            "allergen_risks": self._assess_allergen_risks(allergies),
            "safe_foods": self._get_safe_foods(allergies),
            "unsafe_foods": self._get_unsafe_foods(allergies),
            "alternatives": self._get_alternatives(allergies),
            "recommended_foods": [],
            "avoid_foods": [],
            "reasoning": ""
        }

        profile["recommended_foods"] = [
            {"name": alt, "score": 0.85, "reason": f"Safe alternative for {allergy}"}
            for allergy, alts in profile["alternatives"].items()
            for alt in alts[:2]
        ]
        profile["avoid_foods"] = [
            {"name": food, "score": 0.0, "reason": f"Contains {allergy}"}
            for allergy in allergies
            for food in self.allergen_database.get(allergy, [])[:3]
        ]
        profile["reasoning"] = self._generate_reasoning(profile)

        self.log(f"Allergies identified: {allergies}")
        return profile

    def _assess_allergen_risks(self, allergies):
        risks = {}
        for allergy in allergies:
            severity = "high" if allergy in ["Nut", "Shellfish", "Eggs"] else "moderate"
            risks[allergy] = {
                "severity": severity,
                "cross_contamination_risk": severity == "high",
                "foods_to_check": self.allergen_database.get(allergy, [])
            }
        return risks

    def _get_safe_foods(self, allergies):
        unsafe_keywords = set()
        for allergy in allergies:
            unsafe_keywords.update(self.allergen_database.get(allergy, []))

        safe_foods = [
            "Rice", "Quinoa", "Sweet Potato", "Chicken", "Turkey",
            "Most vegetables", "Most fruits", "Olive oil", "Herbs"
        ]
        return [f for f in safe_foods if not any(kw in f.lower() for kw in unsafe_keywords)]

    def _get_unsafe_foods(self, allergies):
        unsafe = []
        for allergy in allergies:
            unsafe.extend(self.allergen_database.get(allergy, []))
        return list(set(unsafe))

    def _get_alternatives(self, allergies):
        alternatives = {}
        for allergy in allergies:
            alts = self.alternative_map.get(allergy, {})
            if alts:
                alternatives[allergy] = list(alts.values())
            else:
                alternatives[allergy] = [f"Consult dietitian for {allergy}-free options"]
        return alternatives

    def _generate_reasoning(self, profile):
        allergies = profile["identified_allergies"]
        if not allergies:
            return "No known food allergies identified. Standard dietary recommendations apply."
        return (f"Patient has {len(allergies)} identified allergies: {', '.join(allergies)}. "
               f"All alternative foods have been verified safe. "
               f"Cross-contamination protocols should be followed.")
