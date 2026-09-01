"""
Evaluation Metrics Module
Unit 2: R-Squared, RMSE, MSE (Regression)
Unit 3: ROC, Confusion Matrix, Precision, Recall, F1 Score (Classification)
Unit 4: Silhouette Score, Davies-Bouldin Index (Clustering)
"""
import numpy as np
import pandas as pd
from sklearn.metrics import (r2_score, mean_squared_error, mean_absolute_error,
                             accuracy_score, precision_score, recall_score, f1_score,
                             confusion_matrix, roc_auc_score, roc_curve,
                             silhouette_score, davies_bouldin_score)
import json


class ModelEvaluator:
    """Comprehensive evaluation for all ML models in the system"""

    @staticmethod
    def evaluate_regression(y_true, y_pred, model_name="Model"):
        r2 = r2_score(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        n = len(y_true)
        p = 1
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1) if n > p + 1 else r2

        return {
            "model": model_name,
            "type": "regression",
            "R-Squared": round(r2, 4),
            "Adjusted_R-Squared": round(adj_r2, 4),
            "MSE": round(mse, 4),
            "RMSE": round(rmse, 4),
            "MAE": round(mae, 4),
            "interpretation": ModelEvaluator._interpret_regression(r2, rmse)
        }

    @staticmethod
    def _interpret_regression(r2, rmse):
        if r2 > 0.8:
            return "Excellent fit - model explains >80% variance"
        elif r2 > 0.6:
            return "Good fit - model explains 60-80% variance"
        elif r2 > 0.4:
            return "Moderate fit - model explains 40-60% variance"
        else:
            return "Poor fit - model needs improvement"

    @staticmethod
    def evaluate_classification(y_true, y_pred, y_proba=None, model_name="Model"):
        precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
        accuracy = accuracy_score(y_true, y_pred)
        cm = confusion_matrix(y_true, y_pred)
        roc = roc_auc_score(y_true, y_proba) if y_proba is not None else None

        results = {
            "model": model_name,
            "type": "classification",
            "Accuracy": round(accuracy, 4),
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1 Score": round(f1, 4),
            "ROC-AUC": round(roc, 4) if roc else None,
            "Confusion Matrix": cm.tolist(),
            "interpretation": ModelEvaluator._interpret_classification(f1, roc)
        }
        return results

    @staticmethod
    def _interpret_classification(f1, roc):
        if f1 > 0.85:
            return "Excellent classifier - high precision and recall"
        elif f1 > 0.7:
            return "Good classifier - balanced precision and recall"
        elif f1 > 0.5:
            return "Moderate classifier - needs improvement"
        else:
            return "Poor classifier - consider different approach"

    @staticmethod
    def evaluate_clustering(X, labels, model_name="Model"):
        sil = silhouette_score(X, labels)
        db = davies_bouldin_score(X, labels)
        n_clusters = len(set(labels))

        return {
            "model": model_name,
            "type": "clustering",
            "Silhouette Score": round(sil, 4),
            "Davies-Bouldin Index": round(db, 4),
            "n_clusters": n_clusters,
            "interpretation": ModelEvaluator._interpret_clustering(sil, db)
        }

    @staticmethod
    def _interpret_clustering(sil, db):
        if sil > 0.5:
            return "Strong cluster structure detected"
        elif sil > 0.25:
            return "Moderate cluster structure"
        else:
            return "Weak cluster structure - consider different K"

    @staticmethod
    def generate_report(all_results, output_path=None):
        report = {
            "title": "Clinical Nutrition AI - Model Evaluation Report",
            "sections": {}
        }

        regression_results = [r for r in all_results if r.get("type") == "regression"]
        classification_results = [r for r in all_results if r.get("type") == "classification"]
        clustering_results = [r for r in all_results if r.get("type") == "clustering"]
        ensemble_results = [r for r in all_results if r.get("type") == "ensemble"]
        dim_results = [r for r in all_results if r.get("type") == "dimensionality_reduction"]

        if regression_results:
            report["sections"]["Regression"] = {
                "description": "Unit 2: Calorie & Nutrient Requirement Prediction",
                "models": regression_results
            }
        if classification_results:
            report["sections"]["Classification"] = {
                "description": "Unit 3: Patient Risk & Disease Classification",
                "models": classification_results
            }
        if clustering_results:
            report["sections"]["Clustering"] = {
                "description": "Unit 4: Patient Dietary Segmentation",
                "models": clustering_results
            }
        if ensemble_results:
            report["sections"]["Ensemble"] = {
                "description": "Unit 5: Advanced Ensemble Learning",
                "models": ensemble_results
            }
        if dim_results:
            report["sections"]["Dimensionality Reduction"] = {
                "description": "Unit 5: PCA & LDA Comparison",
                "models": dim_results
            }

        report["summary"] = {
            "total_models_evaluated": len(all_results),
            "regression_models": len(regression_results),
            "classification_models": len(classification_results),
            "clustering_models": len(clustering_results),
            "ensemble_models": len(ensemble_results),
            "dimensionality_reduction_models": len(dim_results)
        }

        if output_path:
            with open(output_path, "w") as f:
                json.dump(report, f, indent=2, default=str)
            print(f"  Report saved to {output_path}")

        return report

    @staticmethod
    def print_report(results):
        print("\n" + "="*70)
        print("COMPREHENSIVE MODEL EVALUATION REPORT")
        print("="*70)

        for result in results:
            model_type = result.get("type", "unknown")
            print(f"\n--- {result['model']} ({model_type.upper()}) ---")
            for key, value in result.items():
                if key not in ["type", "Confusion Matrix", "interpretation"] and not key.startswith("_"):
                    print(f"  {key}: {value}")
            if "interpretation" in result:
                print(f"  >> {result['interpretation']}")
            if "Confusion Matrix" in result:
                print(f"  Confusion Matrix:")
                for row in result["Confusion Matrix"]:
                    print(f"    {row}")
