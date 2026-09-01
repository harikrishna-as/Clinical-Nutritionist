"""
Unit 1: Data Preprocessing - Cleaning, Integration, Reduction, Transformation
Covers: Data Cleaning, Data Integration, Data Reduction, Data Transformation
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
import warnings
warnings.filterwarnings("ignore")


class ClinicalDataPreprocessor:
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.cleaning_log = []

    def clean_data(self, df, dataset_name="unknown"):
        """Unit 1: Data Cleaning - Handle missing values, duplicates, outliers"""
        print(f"[Preprocessor] Cleaning {dataset_name} ({df.shape[0]} rows)...")
        original_shape = df.shape

        df = df.drop_duplicates()
        self.cleaning_log.append(f"{dataset_name}: Removed {original_shape[0] - df.shape[0]} duplicates")

        for col in df.select_dtypes(include=[np.number]).columns:
            missing_pct = df[col].isnull().sum() / len(df) * 100
            if missing_pct > 0 and missing_pct < 30:
                median_val = df[col].median()
                df[col].fillna(median_val, inplace=True)
                self.cleaning_log.append(f"{dataset_name}: Filled {col} ({missing_pct:.1f}% missing) with median={median_val:.2f}")
            elif missing_pct >= 30:
                df.drop(columns=[col], inplace=True)
                self.cleaning_log.append(f"{dataset_name}: Dropped {col} ({missing_pct:.1f}% missing)")

        for col in df.select_dtypes(include=["object"]).columns:
            missing_pct = df[col].isnull().sum() / len(df) * 100
            if missing_pct > 0 and missing_pct < 30:
                mode_val = df[col].mode()[0] if not df[col].mode().empty else "Unknown"
                df[col].fillna(mode_val, inplace=True)
            elif missing_pct >= 30:
                df.drop(columns=[col], inplace=True)

        for col in df.select_dtypes(include=[np.number]).columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            outliers = ((df[col] < lower) | (df[col] > upper)).sum()
            if outliers > 0:
                df[col] = df[col].clip(lower=lower, upper=upper)
                self.cleaning_log.append(f"{dataset_name}: Clipped {outliers} outliers in {col}")

        print(f"  Cleaned: {df.shape[0]} rows remaining")
        return df

    def transform_features(self, df, target_col=None):
        """Unit 1: Data Transformation - Encode categoricals, scale numerics"""
        print("[Preprocessor] Transforming features...")
        df_processed = df.copy()

        categorical_cols = df_processed.select_dtypes(include=["object", "category"]).columns
        for col in categorical_cols:
            if col == target_col:
                continue
            if df_processed[col].nunique() <= 2:
                le = LabelEncoder()
                df_processed[col] = le.fit_transform(df_processed[col].astype(str))
                self.encoders[col] = le
            elif df_processed[col].nunique() <= 20:
                dummies = pd.get_dummies(df_processed[col], prefix=col, drop_first=True)
                df_processed = pd.concat([df_processed.drop(columns=[col]), dummies], axis=1)

        numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
        if target_col and target_col in numeric_cols:
            numeric_cols = numeric_cols.drop(target_col)

        if len(numeric_cols) > 0:
            scaler = StandardScaler()
            df_processed[numeric_cols] = scaler.fit_transform(df_processed[numeric_cols])
            self.scalers["standard"] = (scaler, list(numeric_cols))

        print(f"  Transformed: {df_processed.shape[1]} features")
        return df_processed

    def reduce_dimensions(self, df, n_components=10, method="pca"):
        """Unit 1/5: Data Reduction using PCA or feature selection"""
        print(f"[Preprocessor] Reducing dimensions with {method.upper()}...")
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.shape[1] <= n_components:
            return df

        if method == "pca":
            pca = PCA(n_components=n_components, random_state=42)
            reduced = pca.fit_transform(numeric_df)
            reduced_df = pd.DataFrame(reduced, columns=[f"PC{i+1}" for i in range(n_components)], index=df.index)
            self.scalers["pca"] = pca
        else:
            selector = SelectKBest(f_classif, k=min(n_components, numeric_df.shape[1]))
            reduced = selector.fit_transform(numeric_df, df.get("Readmitted", pd.Series([0]*len(df))))
            selected_cols = numeric_df.columns[selector.get_support()]
            reduced_df = pd.DataFrame(reduced, columns=selected_cols, index=df.index)

        non_numeric = df.select_dtypes(exclude=[np.number])
        result = pd.concat([non_numeric.reset_index(drop=True), reduced_df.reset_index(drop=True)], axis=1)
        print(f"  Reduced: {df.shape[1]} -> {result.shape[1]} features")
        return result

    def prepare_for_regression(self, df, target_col):
        """Prepare dataset for regression tasks"""
        df_clean = self.clean_data(df.copy(), "regression_input")
        df_encoded = self.transform_features(df_clean, target_col)
        if target_col in df_encoded.columns:
            X = df_encoded.drop(columns=[target_col])
            y = df_encoded[target_col]
        else:
            X = df_encoded
            y = None
        numeric_X = X.select_dtypes(include=[np.number])
        return numeric_X, y

    def prepare_for_classification(self, df, target_col):
        """Prepare dataset for classification tasks"""
        df_clean = self.clean_data(df.copy(), "classification_input")
        df_encoded = self.transform_features(df_clean, target_col)
        if target_col in df_encoded.columns:
            X = df_encoded.drop(columns=[target_col])
            y = df_encoded[target_col]
            if y.dtype == "object":
                le = LabelEncoder()
                y = le.fit_transform(y)
                self.encoders[target_col] = le
        else:
            X = df_encoded
            y = None
        numeric_X = X.select_dtypes(include=[np.number])
        return numeric_X, y

    def prepare_for_clustering(self, df):
        """Prepare dataset for clustering tasks"""
        df_clean = self.clean_data(df.copy(), "clustering_input")
        df_encoded = self.transform_features(df_clean)
        numeric_df = df_encoded.select_dtypes(include=[np.number])
        scaler = StandardScaler()
        scaled = scaler.fit_transform(numeric_df)
        self.scalers["clustering"] = scaler
        return pd.DataFrame(scaled, columns=numeric_df.columns), numeric_df.columns

    def get_cleaning_report(self):
        return "\n".join(self.cleaning_log)
