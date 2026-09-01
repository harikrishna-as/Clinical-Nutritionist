"""
Global Food Knowledge Graph - Stores structured food-nutrient-disease relationships
"""
import pandas as pd
import numpy as np
from collections import defaultdict
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATASETS, DISEASE_DIET_RULES


class FoodKnowledgeGraph:
    def __init__(self):
        self.foods = {}
        self.nutrients = {}
        self.diseases = DISEASE_DIET_RULES
        self.food_nutrient_edges = []
        self.disease_food_edges = []
        self.allergy_graph = defaultdict(list)
        self.alternatives_graph = defaultdict(list)

    def build_from_datasets(self):
        print("[KnowledgeGraph] Building food knowledge graph...")
        self._load_usda_foods()
        self._load_cn_foods()
        self._build_disease_food_associations()
        self._build_allergy_graph()
        self._build_alternatives()
        print(f"  Foods: {len(self.foods)}, Nutrients: {len(self.nutrients)}, "
              f"Disease links: {len(self.disease_food_edges)}")
        return self

    def _load_usda_foods(self):
        try:
            food_path = DATASETS.get("usda_food", "")
            nutrient_path = DATASETS.get("usda_food_nutrient", "")
            nutrient_desc_path = DATASETS.get("usda_nutrient", "")

            if os.path.exists(food_path):
                foods_df = pd.read_csv(food_path, low_memory=False, nrows=5000)
                for _, row in foods_df.iterrows():
                    fid = str(row.get("fdc_id", ""))
                    self.foods[fid] = {
                        "name": row.get("description", "Unknown"),
                        "category_id": row.get("food_category_id", ""),
                        "type": row.get("data_type", ""),
                        "nutrients": {}
                    }

            if os.path.exists(nutrient_desc_path):
                nutrient_df = pd.read_csv(nutrient_desc_path)
                for _, row in nutrient_df.iterrows():
                    self.nutrients[str(row["id"])] = {
                        "name": row["name"],
                        "unit": row["unit_name"]
                    }

            if os.path.exists(nutrient_path):
                fn_df = pd.read_csv(nutrient_path, nrows=50000)
                for _, row in fn_df.iterrows():
                    fid = str(row.get("fdc_id", ""))
                    nid = str(row.get("nutrient_id", ""))
                    if fid in self.foods and nid in self.nutrients:
                        self.foods[fid]["nutrients"][nid] = row.get("amount", 0)
                        self.food_nutrient_edges.append((fid, nid, row.get("amount", 0)))
        except Exception as e:
            print(f"  Warning loading USDA data: {e}")

    def _load_cn_foods(self):
        try:
            cn_path = DATASETS.get("cn_food_descriptions", "")
            cn_nutval_path = DATASETS.get("cn_nutrient_values", "")
            cn_nutdes_path = DATASETS.get("cn_nutrient_descriptions", "")

            if os.path.exists(cn_path):
                cn_df = pd.read_csv(cn_path, nrows=3000)
                for _, row in cn_df.iterrows():
                    cn_code = str(row.get("Cn code", ""))
                    desc = row.get("Descriptor", "Unknown")
                    self.foods[f"CN_{cn_code}"] = {
                        "name": desc,
                        "category_id": str(row.get("Food category code", "")),
                        "source": "USDA_CN",
                        "nutrients": {}
                    }

            if os.path.exists(cn_nutval_path):
                nutval_df = pd.read_csv(cn_nutval_path, nrows=30000)
                for _, row in nutval_df.iterrows():
                    cn_code = str(row.get("Cn Code", ""))
                    fid = f"CN_{cn_code}"
                    if fid in self.foods:
                        self.foods[fid]["nutrients"][str(row.get("Nutrient code", ""))] = row.get("Nutrient value", 0)
        except Exception as e:
            print(f"  Warning loading CN data: {e}")

    def _build_disease_food_associations(self):
        for disease, rules in self.diseases.items():
            for food_id, food_info in self.foods.items():
                score = self._compute_disease_food_score(food_info, disease, rules)
                if score > 0.3:
                    self.disease_food_edges.append((disease, food_id, score))

    def _compute_disease_food_score(self, food_info, disease, rules):
        score = 0.5
        name_lower = food_info.get("name", "").lower()
        avoid_list = [a.lower() for a in rules.get("avoid", [])]
        for avoid_item in avoid_list:
            if avoid_item in name_lower:
                return 0.0

        nutrients = food_info.get("nutrients", {})
        if disease == "Diabetes" and nutrients:
            sugars = sum(v for k, v in nutrients.items() if "sugar" in str(k).lower())
            if sugars < 10:
                score += 0.3
        elif disease == "Hypertension" and nutrients:
            sodium = sum(v for k, v in nutrients.items() if "sodium" in str(k).lower())
            if sodium < 200:
                score += 0.3
        return min(score, 1.0)

    def _build_allergy_graph(self):
        common_allergens = {
            "Gluten": ["wheat", "barley", "rye", "bread", "pasta", "cereal"],
            "Dairy": ["milk", "cheese", "yogurt", "butter", "cream"],
            "Nuts": ["almond", "walnut", "peanut", "cashew", "nut"],
            "Shellfish": ["shrimp", "crab", "lobster", "shellfish"],
            "Eggs": ["egg", "omelette"],
            "Soy": ["soy", "tofu", "edamame"],
            "Fish": ["salmon", "tuna", "fish", "cod"]
        }
        for allergen, keywords in common_allergens.items():
            for food_id, food_info in self.foods.items():
                name_lower = food_info.get("name", "").lower()
                for kw in keywords:
                    if kw in name_lower:
                        self.allergy_graph[allergen].append(food_id)
                        break

    def _build_alternatives(self):
        alternative_groups = [
            ("Milk", ["Soy milk", "Almond milk", "Oat milk"]),
            ("Bread", ["Whole wheat bread", "Rice bread", "Gluten-free bread"]),
            ("Butter", ["Olive oil", "Avocado", "Greek yogurt"]),
            ("Rice", ["Quinoa", "Cauliflower rice", "Brown rice"]),
            ("Pasta", ["Zucchini noodles", "Shirataki noodles", "Whole grain pasta"])
        ]
        for base, alts in alternative_groups:
            for food_id, food_info in self.foods.items():
                if base.lower() in food_info.get("name", "").lower():
                    self.alternatives_graph[food_id] = alts

    def get_foods_for_disease(self, disease, top_n=20):
        scores = {}
        for d, fid, score in self.disease_food_edges:
            if d == disease:
                scores[fid] = score
        sorted_foods = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [(fid, score, self.foods.get(fid, {})) for fid, score in sorted_foods]

    def get_allergy_free_foods(self, allergies, all_food_ids=None):
        if all_food_ids is None:
            all_food_ids = list(self.foods.keys())
        excluded = set()
        for allergy in allergies:
            excluded.update(self.allergy_graph.get(allergy, []))
        return [fid for fid in all_food_ids if fid not in excluded]

    get_alternatives = lambda self, food_id: self.alternatives_graph.get(food_id, [])

    def get_nutrient_info(self, food_id):
        food = self.foods.get(food_id, {})
        nutrient_info = {}
        for nid, amount in food.get("nutrients", {}).items():
            ninfo = self.nutrients.get(nid, {})
            nutrient_info[ninfo.get("name", nid)] = {"amount": amount, "unit": ninfo.get("unit", "")}
        return nutrient_info

    def to_json(self):
        return {
            "foods_count": len(self.foods),
            "nutrients_count": len(self.nutrients),
            "diseases_count": len(self.diseases),
            "food_nutrient_edges": len(self.food_nutrient_edges),
            "disease_food_edges": len(self.disease_food_edges),
            "allergy_categories": list(self.allergy_graph.keys()),
            "alternative_groups": len(self.alternatives_graph)
        }


if __name__ == "__main__":
    kg = FoodKnowledgeGraph()
    kg.build_from_datasets()
    print("\n=== Knowledge Graph Summary ===")
    print(json.dumps(kg.to_json(), indent=2))
    diabetes_foods = kg.get_foods_for_disease("Diabetes", top_n=5)
    print("\nTop 5 foods for Diabetes:")
    for fid, score, info in diabetes_foods:
        print(f"  {info.get('name', fid)}: score={score:.2f}")
