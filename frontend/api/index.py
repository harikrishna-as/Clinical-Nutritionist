"""
Lightweight Vercel serverless API for Clinical Nutrition DSS
Runs on Vercel Python runtime (Flask) — no heavy ML deps, returns mock data
so the frontend can verify backend is live at /api/health etc.
For full local ML features, run backend/app.py locally.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import os
import json
try:
    from supabase import create_client
    SUPA_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or ""
    SUPA_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""
    supa = create_client(SUPA_URL, SUPA_KEY) if SUPA_URL and SUPA_KEY and SUPA_URL.startswith("http") and len(SUPA_KEY) > 20 else None
except Exception as e:
    supa = None
    print("[supabase] not configured:", e)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- mock data helpers ---
MOCK_AGENTS = [
    {"id": "assessment", "name": "Assessment Agent"},
    {"id": "planning", "name": "Planning Agent"},
    {"id": "monitoring", "name": "Monitoring Agent"},
    {"id": "drug", "name": "Drug-Nutrient Agent"},
    {"id": "imaging", "name": "Imaging Agent"},
    {"id": "reporting", "name": "Reporting Agent"},
]

MOCK_OVERVIEW = {
    "total_models": 21,
    "agents": MOCK_AGENTS,
    "datasets": 12,
    "departments": 14,
    "message": "ML-verified backend live on Vercel (lightweight mock). For full ML inference, run backend/app.py locally."
}

# Load real report if available, otherwise use embedded mock
try:
    _report_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Explainable_Clinical_Nutrition_AI", "output", "reports", "clinical_nutrition_report.json")
    if os.path.exists(_report_path):
        with open(_report_path, "r") as f:
            MOCK_REPORT = json.load(f)
    else:
        raise FileNotFoundError
except:
    MOCK_REPORT = {
  "title": "Clinical Nutrition AI - Model Evaluation Report",
  "sections": {
    "Regression": {
      "description": "Unit 2: Calorie & Nutrient Requirement Prediction",
      "models": [
        {"model": "Linear Regression", "type": "regression", "R-Squared": -0.038, "MSE": 3008182, "RMSE": 1734.4, "MAE": 1314.6},
        {"model": "Multiple Linear Regression", "type": "regression", "R-Squared": 0.771, "MSE": 660349, "RMSE": 812.6, "MAE": 630.0},
        {"model": "Polynomial Regression (deg=2)", "type": "regression", "R-Squared": 0.732, "MSE": 773997, "RMSE": 879.7, "MAE": 575.8},
        {"model": "LASSO Regression", "type": "regression", "R-Squared": 0.771, "MSE": 660433, "RMSE": 812.6, "MAE": 630.0},
        {"model": "RIDGE Regression", "type": "regression", "R-Squared": 0.770, "MSE": 663854, "RMSE": 814.7, "MAE": 629.7},
        {"model": "Quantile Regression (approx)", "type": "regression", "R-Squared": 0.771, "MSE": 660349, "RMSE": 812.6, "MAE": 630.0}
      ]
    },
    "Classification": {
      "description": "Unit 3: Patient Risk & Disease Classification",
      "models": [
        {"model": "Logistic Regression", "type": "classification", "Precision": 1.0, "Recall": 1.0, "F1 Score": 1.0},
        {"model": "KNN (k=3)", "type": "classification", "Precision": 1.0, "Recall": 1.0, "F1 Score": 1.0},
        {"model": "Decision Tree", "type": "classification", "Precision": 0.977, "Recall": 0.975, "F1 Score": 0.975},
        {"model": "Naive Bayes", "type": "classification", "Precision": 1.0, "Recall": 1.0, "F1 Score": 1.0},
        {"model": "SVM (RBF)", "type": "classification", "Precision": 1.0, "Recall": 1.0, "F1 Score": 1.0}
      ]
    },
    "Clustering": {
      "description": "Unit 4: Patient Dietary Segmentation",
      "models": [
        {"model": "K-Means", "type": "clustering", "Silhouette": 0.46, "Davies-Bouldin": 0.79, "K": 2},
        {"model": "Hierarchical Agglomerative", "type": "clustering", "Silhouette": 0.45, "Davies-Bouldin": 0.78, "K": 2},
        {"model": "Gaussian Mixture", "type": "clustering", "Silhouette": 0.44, "Davies-Bouldin": 0.78, "K": 2},
        {"model": "Apriori", "type": "clustering", "Silhouette": 0.44, "Davies-Bouldin": 0.78, "K": 2}
      ]
    },
    "Ensemble": {
      "description": "Unit 5: Advanced Ensemble Learning",
      "models": [
        {"model": "Random Forest (Bagging)", "type": "ensemble", "Train Accuracy": 1.0, "Test Accuracy": 1.0, "F1 Score": 1.0},
        {"model": "AdaBoost (Boosting)", "type": "ensemble", "Train Accuracy": 1.0, "Test Accuracy": 0.975, "F1 Score": 0.974},
        {"model": "Gradient Boosting", "type": "ensemble", "Train Accuracy": 1.0, "Test Accuracy": 1.0, "F1 Score": 1.0},
        {"model": "XGBoost (approx)", "type": "ensemble", "Train Accuracy": 1.0, "Test Accuracy": 1.0, "F1 Score": 1.0}
      ]
    },
    "Dimensionality Reduction": {
      "description": "Unit 5: PCA & LDA Comparison",
      "models": [
        {"model": "PCA", "type": "dimensionality_reduction", "n_components": "4", "total_variance_explained": 0.967},
        {"model": "LDA", "type": "dimensionality_reduction", "n_components": 2, "total_variance_explained": 1.0}
      ]
    }
  },
  "summary": {"total_models_evaluated": 21, "regression_models": 6, "classification_models": 5, "clustering_models": 4, "ensemble_models": 4, "dimensionality_reduction_models": 2}
}

MOCK_DATASETS = [
    {"id": "eICU", "name": "eICU", "rows": 200000, "columns": 42, "type": "clinical", "description": "eICU Collaborative Research Database (200k ICU stays)"},
    {"id": "Synthea", "name": "Synthea", "rows": 50000, "columns": 28, "type": "synthetic", "description": "Synthetic patient data (50k patients)"},
    {"id": "USDA_FoodData", "name": "USDA FoodData", "rows": 8000, "columns": 18, "type": "nutrition", "description": "FoodData Central (8k foods, 477 nutrients)"},
    {"id": "CNF", "name": "CNF", "rows": 6000, "columns": 16, "type": "nutrition", "description": "Canadian Nutrient File (6k foods)"},
    {"id": "A_Z_medicines", "name": "A_Z_medicines", "rows": 253000, "columns": 12, "type": "pharma", "description": "A-Z Medicines of India (253k)"},
    {"id": "Vitamin_Images", "name": "Vitamin_Images", "rows": 21000, "columns": 3, "type": "image_collection", "file_count": 21000, "description": "Vitamin deficiency images (21k)"},
    {"id": "Skincare_Images", "name": "Skincare_Images", "rows": 18000, "columns": 3, "type": "image_collection", "file_count": 18000, "description": "Skincare images (18k)"},
    {"id": "BRFSS", "name": "BRFSS", "rows": 253000, "columns": 8, "type": "clinical", "description": "BRFSS Diabetes (253k, 8 feats)"},
]

MOCK_KG = {
    "nodes": [
        {"id": "d1", "label": "Diabetes", "type": "disease", "color": "#ef4444"},
        {"id": "d2", "label": "Anemia", "type": "disease", "color": "#ef4444"},
        {"id": "d3", "label": "Hypertension", "type": "disease", "color": "#ef4444"},
        {"id": "n1", "label": "Iron", "type": "nutrient", "color": "#22c55e"},
        {"id": "n2", "label": "Protein", "type": "nutrient", "color": "#22c55e"},
        {"id": "n3", "label": "Sodium", "type": "nutrient", "color": "#22c55e"},
        {"id": "f1", "label": "Spinach", "type": "food", "color": "#f5b041"},
        {"id": "f2", "label": "Chicken", "type": "food", "color": "#f5b041"},
        {"id": "f3", "label": "Banana", "type": "food", "color": "#f5b041"},
    ],
    "edges": [
        {"source": "f1", "target": "n1"},
        {"source": "n1", "target": "d2"},
        {"source": "f2", "target": "n2"},
        {"source": "f3", "target": "n2"},
        {"source": "n3", "target": "d3"},
    ],
    "stats": {"foods_count": 8000, "nutrients_count": 477, "disease_food_edges": 55376, "alternative_groups": 1914}
}

MOCK_TRAINED_MODELS = {
    "numerical": {"models": ["lightgbm", "catboost", "xgboost", "rf"], "best": "lightgbm"},
    "text": {"models": ["logreg", "nb", "bert", "roberta"], "best": "roberta"},
    "image": {"models": ["vit", "resnet", "convnext"], "best": "vit"}
}
MOCK_TRAINED_EVAL = {
    "numerical": {
        "models": [
            {"model": "RandomForest_Small", "Acc": 0.8492, "BAcc": 0.5701, "F1": 0.2537, "ROC_AUC": 0.8124, "PR_AUC": 0.4393},
            {"model": "LightGBM_Large", "Acc": 0.8498, "BAcc": 0.5745, "F1": 0.2725, "ROC_AUC": 0.8144, "PR_AUC": 0.4445},
            {"model": "CatBoost_Large", "Acc": 0.8498, "BAcc": 0.5764, "F1": 0.2709, "ROC_AUC": 0.8156, "PR_AUC": 0.4479},
        ]
    },
    "text": {"accuracy": 0.81, "f1": 0.81},
    "image": {"accuracy": 0.65}
}


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Clinical Nutrition DSS API", "env": "vercel", "time": datetime.now(timezone.utc).isoformat()})


@app.route("/api/overview")
def overview():
    return jsonify(MOCK_OVERVIEW)


@app.route("/api/datasets")
def datasets():
    return jsonify({"datasets": MOCK_DATASETS})


@app.route("/api/datasets/<name>")
def dataset_preview(name):
    # find dataset
    ds = next((d for d in MOCK_DATASETS if d["id"] == name or d["name"] == name), None)
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404
    if ds.get("type") == "image_collection":
        return jsonify({"type": "image_collection", "file_count": ds.get("file_count", 0), "sample_files": [f"img_{i}.jpg" for i in range(12)], "note": "Mock preview"})
    # tabular preview
    limit = request.args.get("limit", 10, type=int)
    cols = ["id", "name", "value", "category", "nutrient", "amount"][:ds.get("columns", 6)]
    data = [{c: f"{c}_{r}_{i}" for c in cols} for r in range(min(limit, 5)) for i in range(1)]
    # actually make 5 rows
    data = []
    for r in range(min(limit, 5)):
        row = {}
        for c in cols:
            row[c] = f"{c}_{r}"
        data.append(row)
    return jsonify({"type": "tabular", "column_names": cols, "data": data, "file_count": ds.get("rows", 0)})


@app.route("/api/report")
def report():
    return jsonify(MOCK_REPORT)


@app.route("/api/knowledge-graph")
def knowledge_graph():
    return jsonify(MOCK_KG)


@app.route("/api/knowledge-graph/search")
def kg_search():
    q = request.args.get("q", "").lower()
    if not q:
        return jsonify(MOCK_KG)
    nodes = [n for n in MOCK_KG["nodes"] if q in n["label"].lower()]
    return jsonify({"nodes": nodes, "edges": MOCK_KG["edges"], "query": q, "stats": MOCK_KG["stats"]})


@app.route("/api/recommendations", methods=["POST"])
def recommendations():
    data = request.get_json(force=True, silent=True) or {}
    return jsonify({
        "department": data.get("department", "ICU"),
        "calories_kcal": 1950,
        "protein_g": 95,
        "plan": ["High-protein soft diet", "Iron-rich foods", "Small frequent meals"],
        "reasoning": "Mock plan generated by lightweight Vercel API — full ML inference runs locally via backend/app.py",
        "targets": {"calories_kcal": 1950, "protein_g": 95},
    })


@app.route("/api/assessment", methods=["POST"])
def assessment():
    data = request.get_json(force=True, silent=True) or {}
    cond = data.get("condition", "weight_gain")
    name = data.get("Name", "Patient")
    return jsonify({
        "condition": cond,
        "condition_label": cond.replace("_", " ").title(),
        "risk_level": "Low",
        "risk_color": "#22c55e",
        "summary": f"Mock ML-verified assessment for {name} ({cond}) — backend is live on Vercel. Full ML model inference will run when backend/app.py is deployed locally or with full ML dependencies.",
        "likely_causes": ["Inadequate dietary intake", "Increased metabolic demand"],
        "plan": ["Balanced diet with +300 kcal/day", "Protein 1.2g/kg", "Follow-up in 2 weeks"],
        "recommended_foods": ["Eggs", "Lentils", "Milk"],
        "foods_to_avoid": ["Excess sugar", "Alcohol"],
        "labs": ["CBC", "Albumin", "Vitamin D"],
        "calories_target": 2000,
    })


@app.route("/api/department-plan", methods=["POST"])
def department_plan():
    data = request.get_json(force=True, silent=True) or {}
    dept = (data.get("dept_slug") or data.get("department") or "icu").lower()
    name = data.get("Name") or "Patient"
    # Build realistic mock that matches frontend/src/components/PatientIVPanel.jsx expectations
    patient = {
        "name": name,
        "age": data.get("Age") or 40,
        "gender": data.get("Gender") or "M",
        "weight_kg": data.get("Weight") or 65,
        "height_cm": data.get("Height") or 165,
        "diagnosis": data.get("Diagnosis") or "—",
        "severity": data.get("Severity") or "Medium",
        "allergies": data.get("Allergies") or "None",
        "medications": data.get("Medications") or "None",
    }
    # Targets per dept
    dept_profiles = {
        "icu": {"calories_kcal": 1850, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "Enteral preferred (early EN within 24-48h)", "note": "Resuscitation-grade monitoring"},
        "eicu": {"calories_kcal": 1850, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "Enteral preferred; tele-ICU protocol", "note": "Automated calorie tracking"},
        "sicu": {"calories_kcal": 1950, "protein": "1.5-2.0 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "Early oral/EN post-op; immunonutrition", "note": "Watch ileus, leak, fistulas"},
        "micu": {"calories_kcal": 1900, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "Organ-specific formulas", "note": "Adjust for DKA, hepatic, AKI"},
        "ticu": {"calories_kcal": 2100, "protein": "1.5-2.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "High-protein high-energy EN", "note": "Hypermetabolic; monitor hyperglycemia"},
        "cicu": {"calories_kcal": 1750, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "25 ml/kg (restricted)", "route": "Sodium/fluid restriction", "note": "Fluid overload risk; daily weights"},
        "ot": {"calories_kcal": 1850, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "ERAS: clear carbs 2h pre-op", "note": "Pre-op SGA screen"},
        "pediatric": {"calories_kcal": 1400, "protein": "1.0-1.5 g/kg", "fluid_ml_per_day": "Holliday-Segar", "route": "Breastfeeding/complementary feeding", "note": "Growth monitoring"},
        "pregnancy": {"calories_kcal": 2200, "protein": "+25 g/day", "fluid_ml_per_day": "2.5 L/day", "route": "GWG tracking; lactation +500 kcal", "note": "Lactation support"},
        "nicu": {"calories_kcal": 120, "protein": "2.5-3.5 g/kg", "fluid_ml_per_day": "Holliday-Segar", "route": "Human milk + fortifier", "note": "NEC risk"},
        "nephrology": {"calories_kcal": 1800, "protein": "1.2 g/kg (dialysis)", "fluid_ml_per_day": "500 ml + urine", "route": "Renal formulas", "note": "Restrict K/PO4"},
        "oncology": {"calories_kcal": 1900, "protein": "1.2-2.0 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "High-protein energy-dense", "note": "Mucositis diets"},
        "diabetes": {"calories_kcal": 1800, "protein": "1.0-1.5 g/kg", "fluid_ml_per_day": "30 ml/kg", "route": "Carb counting with insulin", "note": "Monitor glucose"},
        "geriatric": {"calories_kcal": 1700, "protein": "1.2-1.5 g/kg", "fluid_ml_per_day": "Holliday-Segar", "route": "IDDSI dysphagia diets", "note": "Hyponatremia risk"},
    }
    targets = dept_profiles.get(dept, dept_profiles["icu"])
    # Fluids
    fluids = [
        {"name": "0.9% Normal Saline (NS)", "role": "Primary", "rate": "25-30 ml/kg/day", "na": "154 mEq/L", "k": "0", "reason": f"Standard for {dept.upper()}", "cautions": "Hypernatremia, fluid overload"},
        {"name": "Ringer's Lactate (RL)", "role": "Rescue / bolus", "rate": "Bolus 10-20 ml/kg over 15-30 min", "na": "130 mEq/L", "k": "4 mEq/L", "reason": "Resuscitation fluid for hypovolemia", "cautions": "Lactate clearance in liver failure"},
    ]
    # Additives
    adds = []
    try:
        k = float(data.get("potassium")) if data.get("potassium") not in (None, "") else None
        if k is not None and k < 3.5:
            adds.append({"name": "Potassium Chloride (KCl) 20-40 mEq IV", "reason": f"Hypokalemia (K={k})", "combination": "Max 10-20 mEq/h peripheral", "caution": "Never IV push; monitor K"})
    except: pass
    try:
        mg = float(data.get("magnesium")) if data.get("magnesium") not in (None, "") else None
        if mg is not None and mg < 1.7:
            adds.append({"name": "Magnesium Sulfate 2-4g IV", "reason": f"Hypomagnesemia (Mg={mg})", "combination": "With NS/D5W over 2-4h", "caution": "Respiratory depression"})
    except: pass
    if not adds:
        adds.append({"name": "No IV additives indicated", "reason": "Electrolytes within target ranges", "combination": "—", "caution": "Recheck electrolytes daily"})
    return jsonify({
        "department": dept,
        "department_name": data.get("dept_name") or dept.upper(),
        "patient": patient,
        "targets": targets,
        "fluids": fluids,
        "additives": adds,
        "warnings": ["Refeeding syndrome risk — monitor K, Mg, PO4"] if dept in ("icu","sicu","ticu") else ["Monitor electrolytes"],
        "monitoring": ["Daily weight & fluid balance", "Urine output hourly", "Daily electrolytes", "Blood glucose 4-6 hourly"],
        "engine": "mock-vercel",
    })


@app.route("/api/medicines/search")
def medicines_search():
    q = request.args.get("q", "")
    limit = request.args.get("limit", 30, type=int)
    mock_results = [
        {"id": "1", "name": "Paracetamol", "short_composition1": "Paracetamol 500mg", "short_composition2": "", "manufacturer_name": "Mock Labs", "pack_size_label": "10 tablets", "price(₹)": "20", "Is_discontinued": "FALSE"},
        {"id": "2", "name": "Amoxycillin", "short_composition1": "Amoxycillin 500mg", "short_composition2": "", "manufacturer_name": "Mock Pharma", "pack_size_label": "10 capsules", "price(₹)": "35", "Is_discontinued": "FALSE"},
        {"id": "3", "name": "Metformin", "short_composition1": "Metformin 500mg", "short_composition2": "", "manufacturer_name": "Glaxo", "pack_size_label": "15 tablets", "price(₹)": "28", "Is_discontinued": "FALSE"},
        {"id": "4", "name": "Azithromycin", "short_composition1": "Azithromycin 250mg", "short_composition2": "", "manufacturer_name": "Cipla", "pack_size_label": "6 tablets", "price(₹)": "45", "Is_discontinued": "FALSE"},
        {"id": "5", "name": "Glaxo Pain Relief", "short_composition1": "Paracetamol 650mg", "short_composition2": "", "manufacturer_name": "Glaxo", "pack_size_label": "15 tablets", "price(₹)": "30", "Is_discontinued": "FALSE"},
        {"id": "6", "name": "Insulin Glargine", "short_composition1": "Insulin 100IU", "short_composition2": "", "manufacturer_name": "Biocon", "pack_size_label": "3ml pen", "price(₹)": "450", "Is_discontinued": "FALSE"},
    ]
    if q:
        ql = q.lower()
        filtered = [r for r in mock_results if ql in r["name"].lower() or ql in r["short_composition1"].lower() or ql in r["manufacturer_name"].lower()]
    else:
        filtered = []
    return jsonify({"query": q, "count": len(filtered), "results": filtered[:limit]})


@app.route("/api/medicines/stats")
def medicines_stats():
    return jsonify({"total": 253000, "active": 210000, "discontinued": 43000, "note": "Mock stats — full DB is Old datasets/archive/A_Z_medicines_dataset_of_India.csv locally"})


@app.route("/api/medicines/<med_id>")
def medicine_get(med_id):
    all_meds = [
        {"id": "1", "name": "Paracetamol", "short_composition1": "Paracetamol 500mg", "manufacturer_name": "Mock Labs"},
        {"id": "2", "name": "Amoxycillin", "short_composition1": "Amoxycillin 500mg", "manufacturer_name": "Mock Pharma"},
    ]
    found = next((r for r in all_meds if r["id"] == med_id), {"id": med_id, "name": "MockMed", "short_composition1": "Mock 500mg", "manufacturer_name": "Mock"})
    return jsonify(found)


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    return jsonify({"label": "Mock: No deficiency detected (lightweight Vercel mock)", "confidence": 0.92, "note": "Full image model runs locally via backend/models/deficiency_clf.joblib"})


@app.route("/api/classifier/status")
def classifier_status():
    return jsonify({"status": "mock", "model": "deficiency_clf.joblib", "env": "vercel", "message": "Lightweight mock — full model loads locally"})


@app.route("/api/skin-analyze", methods=["POST"])
def skin_analyze():
    return jsonify({"label": "Mock skin analysis", "confidence": 0.88})


@app.route("/api/skin-analyze/status")
def skin_status():
    return jsonify({"status": "mock"})


@app.route("/api/diabetes-risk", methods=["POST"])
def diabetes_risk():
    return jsonify({"risk": "Low", "score": 0.23, "note": "Mock — full model locally"})


@app.route("/api/diabetes-risk/status")
def diabetes_status():
    return jsonify({"status": "mock"})


@app.route("/api/trained/models")
def trained_models():
    return jsonify(MOCK_TRAINED_MODELS)


@app.route("/api/trained/evaluation")
def trained_eval():
    return jsonify(MOCK_TRAINED_EVAL)


@app.route("/api/trained/predict/numerical", methods=["POST"])
def trained_predict_numerical():
    data = request.get_json(force=True, silent=True) or {}
    feats = data.get("features") or data
    # simple mock logic: if bmi high or high_bp true, risk higher
    try:
        bmi = float(feats.get("bmi", 27))
        high_bp = int(feats.get("high_bp", 0))
        score = 0.2 + (bmi-25)*0.02 + high_bp*0.15
        prob = min(0.95, max(0.05, score))
        pred = 1 if prob > 0.5 else 0
        return jsonify({"model": data.get("model", "lightgbm"), "pred": pred, "prob": round(prob, 3), "risk_level": "High" if prob>0.6 else "Moderate" if prob>0.4 else "Low", "features": feats})
    except Exception as e:
        return jsonify({"model": data.get("model", "lightgbm"), "prediction": 42, "note": "Mock numerical prediction", "error": str(e)})


@app.route("/api/trained/predict/text", methods=["POST"])
def trained_predict_text():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text") or data.get("query") or ""
    # mock price tier based on keywords
    txt = text.lower()
    if "insulin" in txt or "injection" in txt:
        label = "High"
    elif "paracetamol" in txt or "dolo" in txt:
        label = "Low"
    else:
        label = "Medium"
    return jsonify({"model": data.get("model", "logreg"), "label": label, "proba": [0.7, 0.2, 0.1], "prediction": label, "text": text})


@app.route("/api/trained/predict/image", methods=["GET"])
def trained_predict_image():
    return jsonify({"prediction": "Mock image prediction", "top": []})


@app.route("/api/phone/qr")
def phone_qr():
    return jsonify({"url": "https://frontend-ten-omega-33.vercel.app/phone?room=demo", "note": "Mock — full phone pairing runs locally"})


@app.route("/api/phone/upload", methods=["POST"])
def phone_upload():
    return jsonify({"ok": True, "note": "Mock"})


@app.route("/api/phone/poll")
def phone_poll():
    return jsonify({"pending": 0, "image": None})


# --- User datas persisted to Vercel + Supabase 24/7 ---
USERS_STORE = []

@app.route("/api/users", methods=["GET", "POST"])
def users_api():
    global USERS_STORE
    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        if supa:
            try:
                if "users" in data and isinstance(data["users"], list):
                    for u in data["users"]:
                        supa.table("user_datas").upsert({"email": u.get("email"), "name": u.get("name"), "data": u}).execute()
                    USERS_STORE = data["users"]
                elif "email" in data:
                    supa.table("user_datas").upsert({"email": data.get("email"), "name": data.get("name"), "data": data}).execute()
                    USERS_STORE.append(data)
                res = supa.table("user_datas").select("*").execute()
                users = [r["data"] for r in res.data] if res.data else USERS_STORE
                return jsonify({"ok": True, "count": len(users), "users": users, "supabase": True})
            except Exception as e:
                print("supabase users error:", e)
        if "users" in data and isinstance(data["users"], list):
            USERS_STORE = data["users"]
        elif "email" in data:
            USERS_STORE.append(data)
        return jsonify({"ok": True, "count": len(USERS_STORE), "users": USERS_STORE, "supabase": False})
    if supa:
        try:
            res = supa.table("user_datas").select("*").execute()
            users = [r["data"] for r in res.data] if res.data else []
            return jsonify({"users": users, "count": len(users), "supabase": True})
        except Exception as e:
            print("supabase get users error:", e)
    return jsonify({"users": USERS_STORE, "count": len(USERS_STORE), "supabase": False})

@app.route("/api/auth", methods=["POST"])
def auth_api():
    data = request.get_json(force=True, silent=True) or {}
    if supa:
        try:
            user = data.get("user") or data
            if user and user.get("email"):
                supa.table("user_datas").upsert({"email": user.get("email"), "name": user.get("name"), "data": user}).execute()
        except Exception as e:
            print("supabase auth error:", e)
    return jsonify({"ok": True, "received": data, "time": datetime.now(timezone.utc).isoformat(), "note": "User data received on Vercel + Supabase 24/7" if supa else "User data received on Vercel (mock, set SUPABASE_URL/KEY for 24/7)"})

# Catch-all for /api and /api/ to show available endpoints
@app.route("/api/")
@app.route("/api")
def api_index():
    return jsonify({
        "message": "Clinical Nutrition DSS API is live on Vercel",
        "endpoints": [
            "/api/health", "/api/overview", "/api/datasets", "/api/knowledge-graph",
            "/api/assessment (POST)", "/api/recommendations (POST)", "/api/analyze-image (POST)",
            "/api/medicines/search?q=", "/api/trained/models",
            "/api/users (GET/POST)", "/api/auth (POST)"
        ],
        "frontend": "https://frontend-ten-omega-33.vercel.app",
        "note": "Lightweight mock — for full ML (21 models, 100MB+ datasets), run backend/app.py locally: python backend/app.py"
    })


# Vercel requires `app` to be exposed
# No if __name__ == "__main__" needed for serverless
