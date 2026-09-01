"""
Main Orchestrator - Explainable Multi-Agent AI Clinical Nutrition Decision Support System
Integrates all Units (1-5) of the ML syllabus with the multi-agent architecture

Unit 1: Data Preprocessing & Integration
Unit 2: Regression (Calorie/Macronutrient Prediction)
Unit 3: Classification (Risk Assessment)
Unit 4: Clustering (Patient Segmentation) + Association Rules
Unit 5: Ensemble Learning + Dimensionality Reduction
"""
import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import RANDOM_STATE, OUTPUT_DIR, REPORTS_DIR, MODELS_DIR
from data_loader import DataLoader
from preprocessing.preprocessor import ClinicalDataPreprocessor
from knowledge_graph.food_knowledge_graph import FoodKnowledgeGraph
from models.regression.calorie_predictor import CaloriePredictor
from models.classification.risk_classifier import RiskClassifier
from models.clustering.patient_segmentation import PatientSegmentation
from models.ensemble.ensemble_models import EnsembleNutritionPredictor
from models.dimensionality.dim_reduction import NutritionDimensionalityReducer
from agents.base_agent import AgentOrchestrator
from agents.patient_analysis_agent import PatientAnalysisAgent
from agents.nutrition_agent import NutritionAgent
from agents.allergy_agent import AllergyAgent
from agents.medication_diet_agent import MedicationDietAgent
from agents.cultural_agent import CulturalAgent
from agents.recommendation_agent import RecommendationAgent
from explainability.explainer import NutritionExplainer
from evaluation.metrics import ModelEvaluator


class ClinicalNutritionAI:
    def __init__(self):
        self.loader = DataLoader()
        self.preprocessor = ClinicalDataPreprocessor()
        self.knowledge_graph = FoodKnowledgeGraph()
        self.calorie_predictor = CaloriePredictor()
        self.risk_classifier = RiskClassifier()
        self.patient_segmentation = PatientSegmentation()
        self.ensemble_predictor = EnsembleNutritionPredictor()
        self.dim_reducer = NutritionDimensionalityReducer()
        self.agent_orchestrator = AgentOrchestrator()
        self.explainer = NutritionExplainer()
        self.evaluator = ModelEvaluator()
        self.all_evaluation_results = []

    def run_full_pipeline(self):
        print("="*70)
        print("  EXPLAINABLE MULTI-AGENT AI CLINICAL NUTRITION")
        print("  DECISION SUPPORT SYSTEM FOR PRECISION NUTRITION")
        print("="*70)

        integrated_data = self._phase1_data_integration()
        self._phase2_knowledge_graph()
        regression_results = self._phase3_regression(integrated_data)
        classification_results = self._phase4_classification(integrated_data)
        clustering_results = self._phase5_clustering(integrated_data)
        ensemble_results = self._phase6_ensemble(integrated_data)
        dim_results = self._phase7_dimensionality(integrated_data)
        agent_results = self._phase8_multi_agent()
        self._phase9_explainability(agent_results)
        self._phase10_generate_report()
        self._print_final_summary()

    def _phase1_data_integration(self):
        print("\n" + "="*70)
        print("PHASE 1: DATA INTEGRATION & PREPROCESSING (Unit 1)")
        print("="*70)
        self.loader.load_all()
        integrated = self.loader.integrate_patient_food_data()
        integrated = self.preprocessor.clean_data(integrated, "integrated_patient_food")
        print(self.preprocessor.get_cleaning_report())
        return integrated

    def _phase2_knowledge_graph(self):
        print("\n" + "="*70)
        print("PHASE 2: FOOD KNOWLEDGE GRAPH CONSTRUCTION")
        print("="*70)
        self.knowledge_graph.build_from_datasets()
        print(json.dumps(self.knowledge_graph.to_json(), indent=2))

    def _phase3_regression(self, data):
        print("\n" + "="*70)
        print("PHASE 3: REGRESSION MODELS (Unit 2)")
        print("="*70)
        results = self.calorie_predictor.train_all(data)
        for name, metrics in results.items():
            self.all_evaluation_results.append({
                "model": name, "type": "regression", **metrics
            })
        return results

    def _phase4_classification(self, data):
        print("\n" + "="*70)
        print("PHASE 4: CLASSIFICATION MODELS (Unit 3)")
        print("="*70)
        results = self.risk_classifier.train_all(data, target_col="Readmitted")
        for name, metrics in results.items():
            cm = metrics.get("Confusion Matrix")
            self.all_evaluation_results.append({
                "model": name, "type": "classification",
                "Precision": metrics.get("Precision", 0),
                "Recall": metrics.get("Recall", 0),
                "F1 Score": metrics.get("F1 Score", 0),
                "ROC-AUC": metrics.get("ROC-AUC"),
                "Confusion Matrix": cm.tolist() if cm is not None else None
            })
        return results

    def _phase5_clustering(self, data):
        print("\n" + "="*70)
        print("PHASE 5: CLUSTERING MODELS (Unit 4)")
        print("="*70)
        results, labels = self.patient_segmentation.train_all(data)
        for name, metrics in results.items():
            self.all_evaluation_results.append({
                "model": name, "type": "clustering", **metrics
            })
        return results

    def _phase6_ensemble(self, data):
        print("\n" + "="*70)
        print("PHASE 6: ENSEMBLE LEARNING (Unit 5)")
        print("="*70)
        results = self.ensemble_predictor.train_all(data)
        for name, metrics in results.items():
            self.all_evaluation_results.append({
                "model": name, "type": "ensemble", **metrics
            })
        return results

    def _phase7_dimensionality(self, data):
        print("\n" + "="*70)
        print("PHASE 7: DIMENSIONALITY REDUCTION (Unit 5)")
        print("="*70)
        numeric_data = data.select_dtypes(include=[int, float]).drop(columns=["Readmitted"], errors="ignore")
        if "Severity" in data.columns:
            severity_map = {"Low": 0, "Medium": 1, "High": 2}
            labels = data["Severity"].map(severity_map).fillna(0).astype(int)
        elif "Readmitted" in data.columns:
            labels = data["Readmitted"].fillna(0).astype(int)
        else:
            return {}

        if numeric_data.shape[1] >= 4 and labels.nunique() > 1:
            pca_result, lda_result = self.dim_reducer.compare_pca_lda(numeric_data, labels)
            if self.dim_reducer.pca_results:
                self.all_evaluation_results.append({
                    "model": "PCA", "type": "dimensionality_reduction",
                    "n_components": self.dim_reducer.pca_results.get("n_components", 0),
                    "total_variance_explained": self.dim_reducer.pca_results.get("total_variance_explained", 0)
                })
            if self.dim_reducer.lda_results:
                self.all_evaluation_results.append({
                    "model": "LDA", "type": "dimensionality_reduction",
                    "n_components": self.dim_reducer.lda_results.get("n_components", 0),
                    "total_variance_explained": self.dim_reducer.lda_results.get("total_variance_explained", 0)
                })
            return {"pca": self.dim_reducer.pca_results, "lda": self.dim_reducer.lda_results}
        print("  Skipping: insufficient features or classes")
        return {}

    def _phase8_multi_agent(self):
        print("\n" + "="*70)
        print("PHASE 8: MULTI-AGENT SYSTEM")
        print("="*70)
        agents = [
            PatientAnalysisAgent(),
            NutritionAgent(),
            AllergyAgent(),
            MedicationDietAgent(),
            CulturalAgent(),
            RecommendationAgent()
        ]
        for agent in agents:
            self.agent_orchestrator.register_agent(agent)

        sample_patient = {
            "PatientID": "DEMO_001", "Age": 55, "Gender": "M",
            "BMI": 28.5, "Blood_Glucose": 135,
            "Blood_Pressure_Systolic": 145, "Blood_Pressure_Diastolic": 92,
            "Cholesterol_Level": 245, "Diagnosis": "Diabetes",
            "Severity": "Medium", "Weight": 85, "Height": 175,
            "Allergies": ["Gluten"], "Medications": ["Metformin", "Lisinopril"],
            "CulturalPreference": "Indian", "ActivityLevel": "moderate",
            "TargetCalories": 2000
        }

        results = self.agent_orchestrator.run_all_agents(sample_patient, self.knowledge_graph)

        rec_agent = self.agent_orchestrator.agents.get("Recommendation Agent")
        if rec_agent:
            final_recommendations = rec_agent.synthesize(results, sample_patient)
            results["Final Recommendations"] = final_recommendations
            print("\n  === FINAL RECOMMENDATIONS ===")
            print(f"  Confidence: {final_recommendations.get('confidence_score', 0)}%")
            print(f"  Top foods: {[f['name'] for f in final_recommendations.get('top_recommended_foods', [])[:5]]}")
            print(f"  Foods to avoid: {final_recommendations.get('foods_to_avoid', [])[:5]}")

        return results

    def _phase9_explainability(self, agent_results):
        print("\n" + "="*70)
        print("PHASE 9: EXPLAINABILITY MODULE")
        print("="*70)
        explanations = []
        for agent_name, result in agent_results.items():
            if isinstance(result, dict) and "reasoning" in result:
                explanations.append({
                    "agent": agent_name,
                    "reasoning": result["reasoning"]
                })
                print(f"\n  {agent_name}:")
                print(f"    {result['reasoning']}")

        patient_report = self.explainer.generate_patient_report(explanations)
        print(f"\n  Generated patient report with {len(patient_report['sections'])} sections")
        print(f"  Action items: {len(patient_report['summary']['action_items'])}")

    def _phase10_generate_report(self):
        print("\n" + "="*70)
        print("PHASE 10: GENERATING FINAL REPORT")
        print("="*70)
        os.makedirs(REPORTS_DIR, exist_ok=True)
        os.makedirs(MODELS_DIR, exist_ok=True)

        report_path = os.path.join(REPORTS_DIR, "clinical_nutrition_report.json")
        report = self.evaluator.generate_report(self.all_evaluation_results, report_path)
        print(f"  Evaluation report saved: {report_path}")

        self._save_models()
        self._save_model_summaries()

    def _save_models(self):
        import joblib
        os.makedirs(MODELS_DIR, exist_ok=True)
        saved = []
        model_map = {
            "regression": self.calorie_predictor.models,
            "classification": self.risk_classifier.models,
            "clustering": self.patient_segmentation.models if hasattr(self.patient_segmentation, 'models') else {},
            "ensemble": self.ensemble_predictor.models if hasattr(self.ensemble_predictor, 'models') else {},
        }
        for model_type, models in model_map.items():
            for name, model in models.items():
                safe_name = name.replace(" ", "_").replace("(", "").replace(")", "").replace("=", "")
                path = os.path.join(MODELS_DIR, f"{model_type}_{safe_name}.joblib")
                try:
                    joblib.dump(model, path)
                    saved.append(f"{model_type}/{safe_name}")
                except Exception:
                    pass
        print(f"  Saved {len(saved)} models to {MODELS_DIR}")

    def _save_model_summaries(self):
        summary = {
            "system": "Explainable Multi-Agent AI Clinical Nutrition DSS",
            "phases_completed": [
                "Phase 1: Data Integration & Preprocessing",
                "Phase 2: Food Knowledge Graph",
                "Phase 3: Regression Models (Unit 2)",
                "Phase 4: Classification Models (Unit 3)",
                "Phase 5: Clustering Models (Unit 4)",
                "Phase 6: Ensemble Learning (Unit 5)",
                "Phase 7: Dimensionality Reduction (Unit 5)",
                "Phase 8: Multi-Agent System",
                "Phase 9: Explainability",
                "Phase 10: Report Generation"
            ],
            "ml_concepts_demonstrated": {
                "Unit 1": ["Data Cleaning", "Data Integration", "Data Reduction", "Data Transformation"],
                "Unit 2": ["Linear Regression", "Multiple Linear Regression", "Polynomial Regression",
                           "LASSO", "RIDGE", "Quantile Regression", "R-Squared", "RMSE", "MSE"],
                "Unit 3": ["Logistic Regression", "KNN", "Decision Trees", "Naive Bayes", "SVM",
                           "ROC", "Confusion Matrix", "Precision", "Recall", "F1 Score"],
                "Unit 4": ["K-Means", "Hierarchical Agglomerative", "Gaussian Mixture",
                           "Apriori Algorithm", "Silhouette Score", "Davies-Bouldin Index"],
                "Unit 5": ["Random Forest", "AdaBoost", "XGBoost", "Bias-Variance Tradeoff",
                           "PCA", "LDA"]
            },
            "agents": [
                "Patient Analysis Agent", "Nutrition Agent", "Allergy Agent",
                "Medication Diet Agent", "Cultural Agent", "Recommendation Agent"
            ]
        }

        summary_path = os.path.join(REPORTS_DIR, "system_summary.json")
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"  System summary saved: {summary_path}")

    def _print_final_summary(self):
        print("\n" + "="*70)
        print("  SYSTEM DEPLOYMENT COMPLETE")
        print("="*70)
        print("")
        print("  PROJECT: Explainable Multi-Agent AI Clinical Nutrition DSS")
        print("")
        print("  SYLLABUS COVERAGE:")
        print("  " + "-"*50)
        print("  Unit 1 (ML Introduction):")
        print("    - Data Preprocessing (cleaning, integration, reduction, transformation)")
        print("    - Supervised/Unsupervised/Reinforcement Learning concepts")
        print("")
        print("  Unit 2 (Regression):")
        print("    - Linear Regression          - Multiple Linear Regression")
        print("    - Polynomial Regression      - LASSO Regression")
        print("    - RIDGE Regression           - Quantile Regression")
        print("    - R-Squared, RMSE, MSE")
        print("")
        print("  Unit 3 (Classification):")
        print("    - Logistic Regression        - K-Nearest Neighbors")
        print("    - Decision Trees             - Naive Bayes")
        print("    - Support Vector Machine     - ROC, Confusion Matrix")
        print("    - Precision, Recall, F1 Score")
        print("")
        print("  Unit 4 (Unsupervised Learning):")
        print("    - K-Means Clustering         - Hierarchical Agglomerative")
        print("    - Gaussian Mixture Model     - Apriori Algorithm")
        print("    - Silhouette Score, Davies-Bouldin Index")
        print("")
        print("  Unit 5 (Advanced Concepts):")
        print("    - Random Forest (Bagging)    - AdaBoost (Boosting)")
        print("    - XGBoost (Boosting)         - Bias-Variance Tradeoff")
        print("    - PCA                        - LDA")
        print("")
        print("  MULTI-AGENT ARCHITECTURE:")
        print("    - Patient Analysis Agent     - Nutrition Agent")
        print("    - Allergy Agent              - Medication-Diet Agent")
        print("    - Cultural Agent             - Recommendation Agent")
        print("")
        print("  EXPLAINABILITY:")
        print("    - SHAP/LIME-style explanations")
        print("    - Patient-readable reports")
        print("    - Clinical rationale generation")
        print("")
        print("  OUTPUT FILES:")
        print(f"    Reports: {REPORTS_DIR}")
        print(f"    Models:  {OUTPUT_DIR}/models")
        print("  " + "-"*50)
        print("")


if __name__ == "__main__":
    system = ClinicalNutritionAI()
    system.run_full_pipeline()
