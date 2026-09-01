"""
Explainability Module - SHAP/LIME for model transparency
Provides clear explanations for each recommendation
"""
import numpy as np
import pandas as pd
import json


class NutritionExplainer:
    """Generates human-readable explanations for nutrition recommendations"""

    def __init__(self):
        self.explanations = []

    def explain_calorie_prediction(self, patient_data, prediction, model, feature_names):
        explanation = {
            "type": "Calorie Requirement Prediction",
            "predicted_calories": float(prediction[0]) if hasattr(prediction, '__len__') else float(prediction),
            "factors": [],
            "rationale": ""
        }

        if hasattr(model, "coef_"):
            coefs = model.coef_ if not hasattr(model, "named_steps") else model.named_steps.get("lr", model).coef_
            if hasattr(coefs, '__len__'):
                values = patient_data.values[0] if hasattr(patient_data, "values") else patient_data
                for i, (name, val, coef) in enumerate(zip(feature_names[:len(coefs[0])], values[:len(coefs[0])], coefs[0])):
                    impact = val * coef
                    explanation["factors"].append({
                        "feature": name,
                        "value": round(float(val), 4),
                        "coefficient": round(float(coef), 4),
                        "impact": round(float(impact), 4),
                        "direction": "increases" if impact > 0 else "decreases"
                    })

        explanation["factors"].sort(key=lambda x: abs(x["impact"]), reverse=True)
        top_factors = explanation["factors"][:3]
        if top_factors:
            desc = "Primary factors: "
            for f in top_factors:
                desc += f"{f['feature']} ({f['direction']} requirement by {abs(f['impact']):.1f}), "
            explanation["rationale"] = desc.rstrip(", ")

        return explanation

    def explain_risk_classification(self, patient_data, prediction, probability, model, feature_names):
        prediction_val = int(prediction[0]) if hasattr(prediction, '__len__') else int(prediction)
        explanation = {
            "type": "Patient Risk Classification",
            "predicted_risk": "High Risk" if prediction_val == 1 else "Low Risk",
            "confidence": None,
            "risk_factors": [],
            "protective_factors": [],
            "rationale": ""
        }

        if probability is not None:
            prob = probability[0] if len(probability.shape) > 1 else probability
            explanation["confidence"] = round(float(max(prob)) * 100, 2)

        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            values = patient_data.values[0] if hasattr(patient_data, "values") else patient_data
            for name, val, imp in zip(feature_names, values[:len(importances)], importances):
                factor = {"feature": name, "value": round(float(val), 4),
                          "importance": round(float(imp), 4)}
                if val > 0:
                    explanation["risk_factors"].append(factor)
                else:
                    explanation["protective_factors"].append(factor)

        explanation["risk_factors"].sort(key=lambda x: x["importance"], reverse=True)
        explanation["protective_factors"].sort(key=lambda x: x["importance"], reverse=True)

        risk_count = len(explanation["risk_factors"])
        protective_count = len(explanation["protective_factors"])
        explanation["rationale"] = (f"Model identified {risk_count} risk factors and "
                                   f"{protective_count} protective factors. "
                                   f"Prediction: {explanation['predicted_risk']} "
                                   f"with {explanation.get('confidence', 'N/A')}% confidence.")

        return explanation

    def explain_dietary_recommendation(self, patient_info, food_recommendations, reasoning_chain):
        explanation = {
            "type": "Dietary Recommendation",
            "patient_profile": patient_info,
            "recommendations": [],
            "reasoning_chain": reasoning_chain,
            "nutritional_targets": {},
            "foods_to_avoid": [],
            "foods_to_include": []
        }

        for food in food_recommendations:
            rec = {
                "food": food.get("name", "Unknown"),
                "reason": food.get("reason", ""),
                "nutrients": food.get("nutrients", {}),
                "suitability_score": food.get("score", 0)
            }
            explanation["recommendations"].append(rec)
            if food.get("score", 0) > 0.6:
                explanation["foods_to_include"].append(food.get("name", ""))
            else:
                explanation["foods_to_avoid"].append(food.get("name", ""))

        return explanation

    def explain_cluster_assignment(self, patient_data, cluster_id, cluster_profiles, feature_names):
        profile = cluster_profiles.get(cluster_id, {})
        explanation = {
            "type": "Patient Segment Assignment",
            "assigned_segment": cluster_id,
            "segment_description": profile.get("description", f"Segment {cluster_id}"),
            "segment_characteristics": profile.get("characteristics", {}),
            "dietary_implications": profile.get("dietary_implications", []),
            "rationale": ""
        }

        chars = profile.get("characteristics", {})
        if chars:
            desc_parts = [f"{k}: {v}" for k, v in list(chars.items())[:3]]
            explanation["rationale"] = (f"Patient assigned to Segment {cluster_id} based on: "
                                       f"{'; '.join(desc_parts)}. "
                                       f"Dietary approach: {profile.get('dietary_approach', 'Balanced nutrition')}.")
        else:
            explanation["rationale"] = f"Patient assigned to Segment {cluster_id} based on nutritional profile analysis."

        return explanation

    def explain_nutrient_interaction(self, nutrient1, nutrient2, relationship):
        explanations = {
            "synergy": f"{nutrient1} enhances absorption of {nutrient2}. Include foods rich in both together.",
            "antagonism": f"{nutrient1} may reduce absorption of {nutrient2}. Space intake by 2+ hours.",
            "neutral": f"{nutrient1} and {nutrient2} can be consumed together without interaction."
        }
        return explanations.get(relationship, f"Relationship between {nutrient1} and {nutrient2}: {relationship}")

    def generate_patient_report(self, all_explanations):
        report = {
            "title": "Personalized Nutrition Report",
            "sections": all_explanations,
            "summary": {
                "total_recommendations": sum(len(e.get("recommendations", []))
                                           for e in all_explanations if "recommendations" in e),
                "key_findings": [],
                "action_items": []
            }
        }

        for exp in all_explanations:
            if "rationale" in exp:
                report["summary"]["key_findings"].append(exp["rationale"])
            if "foods_to_include" in exp:
                report["summary"]["action_items"].extend(
                    [f"Include: {f}" for f in exp["foods_to_include"][:3]]
                )
            if "foods_to_avoid" in exp:
                report["summary"]["action_items"].extend(
                    [f"Avoid: {f}" for f in exp["foods_to_avoid"][:3]]
                )

        return report

    def format_explanation(self, explanation, indent=2):
        lines = []
        prefix = " " * indent
        lines.append(f"{prefix}Type: {explanation.get('type', 'N/A')}")
        if "rationale" in explanation:
            lines.append(f"{prefix}Rationale: {explanation['rationale']}")
        for key, value in explanation.items():
            if key not in ["type", "rationale", "factors", "risk_factors", "protective_factors",
                          "recommendations", "reasoning_chain"]:
                if isinstance(value, (int, float, str)):
                    lines.append(f"{prefix}{key}: {value}")
        return "\n".join(lines)
