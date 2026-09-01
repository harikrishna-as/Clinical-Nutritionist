"""
Unit 5: Ensemble Learning
- Bias-Variance Tradeoff
- Bagging: Random Forest
- Boosting: AdaBoost, XGBoost
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (accuracy_score, f1_score, precision_score, recall_score,
                             confusion_matrix, roc_auc_score)
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RANDOM_STATE, TEST_SIZE


class EnsembleNutritionPredictor:
    """Ensemble models for nutrition risk prediction with bias-variance analysis"""

    def __init__(self):
        self.models = {}
        self.results = {}
        self.bias_variance = {}

    def prepare_data(self, df, target_col="Readmitted"):
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        feature_cols = [c for c in numeric_cols if c != target_col]
        if target_col not in df.columns:
            return None, None, None, None
        X = df[feature_cols].fillna(0)
        y = df[target_col].fillna(0).astype(int)

        if y.nunique() < 2:
            if "Severity" in df.columns:
                severity_map = {"Low": 0, "Medium": 1, "High": 2}
                y = df["Severity"].map(severity_map).fillna(0).astype(int)
                target_col = "RiskLevel"
            else:
                return None, None, None, None

        return train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)

    def train_all(self, df, target_col="Readmitted"):
        print("\n" + "="*70)
        print("UNIT 5: ENSEMBLE LEARNING - Advanced Nutrition Risk Prediction")
        print("="*70)

        split = self.prepare_data(df, target_col)
        if split[0] is None:
            return self.results
        X_train, X_test, y_train, y_test = split
        print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}, Features: {X_train.shape[1]}\n")

        self._analyze_bias_variance(X_train, y_train)
        self._random_forest(X_train, X_test, y_train, y_test)
        self._adaboost(X_train, X_test, y_train, y_test)
        self._gradient_boosting(X_train, X_test, y_train, y_test)
        try:
            self._xgboost(X_train, X_test, y_train, y_test)
        except ImportError:
            print("  XGBoost not installed, using GradientBoosting as substitute")
            self._gradient_boosting(X_train, X_test, y_train, y_test, name="XGBoost (approx)")

        self._print_comparison()
        return self.results

    def _analyze_bias_variance(self, X_train, y_train):
        from sklearn.tree import DecisionTreeClassifier
        print("--- Bias-Variance Tradeoff Analysis ---")
        for name, model in [("Decision Stump (high bias)", AdaBoostClassifier(n_estimators=3, random_state=RANDOM_STATE)),
                             ("Random Forest (balanced)", RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE)),
                             ("Deep Tree (high variance)", DecisionTreeClassifier(max_depth=None, random_state=RANDOM_STATE))]:
            try:
                scores = cross_val_score(model, X_train, y_train, cv=5, scoring="f1_weighted")
                mean_score = scores.mean()
                variance = scores.var()
                bias = 1 - mean_score
                self.bias_variance[name] = {"Bias": bias, "Variance": variance, "CV_Score": mean_score}
                print(f"  {name}: Bias={bias:.4f}, Variance={variance:.6f}, CV-F1={mean_score:.4f}")
            except Exception:
                pass

    def _random_forest(self, X_train, X_test, y_train, y_test):
        model = RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_split=5,
                                       random_state=RANDOM_STATE, n_jobs=-1)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        self._store_results("Random Forest (Bagging)", model, X_train, y_train, X_test, y_test, y_pred)
        importances = dict(zip(X_train.columns, model.feature_importances_))
        top = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
        print(f"  Top features: {[(f, round(s, 4)) for f, s in top]}")

    def _adaboost(self, X_train, X_test, y_train, y_test):
        model = AdaBoostClassifier(n_estimators=100, learning_rate=0.5, random_state=RANDOM_STATE)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        self._store_results("AdaBoost (Boosting)", model, X_train, y_train, X_test, y_test, y_pred)

    def _gradient_boosting(self, X_train, X_test, y_train, y_test, name="Gradient Boosting"):
        model = GradientBoostingClassifier(n_estimators=150, max_depth=5, learning_rate=0.1,
                                           random_state=RANDOM_STATE)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        self._store_results(name, model, X_train, y_train, X_test, y_test, y_pred)

    def _xgboost(self, X_train, X_test, y_train, y_test):
        from xgboost import XGBClassifier
        model = XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.1,
                              random_state=RANDOM_STATE, use_label_encoder=False, eval_metric="logloss")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        self._store_results("XGBoost", model, X_train, y_train, X_test, y_test, y_pred)

    def _store_results(self, name, model, X_train, y_train, X_test, y_test, y_pred):
        train_acc = accuracy_score(y_train, model.predict(X_train))
        test_acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        cm = confusion_matrix(y_test, y_pred)

        self.models[name] = model
        self.results[name] = {
            "Train Accuracy": train_acc, "Test Accuracy": test_acc,
            "F1 Score": f1, "Precision": precision, "Recall": recall,
            "Confusion Matrix": cm, "Overfitting Gap": train_acc - test_acc
        }
        print(f"  {name}: Train={train_acc:.4f}, Test={test_acc:.4f}, F1={f1:.4f}, Gap={train_acc-test_acc:.4f}")

    def _print_comparison(self):
        print("\n--- Ensemble Model Comparison ---")
        print(f"{'Model':<28} {'Train Acc':>10} {'Test Acc':>10} {'F1':>8} {'Gap':>8}")
        print("-" * 70)
        best_f1 = -1
        for name, metrics in sorted(self.results.items(), key=lambda x: x[1]["F1 Score"], reverse=True):
            f1 = metrics["F1 Score"]
            if f1 > best_f1:
                best_f1 = f1
                self.best_model = self.models[name]
                self.best_model_name = name
            print(f"  {name:<26} {metrics['Train Accuracy']:>10.4f} {metrics['Test Accuracy']:>10.4f} "
                  f"{f1:>8.4f} {metrics['Overfitting Gap']:>8.4f}")
        print(f"\n  Best: {self.best_model_name} (F1={best_f1:.4f})")

    def predict(self, patient_data):
        if not hasattr(self, "best_model"):
            return None
        return self.best_model.predict(patient_data)
