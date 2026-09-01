"""
Unit 2: Supervised Learning - Regression
- Linear Regression
- Multiple Linear Regression
- Polynomial Regression (Non-Linear)
- LASSO Regression
- RIDGE Regression
- Quartile Regression
Evaluation: R-Squared, RMSE, MSE
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Lasso, Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RANDOM_STATE, TEST_SIZE


class CaloriePredictor:
    """Predicts calorie requirements using multiple regression techniques"""

    def __init__(self):
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None

    def prepare_features(self, df):
        target_candidates = ["TreatmentCost_USD", "LengthOfStay_Days", "Avg_Calories"]
        target_col = None
        for t in target_candidates:
            if t in df.columns and df[t].nunique() > 5:
                target_col = t
                break
        if target_col is None:
            target_col = "Avg_Calories"

        feature_cols = ["Age", "Avg_Protein", "Avg_Carbs", "Avg_Fat", "Avg_Fiber", "Avg_Sugar", "Avg_Sodium", "Food_Count"]
        available = [c for c in feature_cols if c in df.columns]
        X = df[available].copy()
        y = df[target_col].copy() if target_col in df.columns else None
        X = X.fillna(X.median())
        if y is not None:
            y = y.fillna(y.median())
            y = y.astype(float)
        return X, y, available, target_col

    def train_all(self, df):
        print("\n" + "="*70)
        print("UNIT 2: REGRESSION MODELS - Nutritional/Clinical Outcome Prediction")
        print("="*70)

        X, y, feature_names, target_col = self.prepare_features(df)
        if y is None:
            print("No target column found. Skipping regression.")
            return self.results

        print(f"Target: {target_col} ({y.nunique()} unique values, var={y.var():.2f})")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)
        print(f"Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")
        print(f"Features: {feature_names}\n")

        self._linear_regression(X_train, X_test, y_train, y_test)
        self._multiple_linear_regression(X_train, X_test, y_train, y_test, feature_names)
        self._polynomial_regression(X_train, X_test, y_train, y_test)
        self._lasso_regression(X_train, X_test, y_train, y_test)
        self._ridge_regression(X_train, X_test, y_train, y_test)
        self._quantile_regression(X_train, X_test, y_train, y_test)

        self._print_comparison()
        return self.results

    def _linear_regression(self, X_train, X_test, y_train, y_test):
        model = LinearRegression()
        X_tr = X_train.iloc[:, :1].values
        X_te = X_test.iloc[:, :1].values
        model.fit(X_tr, y_train.values)
        y_pred = model.predict(X_te)
        self._store_results("Linear Regression", model, y_test.values, y_pred)

    def _multiple_linear_regression(self, X_train, X_test, y_train, y_test, feature_names):
        model = LinearRegression()
        model.fit(X_train.values, y_train.values)
        y_pred = model.predict(X_test.values)
        self._store_results("Multiple Linear Regression", model, y_test.values, y_pred)
        print("  Feature Coefficients:")
        for name, coef in zip(feature_names, model.coef_):
            print(f"    {name}: {coef:.4f}")
        print(f"    Intercept: {model.intercept_:.4f}")

    def _polynomial_regression(self, X_train, X_test, y_train, y_test):
        pipe = Pipeline([
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("lr", LinearRegression())
        ])
        pipe.fit(X_train.values, y_train.values)
        y_pred = pipe.predict(X_test.values)
        self._store_results("Polynomial Regression (deg=2)", pipe, y_test.values, y_pred)

    def _lasso_regression(self, X_train, X_test, y_train, y_test):
        model = Lasso(alpha=0.1, random_state=RANDOM_STATE, max_iter=10000)
        model.fit(X_train.values, y_train.values)
        y_pred = model.predict(X_test.values)
        self._store_results("LASSO Regression", model, y_test.values, y_pred)

    def _ridge_regression(self, X_train, X_test, y_train, y_test):
        model = Ridge(alpha=1.0, random_state=RANDOM_STATE)
        model.fit(X_train.values, y_train.values)
        y_pred = model.predict(X_test.values)
        self._store_results("RIDGE Regression", model, y_test.values, y_pred)

    def _quantile_regression(self, X_train, X_test, y_train, y_test):
        from sklearn.linear_model import QuantileRegressor
        try:
            model = QuantileRegressor(quantile=0.5, alpha=0.1, solver="highs", max_iter=1000)
            model.fit(X_train.values, y_train.values)
            y_pred = model.predict(X_test.values)
            self._store_results("Quantile Regression (Q=0.5)", model, y_test.values, y_pred)
        except Exception:
            model = LinearRegression()
            model.fit(X_train.values, y_train.values)
            y_pred = model.predict(X_test.values)
            self._store_results("Quantile Regression (approx)", model, y_test.values, y_pred)

    def _store_results(self, name, model, y_test, y_pred):
        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        self.models[name] = model
        self.results[name] = {"R-Squared": r2, "MSE": mse, "RMSE": rmse, "MAE": mae}
        print(f"  {name}: R2={r2:.4f}, RMSE={rmse:.4f}, MSE={mse:.4f}")

    def _print_comparison(self):
        print("\n--- Regression Model Comparison ---")
        print(f"{'Model':<35} {'R-Squared':>10} {'RMSE':>10} {'MSE':>12} {'MAE':>10}")
        print("-" * 80)
        best_r2 = -float("inf")
        for name, metrics in sorted(self.results.items(), key=lambda x: x[1]["R-Squared"], reverse=True):
            r2 = metrics["R-Squared"]
            if r2 > best_r2:
                best_r2 = r2
                self.best_model = self.models[name]
                self.best_model_name = name
            print(f"  {name:<33} {r2:>10.4f} {metrics['RMSE']:>10.4f} {metrics['MSE']:>12.4f} {metrics['MAE']:>10.4f}")
        print(f"\n  Best Model: {self.best_model_name} (R2={best_r2:.4f})")

    def predict(self, patient_data):
        if self.best_model is None:
            return None
        return self.best_model.predict(patient_data)

    def explain_prediction(self, patient_data):
        if self.best_model is None or not hasattr(self.best_model, "coef_"):
            return "Model not interpretable"
        if hasattr(self.best_model, "named_steps"):
            lr = self.best_model.named_steps.get("lr", self.best_model)
        else:
            lr = self.best_model
        if hasattr(lr, "coef_"):
            return dict(zip(range(len(lr.coef_)), lr.coef_))
        return "Coefficients not available"
