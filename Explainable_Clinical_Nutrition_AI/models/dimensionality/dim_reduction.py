"""
Unit 5: Dimensionality Reduction
- Principal Component Analysis (PCA)
- Linear Discriminant Analysis (LDA)
"""
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RANDOM_STATE


class NutritionDimensionalityReducer:
    """Reduces nutrient/patient feature dimensions using PCA and LDA"""

    def __init__(self):
        self.pca_model = None
        self.lda_model = None
        self.scaler = StandardScaler()
        self.pca_results = {}
        self.lda_results = {}

    def apply_pca(self, X, n_components=None, explained_variance_threshold=0.95):
        print("\n  --- PCA (Principal Component Analysis) ---")
        X_scaled = self.scaler.fit_transform(X)

        if n_components is None:
            full_pca = PCA(random_state=RANDOM_STATE)
            full_pca.fit(X_scaled)
            cumvar = np.cumsum(full_pca.explained_variance_ratio_)
            n_components = np.argmax(cumvar >= explained_variance_threshold) + 1
            n_components = max(2, min(n_components, X.shape[1]))
            print(f"  Components for {explained_variance_threshold*100:.0f}% variance: {n_components}")

        self.pca_model = PCA(n_components=n_components, random_state=RANDOM_STATE)
        X_pca = self.pca_model.fit_transform(X_scaled)
        explained_var = self.pca_model.explained_variance_ratio_
        total_var = explained_var.sum()

        self.pca_results = {
            "n_components": n_components,
            "explained_variance_ratio": explained_var.tolist(),
            "cumulative_variance": np.cumsum(explained_var).tolist(),
            "total_variance_explained": total_var,
            "components": self.pca_model.components_,
            "feature_names": list(X.columns) if hasattr(X, "columns") else [f"f{i}" for i in range(X.shape[1])]
        }

        print(f"  Selected {n_components} components explaining {total_var*100:.2f}% variance")
        for i, var in enumerate(explained_var):
            print(f"    PC{i+1}: {var*100:.2f}% (cumulative: {np.cumsum(explained_var)[i]*100:.2f}%)")

        loadings = pd.DataFrame(
            self.pca_model.components_.T,
            columns=[f"PC{i+1}" for i in range(n_components)],
            index=self.pca_results["feature_names"]
        )
        print("\n  PCA Loadings (top features per component):")
        for pc in [f"PC{i+1}" for i in range(min(3, n_components))]:
            top = loadings[pc].abs().sort_values(ascending=False).head(3)
            print(f"    {pc}: {[(idx, round(val, 4)) for idx, val in top.items()]}")

        return X_pca

    def apply_lda(self, X, y, n_components=None):
        print("\n  --- LDA (Linear Discriminant Analysis) ---")
        X_scaled = self.scaler.fit_transform(X)

        n_classes = len(np.unique(y))
        if n_components is None:
            n_components = min(n_classes - 1, X.shape[1])
        n_components = max(1, n_components)

        self.lda_model = LinearDiscriminantAnalysis(n_components=n_components)
        X_lda = self.lda_model.fit_transform(X_scaled, y)
        explained_var = self.lda_model.explained_variance_ratio_

        self.lda_results = {
            "n_components": n_components,
            "explained_variance_ratio": explained_var.tolist(),
            "total_variance_explained": explained_var.sum(),
            "scalings": self.lda_model.scalings_ if hasattr(self.lda_model, "scalings") else None,
            "feature_names": list(X.columns) if hasattr(X, "columns") else [f"f{i}" for i in range(X.shape[1])]
        }

        print(f"  Selected {n_components} discriminant components")
        for i, var in enumerate(explained_var):
            print(f"    LD{i+1}: {var*100:.2f}%")

        if self.lda_results["scalings"] is not None:
            print("\n  LDA Feature Discriminants:")
            for i in range(min(2, n_components)):
                discriminants = pd.Series(
                    np.abs(self.lda_results["scalings"][:, i]),
                    index=self.lda_results["feature_names"]
                ).sort_values(ascending=False).head(5)
                print(f"    LD{i+1}: {[(idx, round(val, 4)) for idx, val in discriminants.items()]}")

        return X_lda

    def compare_pca_lda(self, X, y):
        print("\n" + "="*70)
        print("UNIT 5: DIMENSIONALITY REDUCTION COMPARISON")
        print("="*70)

        X_pca = self.apply_pca(X)
        X_lda = self.apply_lda(X, y)

        print(f"\n  PCA: {X.shape[1]} -> {X_pca.shape[1]} components ({X_pca.shape[1]/X.shape[1]*100:.1f}% reduction)")
        print(f"  LDA: {X.shape[1]} -> {X_lda.shape[1]} components ({X_lda.shape[1]/X.shape[1]*100:.1f}% reduction)")
        print(f"  PCA total variance: {self.pca_results['total_variance_explained']*100:.2f}%")
        print(f"  LDA total variance: {self.lda_results['total_variance_explained']*100:.2f}%")
        print("\n  PCA is unsupervised (maximizes variance)")
        print("  LDA is supervised (maximizes class separation)")
        print("  For nutrition: PCA finds nutrient patterns, LDA finds disease-discriminating nutrients")

        return X_pca, X_lda

    def get_reduced_features(self, original_features, method="pca"):
        if method == "pca" and self.pca_model is not None:
            components = self.pca_model.components_
            result = {}
            for i, pc_name in enumerate([f"PC{i+1}" for i in range(components.shape[0])]):
                top_idx = np.argsort(np.abs(components[i]))[::-1][:5]
                result[pc_name] = [(original_features[idx], round(components[i][idx], 4)) for idx in top_idx]
            return result
        elif method == "lda" and self.lda_model is not None:
            return self.lda_results
        return None
