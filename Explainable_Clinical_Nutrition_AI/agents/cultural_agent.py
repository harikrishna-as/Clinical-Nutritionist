"""
Cultural Preferences Agent
Considers cultural, religious, and regional dietary preferences
"""
from agents.base_agent import BaseAgent


class CulturalAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Cultural Agent",
            description="Considers cultural, religious, and regional dietary preferences"
        )
        self.cultural_preferences = {
            "Vegetarian": {
                "avoid": ["Beef", "Pork", "Chicken", "Fish", "Seafood"],
                "include": ["Lentils", "Paneer", "Tofu", "Legumes", "Nuts", "Dairy"],
                "protein_sources": ["Lentils", "Chickpeas", "Paneer", "Tofu", "Quinoa"]
            },
            "Vegan": {
                "avoid": ["All animal products", "Dairy", "Eggs", "Honey"],
                "include": ["Tofu", "Tempeh", "Legumes", "Nuts", "Seeds", "Fortified plant milks"],
                "protein_sources": ["Tofu", "Tempeh", "Seitan", "Legumes", "Quinoa"]
            },
            "Halal": {
                "avoid": ["Pork", "Alcohol", "Non-halal meat"],
                "include": ["Halal chicken", "Lamb", "Fish", "Fruits", "Vegetables"],
                "protein_sources": ["Halal chicken", "Lamb", "Fish", "Legumes"]
            },
            "Kosher": {
                "avoid": ["Pork", "Shellfish", "Mixing meat and dairy"],
                "include": ["Kosher meat", "Fish with fins", "Fruits", "Vegetables"],
                "protein_sources": ["Kosher chicken", "Beef", "Fish"]
            },
            "Mediterranean": {
                "avoid": ["Processed foods", "Refined sugars"],
                "include": ["Olive oil", "Fish", "Whole grains", "Legumes", "Fruits", "Vegetables"],
                "protein_sources": ["Fish", "Legumes", "Nuts", "Lean poultry"]
            },
            "Indian": {
                "avoid": ["Beef", "Often pork"],
                "include": ["Lentils (dal)", "Rice", "Chapati", "Yogurt", "Vegetables", "Spices"],
                "protein_sources": ["Lentils", "Paneer", "Chickpeas", "Yogurt"]
            },
            "East_Asian": {
                "avoid": ["Dairy (lactose intolerance)", "Excessive sugar"],
                "include": ["Rice", "Soy products", "Fish", "Vegetables", "Green tea"],
                "protein_sources": ["Tofu", "Fish", "Edamame", "Lean meat"]
            }
        }

    def analyze(self, patient_data, knowledge_graph=None):
        self.log("Analyzing cultural dietary preferences...")

        culture = patient_data.get("CulturalPreference", "General")
        religion = patient_data.get("Religion", "None")

        profile = {
            "cultural_preference": culture,
            "religion": religion,
            "dietary_restrictions": self._get_restrictions(culture, religion),
            "preferred_foods": self._get_preferred_foods(culture),
            "protein_sources": self._get_protein_sources(culture),
            "meal_structures": self._get_meal_structure(culture),
            "recommended_foods": [],
            "avoid_foods": [],
            "reasoning": ""
        }

        for food in profile["preferred_foods"]:
            profile["recommended_foods"].append({"name": food, "score": 0.8, "reason": f"Culturally preferred ({culture})"})
        for food in profile["dietary_restrictions"].get("avoid", []):
            profile["avoid_foods"].append({"name": food, "score": 0.0, "reason": f"Culturally restricted ({culture})"})

        profile["reasoning"] = self._generate_reasoning(profile)
        self.log(f"Cultural preference: {culture}, Restrictions: {len(profile['dietary_restrictions'].get('avoid', []))}")
        return profile

    def _get_restrictions(self, culture, religion):
        restrictions = self.cultural_preferences.get(culture, {"avoid": [], "include": []})
        return restrictions

    def _get_preferred_foods(self, culture):
        prefs = self.cultural_preferences.get(culture, {})
        return prefs.get("include", ["Rice", "Vegetables", "Fruits"])

    def _get_protein_sources(self, culture):
        prefs = self.cultural_preferences.get(culture, {})
        return prefs.get("protein_sources", ["Chicken", "Fish", "Legumes"])

    def _get_meal_structure(self, culture):
        structures = {
            "Indian": {"breakfast": "Poha/Idli/Dosa", "lunch": "Dal-Rice-Sabzi", "dinner": "Roti-Curry"},
            "Mediterranean": {"breakfast": "Yogurt-Honey-Nuts", "lunch": "Mezze", "dinner": "Fish-Grains"},
            "East_Asian": {"breakfast": "Rice-Porridge", "lunch": "Rice-Dish", "dinner": "Rice-Vegetables-Meat"},
            "default": {"breakfast": "Cereal/Eggs", "lunch": "Sandwich/Salad", "dinner": "Protein-Vegetables-Starch"}
        }
        return structures.get(culture, structures["default"])

    def _generate_reasoning(self, profile):
        culture = profile["cultural_preference"]
        restrictions = len(profile["dietary_restrictions"].get("avoid", []))
        return (f"Dietary recommendations adjusted for {culture} preferences. "
               f"{restrictions} food categories restricted. "
               f"Preferred protein sources: {', '.join(profile['protein_sources'][:3])}.")
