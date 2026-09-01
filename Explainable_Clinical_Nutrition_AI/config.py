"""
Configuration for Explainable Multi-Agent AI Clinical Nutrition Decision Support System
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
REPORTS_DIR = os.path.join(OUTPUT_DIR, "reports")
MODELS_DIR = os.path.join(OUTPUT_DIR, "models")

DATASETS = {
    "food_nutrition": os.path.join(DATA_DIR, "daily_food_nutrition_dataset.csv"),
    "healthcare": os.path.join(DATA_DIR, "Simulated_Healthcare_Dataset.csv"),
    "obesity_survey": os.path.join(DATA_DIR, "export.csv"),
    "eicu_patient": os.path.join(DATA_DIR, "patient.csv", "patient.csv"),
    "synthea_patients": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "patients.csv"),
    "synthea_conditions": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "conditions.csv"),
    "synthea_observations": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "observations.csv"),
    "synthea_medications": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "medications.csv"),
    "synthea_allergies": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "allergies.csv"),
    "synthea_encounters": os.path.join(DATA_DIR, "synthea_sample_data_csv_apr2020", "csv", "encounters.csv"),
    "cn_food_descriptions": os.path.join(DATA_DIR, "CN.2026.06-CSV", "CN.2026.06_FDES.csv"),
    "cn_nutrient_values": os.path.join(DATA_DIR, "CN.2026.06-CSV", "CN.2026.06_NUTVAL.csv"),
    "cn_nutrient_descriptions": os.path.join(DATA_DIR, "CN.2026.06-CSV", "CN.2026.06_NUTDES.csv"),
    "cn_food_categories": os.path.join(DATA_DIR, "CN.2026.06-CSV", "CN.2026.06_CTGNME.csv"),
    "cn_portions": os.path.join(DATA_DIR, "CN.2026.06-CSV", "CN.2026.06_WGHT.csv"),
    "usda_food": os.path.join(DATA_DIR, "FoodData_Central_foundation_food_csv_2026-04-30", "FoodData_Central_foundation_food_csv_2026-04-30", "food.csv"),
    "usda_food_nutrient": os.path.join(DATA_DIR, "FoodData_Central_foundation_food_csv_2026-04-30", "FoodData_Central_foundation_food_csv_2026-04-30", "food_nutrient.csv"),
    "usda_nutrient": os.path.join(DATA_DIR, "FoodData_Central_foundation_food_csv_2026-04-30", "FoodData_Central_foundation_food_csv_2026-04-30", "nutrient.csv"),
    "usda_food_category": os.path.join(DATA_DIR, "FoodData_Central_foundation_food_csv_2026-04-30", "FoodData_Central_foundation_food_csv_2026-04-30", "food_category.csv"),
}

NUTRIENT_COLUMNS = [
    "Calories (kcal)", "Protein (g)", "Carbohydrates (g)", "Fat (g)",
    "Fiber (g)", "Sugars (g)", "Sodium (mg)", "Cholesterol (mg)"
]

PATIENT_FEATURES = ["Age", "Gender", "BMI", "Blood_Pressure_Systolic",
                     "Blood_Pressure_Diastolic", "Blood_Glucose", "Cholesterol_Level"]

DISEASE_DIET_RULES = {
    "Diabetes": {"max_sugar": 25, "min_fiber": 30, "max_carbs_pct": 0.45, "avoid": ["Sugary drinks", "White bread"]},
    "Hypertension": {"max_sodium": 1500, "min_potassium": 3500, "max_fat_pct": 0.30, "avoid": ["Processed meats", "Pickles"]},
    "Obesity": {"calorie_deficit": 500, "min_protein_pct": 0.30, "max_fat_pct": 0.25, "avoid": ["Fried foods", "Sweets"]},
    "Heart Disease": {"max_saturated_fat": 16, "max_cholesterol": 200, "min_omega3": 1.0, "avoid": ["Trans fats", "Red meat"]},
    "Chronic Kidney Disease": {"max_protein": 0.8, "max_sodium": 2000, "max_potassium": 2000, "avoid": ["Bananas", "Oranges"]},
    "Celiac Disease": {"avoid": ["Wheat", "Barley", "Rye", "Bread", "Pasta"]},
    "General": {"avoid": []}
}

RANDOM_STATE = 42
TEST_SIZE = 0.2
