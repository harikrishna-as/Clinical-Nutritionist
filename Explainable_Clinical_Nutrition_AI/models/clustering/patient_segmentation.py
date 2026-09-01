"""
Unit 4: Unsupervised Learning - Clustering
- K-Means Clustering
- Hierarchical Agglomerative Clustering
- Gaussian Mixture Model
- Apriori Algorithm (Association Rules)
Evaluation: Silhouette Score, Davies-Bouldin Index, Elbow Method
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.preprocessing import StandardScaler
from collections import Counter
import warnings
warnings.filterwarnings("ignore")

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RANDOM_STATE


class PatientSegmentation:
    """Segments patients into dietary groups using clustering techniques"""

    def __init__(self):
        self.models = {}
        self.results = {}
        self.labels = {}
        self.scaler = StandardScaler()

    def prepare_data(self, df):
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        feature_cols = [c for c in numeric_cols if c not in ["Readmitted", "PatientID"]]
        X = df[feature_cols].fillna(0)
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled, feature_cols, X

    def find_optimal_k(self, X_scaled, k_range=range(2, 11)):
        print("\n  Finding optimal K using Elbow Method + Silhouette Score...")
        inertias = []
        silhouettes = []
        for k in k_range:
            km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
            labels = km.fit_predict(X_scaled)
            inertias.append(km.inertia_)
            sil = silhouette_score(X_scaled, labels)
            silhouettes.append(sil)
        best_k = list(k_range)[np.argmax(silhouettes)]
        print(f"  Optimal K = {best_k} (Silhouette = {max(silhouettes):.4f})")
        return best_k

    def train_all(self, df):
        print("\n" + "="*70)
        print("UNIT 4: UNSUPERVISED LEARNING - Patient Dietary Segmentation")
        print("="*70)

        X_scaled, feature_cols, X_raw = self.prepare_data(df)
        print(f"Data: {X_scaled.shape[0]} samples, {X_scaled.shape[1]} features\n")

        optimal_k = self.find_optimal_k(X_scaled)
        self._kmeans(X_scaled, optimal_k)
        self._hierarchical(X_scaled, optimal_k)
        self._gmm(X_scaled, optimal_k)
        self._apriori(df)

        self._print_comparison()
        self._analyze_segments(df)
        return self.results, self.labels

    def _kmeans(self, X_scaled, n_clusters):
        model = KMeans(n_clusters=n_clusters, random_state=RANDOM_STATE, n_init=10)
        labels = model.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        db = davies_bouldin_score(X_scaled, labels)
        self.models["K-Means"] = model
        self.results["K-Means"] = {"Silhouette": sil, "Davies-Bouldin": db, "K": n_clusters}
        self.labels["K-Means"] = labels
        print(f"  K-Means (k={n_clusters}): Silhouette={sil:.4f}, DB Index={db:.4f}")

    def _hierarchical(self, X_scaled, n_clusters):
        model = AgglomerativeClustering(n_clusters=n_clusters, linkage="ward")
        labels = model.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        db = davies_bouldin_score(X_scaled, labels)
        self.models["Hierarchical Agglomerative"] = model
        self.results["Hierarchical Agglomerative"] = {"Silhouette": sil, "Davies-Bouldin": db, "K": n_clusters}
        self.labels["Hierarchical Agglomerative"] = labels
        print(f"  Hierarchical Agglomerative (k={n_clusters}): Silhouette={sil:.4f}, DB Index={db:.4f}")

    def _gmm(self, X_scaled, n_clusters):
        model = GaussianMixture(n_components=n_clusters, random_state=RANDOM_STATE, covariance_type="full")
        labels = model.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        db = davies_bouldin_score(X_scaled, labels)
        bic = model.bic(X_scaled)
        self.models["Gaussian Mixture"] = model
        self.results["Gaussian Mixture"] = {"Silhouette": sil, "Davies-Bouldin": db, "BIC": bic, "K": n_clusters}
        self.labels["Gaussian Mixture"] = labels
        print(f"  Gaussian Mixture (k={n_clusters}): Silhouette={sil:.4f}, BIC={bic:.0f}")

    def _apriori(self, df, min_support=0.1, min_confidence=0.3):
        print("\n  Apriori Association Rule Mining:")
        meal_foods = df.groupby("PatientID")["Avg_Calories"].apply(lambda x: "High" if x.mean() > df["Avg_Calories"].median() else "Low")
        protein_foods = df.groupby("PatientID")["Avg_Protein"].apply(lambda x: "High" if x.mean() > df["Avg_Protein"].median() else "Low")
        sugar_foods = df.groupby("PatientID")["Avg_Sugar"].apply(lambda x: "High" if x.mean() > df["Avg_Sugar"].median() else "Low")

        transactions = []
        for pid in df["PatientID"].unique():
            if pid in meal_foods.index and pid in protein_foods.index and pid in sugar_foods.index:
                transaction = {f"Calories_{meal_foods[pid]}", f"Protein_{protein_foods[pid]}", f"Sugar_{sugar_foods[pid]}"}
                transactions.append(transaction)

        item_counts = Counter()
        for t in transactions:
            item_counts.update(t)
        n_transactions = len(transactions)

        frequent_itemsets = {item: count/n_transactions for item, count in item_counts.items() if count/n_transactions >= min_support}
        rules = []
        items = list(frequent_itemsets.keys())
        for i in range(len(items)):
            for j in range(len(items)):
                if i != j:
                    support_a = frequent_itemsets[items[i]]
                    support_b = frequent_itemsets[items[j]]
                    support_ab = sum(1 for t in transactions if items[i] in t and items[j] in t) / n_transactions
                    if support_ab >= min_support and support_a > 0:
                        confidence = support_ab / support_a
                        if confidence >= min_confidence:
                            rules.append({"antecedent": items[i], "consequent": items[j],
                                          "support": round(support_ab, 4), "confidence": round(confidence, 4)})

        self.results["Apriori"] = {"frequent_itemsets": frequent_itemsets, "rules": rules[:10]}
        print(f"  Frequent itemsets: {len(frequent_itemsets)}")
        for item, sup in sorted(frequent_itemsets.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"    {item}: support={sup:.4f}")
        print(f"  Association rules found: {len(rules)}")
        for rule in rules[:5]:
            print(f"    {rule['antecedent']} -> {rule['consequent']} "
                  f"(conf={rule['confidence']:.2f}, sup={rule['support']:.2f})")

    def _print_comparison(self):
        print("\n--- Clustering Model Comparison ---")
        print(f"{'Model':<30} {'Silhouette':>10} {'Davies-Bouldin':>15} {'K':>5}")
        print("-" * 65)
        best_sil = -1
        for name, metrics in sorted(self.results.items(), key=lambda x: x[1].get("Silhouette", 0), reverse=True):
            if "Silhouette" in metrics:
                sil = metrics["Silhouette"]
                if sil > best_sil:
                    best_sil = sil
                print(f"  {name:<28} {sil:>10.4f} {metrics['Davies-Bouldin']:>15.4f} {metrics['K']:>5}")

    def _analyze_segments(self, df):
        if "K-Means" not in self.labels:
            return
        df_seg = df.copy()
        df_seg["Segment"] = self.labels["K-Means"]
        print("\n  Patient Segment Profiles:")
        for seg in sorted(df_seg["Segment"].unique()):
            seg_data = df_seg[df_seg["Segment"] == seg]
            print(f"\n  Segment {seg} ({len(seg_data)} patients):")
            for col in ["Avg_Calories", "Avg_Protein", "Avg_Carbs", "Avg_Fat"]:
                if col in seg_data.columns:
                    print(f"    {col}: {seg_data[col].mean():.1f}")

    def get_patient_segment(self, patient_data):
        if "K-Means" not in self.models:
            return None
        scaled = self.scaler.transform(patient_data)
        return self.models["K-Means"].predict(scaled)[0]
