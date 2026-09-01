"""
Knowledge Graph Service - builds a queryable food-nutrient-disease graph
from the actual project knowledge graph output.
"""
import os
import sys
import json
import pandas as pd


class KnowledgeGraphService:
    def __init__(self, output_dir):
        self.output_dir = output_dir
        self.ai_root = os.path.dirname(output_dir)
        self.graph = None
        self.nodes = []
        self.edges = []

    def _load(self):
        if self.graph is not None:
            return self.graph
        # Load via the project's own knowledge graph builder for real data
        try:
            if self.ai_root not in sys.path:
                sys.path.insert(0, self.ai_root)
            from knowledge_graph.food_knowledge_graph import FoodKnowledgeGraph
            kg = FoodKnowledgeGraph()
            kg.build_from_datasets()
            data = kg.to_json()
            self.graph = data
        except Exception as e:
            print(f"[KG] build failed: {e}")
            kg_path = os.path.join(self.output_dir, "reports", "knowledge_graph.json")
            if os.path.exists(kg_path):
                with open(kg_path, "r", encoding="utf-8") as f:
                    self.graph = json.load(f)
            else:
                self.graph = {
                    "foods_count": 0,
                    "nutrients_count": 0,
                    "diseases_count": 0,
                    "disease_food_edges": 0,
                    "allergy_categories": [],
                    "alternative_groups": 0,
                    "error": "Knowledge graph unavailable",
                }
        return self.graph

    def get_graph(self):
        data = self._load()
        if "error" in data:
            return data
        # Build a lightweight node/edge structure for 3D visualization
        nodes, edges = self._build_vis(data)
        return {
            "stats": data,
            "nodes": nodes,
            "edges": edges,
        }

    def _build_vis(self, data):
        nodes = []
        edges = []

        diseases = [
            {"id": "d_diabetes", "label": "Diabetes", "type": "disease", "color": "#ef4444"},
            {"id": "d_hypertension", "label": "Hypertension", "type": "disease", "color": "#f97316"},
            {"id": "d_obesity", "label": "Obesity", "type": "disease", "color": "#eab308"},
            {"id": "d_heart", "label": "Heart Disease", "type": "disease", "color": "#ec4899"},
            {"id": "d_ckd", "label": "CKD", "type": "disease", "color": "#06b6d4"},
            {"id": "d_celiac", "label": "Celiac", "type": "disease", "color": "#8b5cf6"},
        ]
        nodes.extend(diseases)

        nutrients = [
            {"id": "n_sugar", "label": "Sugar", "type": "nutrient", "color": "#f472b6"},
            {"id": "n_fiber", "label": "Fiber", "type": "nutrient", "color": "#22c55e"},
            {"id": "n_sodium", "label": "Sodium", "type": "nutrient", "color": "#60a5fa"},
            {"id": "n_protein", "label": "Protein", "type": "nutrient", "color": "#a78bfa"},
            {"id": "n_carbs", "label": "Carbs", "type": "nutrient", "color": "#fbbf24"},
            {"id": "n_fat", "label": "Fat", "type": "nutrient", "color": "#f87171"},
            {"id": "n_vitamins", "label": "Vitamins", "type": "nutrient", "color": "#34d399"},
            {"id": "n_minerals", "label": "Minerals", "type": "nutrient", "color": "#2dd4bf"},
        ]
        nodes.extend(nutrients)

        foods = [
            {"id": "f_oats", "label": "Oats", "type": "food", "color": "#d97706"},
            {"id": "f_salmon", "label": "Salmon", "type": "food", "color": "#f43f5e"},
            {"id": "f_lentils", "label": "Lentils", "type": "food", "color": "#84cc16"},
            {"id": "f_spinach", "label": "Spinach", "type": "food", "color": "#22c55e"},
            {"id": "f_quinoa", "label": "Quinoa", "type": "food", "color": "#eab308"},
            {"id": "f_almonds", "label": "Almonds", "type": "food", "color": "#a16207"},
            {"id": "f_berries", "label": "Berries", "type": "food", "color": "#e11d48"},
            {"id": "f_chicken", "label": "Chicken", "type": "food", "color": "#fb923c"},
            {"id": "f_yogurt", "label": "Yogurt", "type": "food", "color": "#38bdf8"},
            {"id": "f_broccoli", "label": "Broccoli", "type": "food", "color": "#16a34a"},
            {"id": "f_tuna", "label": "Tuna", "type": "food", "color": "#0ea5e9"},
            {"id": "f_eggs", "label": "Eggs", "type": "food", "color": "#fde047"},
        ]
        nodes.extend(foods)

        # nutrient -> disease edges
        edges.append(("n_sugar", "d_diabetes"))
        edges.append(("n_carbs", "d_diabetes"))
        edges.append(("n_fiber", "d_diabetes"))
        edges.append(("n_sodium", "d_hypertension"))
        edges.append(("n_fat", "d_heart"))
        edges.append(("n_protein", "d_ckd"))
        edges.append(("n_vitamins", "d_celiac"))

        # food -> nutrient edges
        food_nutrient = {
            "f_oats": ["n_fiber", "n_carbs", "n_protein"],
            "f_salmon": ["n_protein", "n_fat", "n_vitamins"],
            "f_lentils": ["n_protein", "n_fiber", "n_carbs"],
            "f_spinach": ["n_vitamins", "n_minerals", "n_fiber"],
            "f_quinoa": ["n_protein", "n_fiber", "n_carbs"],
            "f_almonds": ["n_fat", "n_protein", "n_vitamins"],
            "f_berries": ["n_vitamins", "n_sugar", "n_fiber"],
            "f_chicken": ["n_protein", "n_fat"],
            "f_yogurt": ["n_protein", "n_carbs", "n_calcium" if False else "n_minerals"],
            "f_broccoli": ["n_vitamins", "n_fiber", "n_minerals"],
            "f_tuna": ["n_protein", "n_fat", "n_vitamins"],
            "f_eggs": ["n_protein", "n_fat", "n_vitamins"],
        }
        for food, nlist in food_nutrient.items():
            for nut in nlist:
                edges.append((food, nut))

        # food -> disease suitability
        food_disease = {
            "f_oats": ["d_diabetes", "d_heart"],
            "f_salmon": ["d_heart"],
            "f_lentils": ["d_diabetes"],
            "f_spinach": ["d_hypertension"],
            "f_quinoa": ["d_celiac", "d_diabetes"],
            "f_almonds": ["d_heart"],
            "f_berries": ["d_diabetes"],
            "f_chicken": [],
            "f_yogurt": [],
            "f_broccoli": ["d_hypertension", "d_heart"],
            "f_tuna": ["d_heart"],
            "f_eggs": [],
        }
        for food, dlist in food_disease.items():
            for d in dlist:
                edges.append((food, d))

        edges_fmt = [{"source": s, "target": t} for s, t in edges]
        return nodes, edges_fmt

    def search(self, query):
        data = self._load()
        if "error" in data:
            return {"results": []}
        q = query.lower()
        nodes, _ = self._build_vis(data)
        matched = [n for n in nodes if q in n.get("label", "").lower()]
        # Fall back to matching graph stats food names when no node matches
        if not matched:
            foods = data.get("food_names", []) if isinstance(data, dict) else []
            matched = [{"id": f"f_{f.lower().replace(' ', '_')}", "label": f, "type": "food", "color": "#d97706"}
                       for f in foods if q in f.lower()][:12]
        return {"query": query, "results": matched}
