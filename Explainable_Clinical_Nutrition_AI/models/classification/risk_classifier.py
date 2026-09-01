"""
Unit 3: Supervised Learning - Classification
- Logistic Regression
- K Nearest Neighbors (KNN)
- Decision Trees
- Naive Bayes Classifier
- Support Vector Machine (SVM)
Evaluation: ROC, Confusion Matrix, Precision, Recall, F1 Score
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import (confusion_matrix, precision_score, recall_score,
                             f1_score, roc_auc_score, roc_curve, classification_report)
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RANDOM_STATE, TEST_SIZE


class RiskClassifier:
    """Classifies patient risk levels using multiple classification techniques"""

    def __init__(self):
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        self.label_names = None

    def prepare_data(self, df, target_col="Readmitted"):
        available_cols = [c for c in df.columns if df[c].dtype in ["int64", "float64", "int32"]]
        if target_col not in available_cols:
            print(f"Target '{target_col}' not found. Available numeric cols: {available_cols[:10]}")
            return None, None, None, None

        feature_cols = [c for c in available_cols if c != target_col]
        X = df[feature_cols].fillna(0)
        y = df[target_col].fillna(0).astype(int)

        self.label_names = sorted(y.unique())
        return train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)

    def train_all(self, df, target_col="Readmitted"):
        print("\n" + "="*70)
        print("UNIT 3: CLASSIFICATION MODELS - Patient Risk Classification")
        print("="*70)

        split = self.prepare_data(df, target_col)
        if split[0] is None:
            return self.results
        X_train, X_test, y_train, y_test = split
        print(f"Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")
        print(f"Features: {list(X_train.columns[:8])}...")
        print(f"Classes: {self.label_names}\n")

        if len(self.label_names) < 2:
            print("  WARNING: Target has only one class. Using Severity-based multi-class target instead...")
            if "Severity" in df.columns:
                severity_map = {"Low": 0, "Medium": 1, "High": 2}
                df_compat = df.copy()
                df_compat["RiskLevel"] = df_compat["Severity"].map(severity_map).fillna(0).astype(int)
                split = self.prepare_data(df_compat, target_col="RiskLevel")
                if split[0] is None:
                    return self.results
                X_train, X_test, y_train, y_test = split
                print(f"  Using RiskLevel (Severity) as target: {self.label_names}")
            else:
                print("  No suitable multi-class target found. Skipping classification.")
                return self.results

        self._logistic_regression(X_train, X_test, y_train, y_test)
        self._knn(X_train, X_test, y_train, y_test)
        self._decision_tree(X_train, X_test, y_train, y_test)
        self._naive_bayes(X_train, X_test, y_train, y_test)
        self._svm(X_train, X_test, y_train, y_test)

        self._print_comparison()
        return self.results

    def _logistic_regression(self, X_train, X_test, y_train, y_test):
        model = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if len(self.label_names) == 2 else None
        self._store_results("Logistic Regression", model, y_test, y_pred, y_proba)

    def _knn(self, X_train, X_test, y_train, y_test):
        best_k, best_f1 = 3, 0
        for k in range(3, min(11, len(X_train))):
            model = KNeighborsClassifier(n_neighbors=k)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_k = k
        model = KNeighborsClassifier(n_neighbors=best_k)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if len(self.label_names) == 2 else None
        self._store_results(f"KNN (k={best_k})", model, y_test, y_pred, y_proba)

    def _decision_tree(self, X_train, X_test, y_train, y_test):
        model = DecisionTreeClassifier(max_depth=10, random_state=RANDOM_STATE)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if len(self.label_names) == 2 else None
        self._store_results("Decision Tree", model, y_test, y_pred, y_proba)
        importances = dict(zip(X_train.columns, model.feature_importances_))
        top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
        print(f"  Top features: {[(f, round(s, 4)) for f, s in top_features]}")

    def _naive_bayes(self, X_train, X_test, y_train, y_test):
        model = GaussianNB()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if len(self.label_names) == 2 else None
        self._store_results("Naive Bayes", model, y_test, y_pred, y_proba)

    def _svm(self, X_train, X_test, y_train, y_test):
        model = SVC(kernel="rbf", probability=True, random_state=RANDOM_STATE, max_iter=2000)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if len(self.label_names) == 2 else None
        self._store_results("SVM (RBF)", model, y_test, y_pred, y_proba)

    def _store_results(self, name, model, y_test, y_pred, y_proba=None):
        cm = confusion_matrix(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        roc = roc_auc_score(y_test, y_proba) if y_proba is not None else None

        self.models[name] = model
        self.results[name] = {
            "Confusion Matrix": cm, "Precision": precision,
            "Recall": recall, "F1 Score": f1, "ROC-AUC": roc
        }
        roc_str = f"{roc:.4f}" if roc else "N/A"
        print(f"  {name}: Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}, ROC={roc_str}")

    def _print_comparison(self):
        print("\n--- Classification Model Comparison ---")
        print(f"{'Model':<25} {'Precision':>10} {'Recall':>10} {'F1 Score':>10} {'ROC-AUC':>10}")
        print("-" * 70)
        best_f1 = -1
        for name, metrics in sorted(self.results.items(), key=lambda x: x[1]["F1 Score"], reverse=True):
            f1 = metrics["F1 Score"]
            if f1 > best_f1:
                best_f1 = f1
                self.best_model = self.models[name]
                self.best_model_name = name
            roc = metrics["ROC-AUC"]
            roc_str = f"{roc:.4f}" if roc else "N/A"
            print(f"  {name:<23} {metrics['Precision']:>10.4f} {metrics['Recall']:>10.4f} "
                  f"{f1:>10.4f} {roc_str:>10}")
        print(f"\n  Best Model: {self.best_model_name} (F1={best_f1:.4f})")

    def predict_risk(self, patient_data):
        if self.best_model is None:
            return None
        prediction = self.best_model.predict(patient_data)
        probability = None
        if hasattr(self.best_model, "predict_proba"):
            probability = self.best_model.predict_proba(patient_data)
        return prediction, probability

    def explain_prediction(self, patient_data):
        if self.best_model is None or not hasattr(self.best_model, "feature_importances_"):
            return "Feature importance not available for this model"
        return dict(zip(patient_data.columns, self.best_model.feature_importances_))
