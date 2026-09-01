"""
Database Service - reads the real project outputs (report, preprocessed data)
and provides structured dataset metadata for the web explorer.
"""
import os
import json
import pandas as pd


class DatabaseService:
    ROOTS = {
        "old": os.path.join("Old datasets"),
        "new": os.path.join("New dataset"),
        "prepared": os.path.join("prepared"),
        "root": "",
    }

    def __init__(self, output_dir, data_dir=None):
        self.output_dir = output_dir
        if data_dir is None:
            data_dir = os.path.dirname(output_dir)
        self.data_dir = data_dir
        self.report_path = os.path.join(output_dir, "reports", "clinical_nutrition_report.json")
        self.summary_path = os.path.join(output_dir, "reports", "system_summary.json")

    def _resolve(self, root, rel):
        return os.path.join(self.data_dir, self.ROOTS.get(root, ""), rel)

    def get_report(self):
        if os.path.exists(self.report_path):
            with open(self.report_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"error": "report not found"}

    def get_system_summary(self):
        if os.path.exists(self.summary_path):
            with open(self.summary_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def get_overview(self):
        report = self.get_report()
        summary = self.get_system_summary()
        report_summary = report.get("summary", {}) if isinstance(report, dict) else {}
        sections = report.get("sections", {}) if isinstance(report, dict) else {}
        return {
            "title": "Explainable Multi-Agent AI Clinical Nutrition DSS",
            "total_models": report_summary.get("total_models_evaluated", 0),
            "regression_models": report_summary.get("regression_models", 0),
            "classification_models": report_summary.get("classification_models", 0),
            "clustering_models": report_summary.get("clustering_models", 0),
            "ensemble_models": report_summary.get("ensemble_models", 0),
            "dim_reduction_models": report_summary.get("dimensionality_reduction_models", 0),
            "sections": list(sections.keys()),
            "agents": summary.get("agents", []),
            "phases": summary.get("phases_completed", []),
            "best_regression": self._best_in_section(sections.get("Regression"), "R-Squared"),
            "best_classification": self._best_in_section(sections.get("Classification"), "F1 Score"),
            "best_ensemble": self._best_in_section(sections.get("Ensemble"), "F1 Score"),
        }

    @staticmethod
    def _best_in_section(section, metric):
        if not section:
            return None
        models = section.get("models", [])
        if not models:
            return None
        valid = [m for m in models if m.get(metric) is not None]
        if not valid:
            return None
        return max(valid, key=lambda m: m.get(metric, 0))

    def list_datasets(self):
        # (id, root, rel_path, description)
        RO = "old"; RN = "new"; RP = "prepared"; RR = "root"
        datasets = [
            # --- prepared unified outputs ---
            ("food_nutrient_unified", RP, "food_nutrient_unified.csv",
             "Unified food-nutrient table (FDC + CN + FNDDS + INDB + OpenFoodFacts + daily log)"),
            ("clinical_patients_unified", RP, "clinical_patients_unified.csv",
             "Unified patient analytics (BRFSS + eICU + Synthea + simulated healthcare)"),
            ("medicines_clean", RP, "medicines_clean.csv", "A-Z medicines of India (deduplicated)"),
            ("skincare_manifest", RP, "skincare_manifest.csv", "Image manifest: vitamin deficiency + acne/eczema + ISIC + hair loss"),
            ("openfoodfacts_sample", RP, "openfoodfacts_sample.csv", "OpenFoodFacts FR sampled products (800k)"),
            # --- old datasets ---
            ("food_nutrition", RO, "daily_food_nutrition_dataset.csv", "Daily Food & Nutrition Log"),
            ("healthcare", RO, "Simulated_Healthcare_Dataset.csv", "Simulated Healthcare Records"),
            ("obesity_survey", RO, "export.csv", "Obesity Behavioral Survey (BRFSS-style)"),
            ("diabetes_brfss", RO, os.path.join("diabetes_012_health_indicators_BRFSS2015.csv",
                                                "diabetes_012_health_indicators_BRFSS2015.csv"),
             "BRFSS 2015 Diabetes Health Indicators (253,680 patients)"),
            ("eicu_patient", RO, os.path.join("patient.csv", "patient.csv"), "eICU Critical Care Patients"),
            ("synthea_patients", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "patients.csv"), "Synthea Synthetic Patients"),
            ("synthea_conditions", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "conditions.csv"), "Synthea Conditions"),
            ("synthea_observations", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "observations.csv"), "Synthea Observations"),
            ("synthea_medications", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "medications.csv"), "Synthea Medications"),
            ("cn_food_descriptions", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_FDES.csv"), "Canadian Nutrient File - Foods"),
            ("cn_nutrient_values", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_NUTVAL.csv"), "Canadian Nutrient File - Values"),
            ("usda_food", RO, os.path.join("FoodData_Central_foundation_food_csv_2026-04-30",
                                           "FoodData_Central_foundation_food_csv_2026-04-30", "food.csv"),
             "USDA FoodData Central - Foundation Foods"),
            ("usda_food_nutrient", RO, os.path.join("FoodData_Central_foundation_food_csv_2026-04-30",
                                                    "FoodData_Central_foundation_food_csv_2026-04-30", "food_nutrient.csv"),
             "USDA FoodData Central - Foundation Nutrients"),
            ("medicines_india", RO, os.path.join("archive", "A_Z_medicines_dataset_of_India.csv"),
             "A-Z Medicines Dataset of India (253k)"),
            ("vitamin_images", RO, os.path.join("archive", "dataset"), "Vitamin deficiency image classes (16,424 images, 8 classes)"),
            ("skin_images", RO, os.path.join("Dataset", "Dataset", "train"),
             "Skin condition images - Acne/Eczema/Normal (train split)"),
            # --- new datasets ---
            ("fdc_branded", RN, os.path.join("FoodData_Central_branded_food_csv_2026-04-30",
                                             "FoodData_Central_branded_food_csv_2026-04-30", "food.csv"),
             "USDA FoodData Central - Branded Foods (2M)"),
            ("fdc_sr_legacy", RN, os.path.join("FoodData_Central_sr_legacy_food_csv_2018-04",
                                               "FoodData_Central_sr_legacy_food_csv_2018-04", "food.csv"),
             "USDA FoodData Central - SR Legacy Foods"),
            ("fdc_survey", RN, os.path.join("FoodData_Central_survey_food_csv_2024-10-31",
                                            "FoodData_Central_survey_food_csv_2024-10-31", "food.csv"),
             "USDA FoodData Central - Survey (FNDDS) Foods"),
            ("indb", RN, os.path.join("Indian-Nutrient-Databank-INDB--main",
                                      "Indian-Nutrient-Databank-INDB--main", "INDB.xlsx"),
             "Indian Nutrient Databank (INDB)"),
            ("fndds_nutrients", RN, "2021-2023 FNDDS At A Glance - FNDDS Nutrient Values.xlsx",
             "FNDDS 2021-2023 Nutrient Values"),
            ("fitzpatrick17k", RN, "fitzpatrick17k-main/fitzpatrick17k-main/fitzpatrick17k.csv",
             "Fitzpatrick17k skin lesion labels (17k images, labels only)"),
            ("isic2016", RN, os.path.join("ISBI2016_ISIC_Part3_Training_Data",
                                          "ISBI2016_ISIC_Part3_Training_Data"), "ISIC 2016 dermoscopic training images (900)"),
            ("pharmgkb_variants", RN, os.path.join("clinicalVariants", "clinicalVariants.tsv"),
             "PharmGKB clinical variant annotations"),
            ("openfoodfacts_fr", RO, "fr.openfoodfacts.org.products.csv", "OpenFoodFacts France full dump (13.3 GB, tab-sep)"),
            ("metadata_summary", RO, "metadata summary.csv", "NHANES-style dietary summary statistics"),
            # --- old datasets: remaining tables ---
            ("synthea_allergies", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "allergies.csv"), "Synthea Allergies"),
            ("synthea_careplans", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "careplans.csv"), "Synthea Care Plans"),
            ("synthea_devices", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "devices.csv"), "Synthea Devices"),
            ("synthea_encounters", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "encounters.csv"), "Synthea Encounters"),
            ("synthea_imaging", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "imaging_studies.csv"), "Synthea Imaging Studies"),
            ("synthea_immunizations", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "immunizations.csv"), "Synthea Immunizations"),
            ("synthea_organizations", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "organizations.csv"), "Synthea Organizations"),
            ("synthea_payer_transitions", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "payer_transitions.csv"), "Synthea Payer Transitions"),
            ("synthea_payers", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "payers.csv"), "Synthea Payers"),
            ("synthea_procedures", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "procedures.csv"), "Synthea Procedures"),
            ("synthea_providers", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "providers.csv"), "Synthea Providers"),
            ("synthea_supplies", RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "supplies.csv"), "Synthea Supplies"),
            ("cn_food_categories", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_CTGNME.csv"), "Canadian Nutrient File - Food Categories"),
            ("cn_nutrient_descriptions", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_NUTDES.csv"), "Canadian Nutrient File - Nutrient Descriptions"),
            ("cn_portions", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_WGHT.csv"), "Canadian Nutrient File - Portion Weights"),
            ("cn_gpc_codes", RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_GPCNME.csv"), "Canadian Nutrient File - GPC Codes"),
            ("mimic_ndc", RO, os.path.join("MIMIC-IV-Data-Pipeline-main", "MIMIC-IV-Data-Pipeline-main",
                                           "utils", "mappings", "NDC_product_table.csv"),
             "MIMIC-IV NDC product mapping table"),
            ("book2_ancc", RO, "Book2.xlsx", "ANCC register workbook"),
            ("ebi_study_meta", RO, "data.json", "EBI study metadata (ISF/ISA-Tab)"),
            ("hair_loss_men", RO, os.path.join("archive (1)"), "Hair Loss in Men segmentation dataset (front/top + masks)"),
            ("hair_loss_women", RO, os.path.join("archive (2)"), "Hair Loss in Women segmentation dataset (top + masks)"),
            # --- new datasets: remaining tables ---
            ("fndds_ingredients", RN, "2021-2023 FNDDS At A Glance - FNDDS Ingredients.xlsx", "FNDDS 2021-2023 Ingredient Links"),
            ("fndds_ingredient_nutrients", RN, "2021-2023 FNDDS At A Glance - Ingredient Nutrient Values.xlsx",
             "FNDDS 2021-2023 Ingredient Nutrient Values"),
            ("indb_recipes", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes.xlsx"),
             "INDB Recipes"),
            ("indb_recipes_names", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes_names.xlsx"),
             "INDB Recipe Names"),
            ("indb_recipe_servings", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes_servingsize.xlsx"),
             "INDB Recipe Serving Sizes"),
            ("indb_recipe_links", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipe_links.xlsx"),
             "INDB Recipe Links"),
            ("indb_units", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "Units.xlsx"), "INDB Units"),
            ("indb_uk_fct", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "UK_fct.xlsx"),
             "INDB UK Food Composition reference"),
            ("indb_us_fct", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "US_fct.xlsx"),
             "INDB US Food Composition reference"),
            ("indb_usda_nrf", RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "USDA_nrf.xlsx"),
             "INDB USDA Nutrient Retention Factors"),
            ("who_wfa_boys", RN, "wfa_boys_0-to-5-years_zscores.xlsx", "WHO weight-for-age z-scores - boys (0-5 y)"),
            ("who_wfa_girls", RN, "wfa_girls_0-to-5-years_zscores.xlsx", "WHO weight-for-age z-scores - girls (0-5 y)"),
            ("foodb_cms_peaks", RN, os.path.join("foodb_experimental_cms_peak_lists"), "FooDB experimental CMS peak lists (84 spectral files)"),
            ("foodb_nmr_peaks", RN, os.path.join("foodb_nmr_peak_lists"), "FooDB NMR peak lists (2,024 spectral files)"),
        ]
        result = []
        for key, root, rel, desc in datasets:
            path = self._resolve(root, rel)
            info = {"id": key, "name": key, "description": desc, "path": rel, "root": root}
            if os.path.exists(path):
                try:
                    if os.path.isdir(path):
                        info.update({"rows": "directory", "columns": None, "column_names": [],
                                     "preview": [], "type": "image_collection",
                                     "file_count": sum(1 for f in os.listdir(path)
                                                       if os.path.isfile(os.path.join(path, f)))})
                        result.append(info)
                        continue
                    if rel.lower().endswith((".tsv",)):
                        df = pd.read_csv(path, nrows=100, sep="\t", low_memory=False, on_bad_lines="skip")
                    elif rel.lower().endswith((".xlsx", ".xls")):
                        df = pd.read_excel(path, nrows=100)
                    else:
                        df = pd.read_csv(path, nrows=100, low_memory=False, on_bad_lines="skip")
                    full_count = self._count_rows(path)
                    info.update({
                        "rows": full_count,
                        "columns": df.shape[1],
                        "column_names": list(df.columns),
                        "preview": df.head(5).fillna("").to_dict("records"),
                        "type": "tabular",
                    })
                except Exception as e:
                    info["error"] = str(e)
            else:
                info["rows"] = 0
                info["exists"] = False
            result.append(info)
        return result

    def _row_count_tsv(self, path):
        try:
            return sum(1 for _ in open(path, encoding="utf-8", errors="replace")) - 1
        except Exception:
            return 0

    @staticmethod
    def _count_rows(path):
        if os.path.isdir(path):
            return 0
        low = path.lower()
        try:
            if low.endswith((".tsv",)):
                return sum(1 for _ in open(path, encoding="utf-8", errors="replace")) - 1
            if low.endswith((".xlsx", ".xls")):
                try:
                    return len(pd.read_excel(path))
                except Exception:
                    return int(0)
            size = os.path.getsize(path)
            BIG = 1_500_000_000  # 1.5 GB - skip full scan, estimate instead
            if size > BIG:
                first = pd.read_csv(path, nrows=100000, low_memory=False, on_bad_lines="skip",
                                    encoding_errors="replace")
                est = int(round(len(first) * size / max(size, 1)))
                return "~" + str(int(est)) + " (large file, estimated)"
            chunks = pd.read_csv(path, chunksize=100000, low_memory=False, on_bad_lines="skip",
                                 encoding_errors="replace")
            return sum(len(c) for c in chunks)
        except Exception:
            return 0

    def preview_dataset(self, name, limit=20):
        RO = "old"; RN = "new"; RP = "prepared"
        mapping = {
            "food_nutrition_unified": (RP, "food_nutrient_unified.csv"),
            "clinical_patients_unified": (RP, "clinical_patients_unified.csv"),
            "medicines_clean": (RP, "medicines_clean.csv"),
            "skincare_manifest": (RP, "skincare_manifest.csv"),
            "openfoodfacts_sample": (RP, "openfoodfacts_sample.csv"),
            "food_nutrition": (RO, "daily_food_nutrition_dataset.csv"),
            "healthcare": (RO, "Simulated_Healthcare_Dataset.csv"),
            "obesity_survey": (RO, "export.csv"),
            "diabetes_brfss": (RO, os.path.join("diabetes_012_health_indicators_BRFSS2015.csv",
                                                "diabetes_012_health_indicators_BRFSS2015.csv")),
            "eicu_patient": (RO, os.path.join("patient.csv", "patient.csv")),
            "synthea_patients": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "patients.csv")),
            "synthea_conditions": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "conditions.csv")),
            "synthea_observations": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "observations.csv")),
            "synthea_medications": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "medications.csv")),
            "cn_food_descriptions": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_FDES.csv")),
            "cn_nutrient_values": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_NUTVAL.csv")),
            "usda_food": (RO, os.path.join("FoodData_Central_foundation_food_csv_2026-04-30",
                                           "FoodData_Central_foundation_food_csv_2026-04-30", "food.csv")),
            "usda_food_nutrient": (RO, os.path.join("FoodData_Central_foundation_food_csv_2026-04-30",
                                                    "FoodData_Central_foundation_food_csv_2026-04-30", "food_nutrient.csv")),
            "medicines_india": (RO, os.path.join("archive", "A_Z_medicines_dataset_of_India.csv")),
            "fdc_branded": (RN, os.path.join("FoodData_Central_branded_food_csv_2026-04-30",
                                             "FoodData_Central_branded_food_csv_2026-04-30", "food.csv")),
            "fdc_sr_legacy": (RN, os.path.join("FoodData_Central_sr_legacy_food_csv_2018-04",
                                               "FoodData_Central_sr_legacy_food_csv_2018-04", "food.csv")),
            "fdc_survey": (RN, os.path.join("FoodData_Central_survey_food_csv_2024-10-31",
                                            "FoodData_Central_survey_food_csv_2024-10-31", "food.csv")),
            "indb": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main",
                                      "Indian-Nutrient-Databank-INDB--main", "INDB.xlsx")),
            "fndds_nutrients": (RN, "2021-2023 FNDDS At A Glance - FNDDS Nutrient Values.xlsx"),
            "fitzpatrick17k": (RN, "fitzpatrick17k-main/fitzpatrick17k-main/fitzpatrick17k.csv"),
            "isic2016": (RN, os.path.join("ISBI2016_ISIC_Part3_Training_Data",
                                          "ISBI2016_ISIC_Part3_Training_Data")),
            "foodb_cms_peaks": (RN, os.path.join("foodb_experimental_cms_peak_lists")),
            "foodb_nmr_peaks": (RN, os.path.join("foodb_nmr_peak_lists")),
            "pharmgkb_variants": (RN, os.path.join("clinicalVariants", "clinicalVariants.tsv")),
            "openfoodfacts_fr": (RO, "fr.openfoodfacts.org.products.csv"),
            "metadata_summary": (RO, "metadata summary.csv"),
            "synthea_allergies": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "allergies.csv")),
            "synthea_careplans": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "careplans.csv")),
            "synthea_devices": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "devices.csv")),
            "synthea_encounters": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "encounters.csv")),
            "synthea_imaging": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "imaging_studies.csv")),
            "synthea_immunizations": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "immunizations.csv")),
            "synthea_organizations": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "organizations.csv")),
            "synthea_payer_transitions": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "payer_transitions.csv")),
            "synthea_payers": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "payers.csv")),
            "synthea_procedures": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "procedures.csv")),
            "synthea_providers": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "providers.csv")),
            "synthea_supplies": (RO, os.path.join("synthea_sample_data_csv_apr2020", "csv", "supplies.csv")),
            "cn_food_categories": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_CTGNME.csv")),
            "cn_nutrient_descriptions": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_NUTDES.csv")),
            "cn_portions": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_WGHT.csv")),
            "cn_gpc_codes": (RO, os.path.join("CN.2026.06-CSV", "CN.2026.06_GPCNME.csv")),
            "mimic_ndc": (RO, os.path.join("MIMIC-IV-Data-Pipeline-main", "MIMIC-IV-Data-Pipeline-main",
                                           "utils", "mappings", "NDC_product_table.csv")),
            "book2_ancc": (RO, "Book2.xlsx"),
            "ebi_study_meta": (RO, "data.json"),
            "hair_loss_men": (RO, os.path.join("archive (1)")),
            "hair_loss_women": (RO, os.path.join("archive (2)")),
            "fndds_ingredients": (RN, "2021-2023 FNDDS At A Glance - FNDDS Ingredients.xlsx"),
            "fndds_ingredient_nutrients": (RN, "2021-2023 FNDDS At A Glance - Ingredient Nutrient Values.xlsx"),
            "indb_recipes": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes.xlsx")),
            "indb_recipes_names": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes_names.xlsx")),
            "indb_recipe_servings": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipes_servingsize.xlsx")),
            "indb_recipe_links": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "recipe_links.xlsx")),
            "indb_units": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "Units.xlsx")),
            "indb_uk_fct": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "UK_fct.xlsx")),
            "indb_us_fct": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "US_fct.xlsx")),
            "indb_usda_nrf": (RN, os.path.join("Indian-Nutrient-Databank-INDB--main", "Indian-Nutrient-Databank-INDB--main", "USDA_nrf.xlsx")),
            "who_wfa_boys": (RN, "wfa_boys_0-to-5-years_zscores.xlsx"),
            "who_wfa_girls": (RN, "wfa_girls_0-to-5-years_zscores.xlsx"),
            "foodb_cms_peaks": (RN, os.path.join("foodb_experimental_cms_peak_lists")),
            "foodb_nmr_peaks": (RN, os.path.join("foodb_nmr_peak_lists")),
        }
        entry = mapping.get(name)
        if not entry:
            return {"error": "unknown dataset"}
        root, rel = entry
        path = self._resolve(root, rel)
        if not os.path.exists(path):
            return {"error": "file not found"}
        if os.path.isdir(path):
            files = sorted(os.listdir(path))
            sample = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".csv", ".txt"))][:limit]
            return {"name": name, "rows": "directory", "type": "image_collection",
                    "file_count": len(files), "sample_files": sample}
        if rel.lower().endswith(".json"):
            import json as _json
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                obj = _json.load(f)
            return {"name": name, "rows": 1, "columns": len(obj) if isinstance(obj, dict) else len(obj),
                    "column_names": list(obj.keys()) if isinstance(obj, dict) else ["item"],
                    "data": [obj[:10] if isinstance(obj, list) else obj]}
        if rel.lower().endswith((".tsv",)):
            df = pd.read_csv(path, nrows=limit, sep="\t", low_memory=False, on_bad_lines="skip")
        elif rel.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(path, nrows=limit)
        else:
            df = pd.read_csv(path, nrows=limit, low_memory=False, on_bad_lines="skip")
        return {
            "name": name,
            "rows": self._count_rows(path),
            "columns": df.shape[1],
            "column_names": list(df.columns),
            "data": df.fillna("").head(limit).to_dict("records"),
        }
