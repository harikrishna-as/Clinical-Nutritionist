"""
Explainable Multi-Agent AI Clinical Nutrition DSS - Web Backend
Flask API serving: dataset database, knowledge graph, model predictions,
vitamin deficiency image classifier, and patient recommendations.
"""
import os
import sys
import json
import io
import base64
import threading
import traceback
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE)
DATASETS_ROOT = os.environ.get("DATA_DIR") or os.path.dirname(PROJECT_ROOT)
# DATA_DIR may be relative to the repo root (Render startCommand runs from repo root)
if DATASETS_ROOT and not os.path.isabs(DATASETS_ROOT):
    DATASETS_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, DATASETS_ROOT))
# AI output may live inside the project (NutritionAI_Website/Explainable_...) or beside it
_candidates = [
    os.path.join(PROJECT_ROOT, "Explainable_Clinical_Nutrition_AI"),
    os.path.join(DATASETS_ROOT, "Explainable_Clinical_Nutrition_AI"),
]
AI_ROOT = next((c for c in _candidates if os.path.isdir(c)), _candidates[0])

if BASE not in sys.path:
    sys.path.insert(0, BASE)
sys.path.insert(0, AI_ROOT)
sys.path.insert(0, os.path.join(BASE, "services"))

app = Flask(__name__)
CORS(app)

# Lazy service imports to keep boot fast
db_service = None
kg_service = None
classifier = None
rec_service = None
assessment_service = None
dept_plan_service = None
medicine_search_service = None
skin_classifier = None
diabetes_service = None


def get_db():
    global db_service
    if db_service is None:
        from services.database_service import DatabaseService
        db_service = DatabaseService(os.path.join(AI_ROOT, "output"), data_dir=DATASETS_ROOT)
    return db_service


def get_kg():
    global kg_service
    if kg_service is None:
        from services.kg_service import KnowledgeGraphService
        kg_service = KnowledgeGraphService(os.path.join(AI_ROOT, "output"))
    return kg_service


def get_classifier():
    global classifier
    if classifier is None:
        from services.deficiency_classifier import DeficiencyClassifier
        model_path = os.path.join(BASE, "models", "deficiency_clf.joblib")
        classifier = DeficiencyClassifier(model_path)
    return classifier


def get_rec():
    global rec_service
    if rec_service is None:
        from services.recommendation_service import RecommendationService
        rec_service = RecommendationService(AI_ROOT)
    return rec_service


def get_assessment():
    global assessment_service
    if assessment_service is None:
        from services.assessment_service import AssessmentService
        assessment_service = AssessmentService()
    return assessment_service


def get_dept_plan():
    global dept_plan_service
    if dept_plan_service is None:
        from services.department_plan_service import DepartmentPlanService
        dept_plan_service = DepartmentPlanService()
    return dept_plan_service


def get_medicine_search():
    global medicine_search_service
    if medicine_search_service is None:
        from services.medicine_service import MedicineSearchService
        csv_path = os.path.join(DATASETS_ROOT, "Old datasets", "archive", "A_Z_medicines_dataset_of_India.csv")
        medicine_search_service = MedicineSearchService(csv_path)
    return medicine_search_service


def get_skin_classifier():
    global skin_classifier
    if skin_classifier is None:
        from services.skin_classifier import SkinClassifier
        model_path = os.path.join(BASE, "models", "skin_clf.joblib")
        skin_classifier = SkinClassifier(model_path)
    return skin_classifier


def get_diabetes_service():
    global diabetes_service
    if diabetes_service is None:
        from services.diabetes_service import DiabetesRiskService
        model_path = os.path.join(BASE, "models", "diabetes_clf.joblib")
        diabetes_service = DiabetesRiskService(model_path)
    return diabetes_service


trained_service = None

def get_trained():
    global trained_service
    if trained_service is None:
        from services.trained_model_service import list_models, predict_numerical, predict_text, predict_image_top, get_evaluation
        import services.trained_model_service as svc
        trained_service = svc
    return trained_service


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Clinical Nutrition DSS API"})


@app.route("/api/overview")
def overview():
    db = get_db()
    try:
        return jsonify(db.get_overview())
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/datasets")
def datasets():
    db = get_db()
    try:
        return jsonify({"datasets": db.list_datasets()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/datasets/<name>")
def dataset_preview(name):
    db = get_db()
    try:
        limit = request.args.get("limit", 20, type=int)
        return jsonify(db.preview_dataset(name, limit))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/report")
def report():
    db = get_db()
    try:
        return jsonify(db.get_report())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/knowledge-graph")
def knowledge_graph():
    kg = get_kg()
    try:
        return jsonify(kg.get_graph())
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/knowledge-graph/search")
def knowledge_graph_search():
    kg = get_kg()
    q = request.args.get("q", "")
    try:
        return jsonify(kg.search(q))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/recommendations", methods=["POST"])
def recommendations():
    rec = get_rec()
    data = request.get_json(force=True, silent=True) or {}
    try:
        return jsonify(rec.generate(data))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/assessment", methods=["POST"])
def assessment():
    svc = get_assessment()
    data = request.get_json(force=True, silent=True) or {}
    try:
        return jsonify(svc.generate(data))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/department-plan", methods=["POST"])
def department_plan():
    svc = get_dept_plan()
    data = request.get_json(force=True, silent=True) or {}
    try:
        return jsonify(svc.generate(data))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/medicines/search")
def medicines_search():
    svc = get_medicine_search()
    q = request.args.get("q", "")
    limit = request.args.get("limit", 30, type=int)
    limit = min(max(limit, 1), 100)
    try:
        results = svc.search(q, limit)
        return jsonify({"query": q, "count": len(results), "results": results})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/medicines/stats")
def medicines_stats():
    svc = get_medicine_search()
    try:
        return jsonify(svc.stats())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/medicines/<med_id>")
def medicine_get(med_id):
    svc = get_medicine_search()
    try:
        row = svc.get(med_id)
        if not row:
            return jsonify({"error": "Not found"}), 404
        return jsonify(row)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    data = request.get_json(force=True, silent=True) or {}
    image_b64 = data.get("image", "")
    if not image_b64:
        return jsonify({"error": "No image provided"}), 400
    clf = get_classifier()
    try:
        result = clf.analyze(image_b64)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/classifier/status")
def classifier_status():
    clf = get_classifier()
    return jsonify(clf.status())


@app.route("/api/skin-analyze", methods=["POST"])
def skin_analyze():
    data = request.get_json(force=True, silent=True) or {}
    image_b64 = data.get("image", "")
    if not image_b64:
        return jsonify({"error": "No image provided"}), 400
    skin = get_skin_classifier()
    try:
        return jsonify(skin.analyze(image_b64))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/skin-analyze/status")
def skin_status():
    skin = get_skin_classifier()
    return jsonify(skin.status())


@app.route("/api/diabetes-risk", methods=["POST"])
def diabetes_risk():
    svc = get_diabetes_service()
    data = request.get_json(force=True, silent=True) or {}
    try:
        return jsonify(svc.predict(data))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/diabetes-risk/status")
def diabetes_status():
    svc = get_diabetes_service()
    return jsonify(svc.status())


# --- Trained models from your table (Numerical/Text/Image) ---
@app.route("/api/trained/models")
def trained_models():
    svc = get_trained()
    try: return jsonify(svc.list_models())
    except Exception as e: traceback.print_exc(); return jsonify({"error": str(e)}), 500

@app.route("/api/trained/evaluation")
def trained_evaluation():
    svc = get_trained()
    try: return jsonify(svc.get_evaluation())
    except Exception as e: traceback.print_exc(); return jsonify({"error": str(e)}), 500

@app.route("/api/trained/predict/numerical", methods=["POST"])
def trained_predict_numerical():
    svc = get_trained()
    data = request.get_json(force=True, silent=True) or {}
    model = (data.get("model") or request.args.get("model") or "lightgbm")
    feats = data.get("features") or data
    # allow flat {age,bmi,...} or {features:{...}}
    if "features" in data and isinstance(data["features"], dict):
        feats = data["features"]
    try: return jsonify(svc.predict_numerical(feats, model))
    except Exception as e: traceback.print_exc(); return jsonify({"error": str(e)}), 500

@app.route("/api/trained/predict/text", methods=["POST"])
def trained_predict_text():
    svc = get_trained()
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text") or data.get("query") or ""
    model = data.get("model") or "logreg"
    try: return jsonify(svc.predict_text(text, model))
    except Exception as e: traceback.print_exc(); return jsonify({"error": str(e)}), 500

@app.route("/api/trained/predict/image", methods=["GET"])
def trained_predict_image():
    svc = get_trained()
    try: return jsonify(svc.predict_image_top())
    except Exception as e: return jsonify({"error": str(e)}), 500


# --- NVIDIA AI (https://integrate.api.nvidia.com/v1) for higher accuracy ---
# Set NVIDIA_API_KEY env var (local .env, Render dashboard, or Vercel env).
@app.route("/api/ai/status")
def ai_status():
    try:
        from services.nvidia_ai import is_configured, MODELS
        return jsonify({"configured": is_configured(), "models": MODELS})
    except Exception as e:
        return jsonify({"configured": False, "error": str(e)})


@app.route("/api/ai/vision", methods=["POST"])
def ai_vision():
    data = request.get_json(force=True, silent=True) or {}
    image_url = data.get("image_url") or data.get("image") or ""
    if not image_url:
        return jsonify({"error": "Provide image_url (http(s) or data:image/...;base64)"}), 400
    if image_url.startswith("data:") is False and not image_url.startswith("http"):
        # assume raw base64 jpeg
        image_url = f"data:image/jpeg;base64,{image_url}"
    try:
        from services.nvidia_ai import analyze_image
        return jsonify(analyze_image(image_url, data.get("question", "What is in this image?"), data.get("model")))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/reason", methods=["POST"])
def ai_reason():
    data = request.get_json(force=True, silent=True) or {}
    prompt = data.get("prompt") or data.get("text") or ""
    if not prompt:
        return jsonify({"error": "Provide prompt"}), 400
    try:
        from services.nvidia_ai import reason
        return jsonify(reason(prompt, data.get("model")))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/verify", methods=["POST"])
def ai_verify():
    data = request.get_json(force=True, silent=True) or {}
    try:
        from services.nvidia_ai import nutrition_verify
        return jsonify(nutrition_verify(
            data.get("patient_summary", ""),
            data.get("plan_text", ""),
            data.get("model"),
        ))
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Phone pairing: phone captures/selects a photo on its own browser (opened via
# QR code), uploads it over the LAN, and the desktop lab window polls it back.
# Works with any phone (Wi-Fi, USB tethering, adb reverse, Bluetooth PAN —
# any network path that reaches this PC) — no app installation needed.
# ---------------------------------------------------------------------------
PHONE_DROPS = {}
PHONE_DROPS_LOCK = threading.Lock()
_MAX_DROPS_PER_ROOM = 30


def _lan_ip():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


def _phone_url(room):
    host = _lan_ip() or (request.host.split(":")[0] if request else "localhost")
    port = int(os.environ.get("PORT", 5000))
    if ":" in host and not host.startswith("["):
        pass
    return f"http://{host}:{port}/phone?room={room}"


@app.route("/api/phone/upload", methods=["POST"])
def phone_upload():
    data = request.get_json(force=True, silent=True) or {}
    room = (data.get("room") or "").strip()
    image = data.get("image") or ""
    if not room or len(room) > 16:
        return jsonify({"error": "Missing pairing room"}), 400
    if not image or len(image) < 40:
        return jsonify({"error": "Missing image data"}), 400
    with PHONE_DROPS_LOCK:
        bucket = PHONE_DROPS.setdefault(room, [])
        if len(bucket) < _MAX_DROPS_PER_ROOM:
            bucket.append({"image": image, "ts": datetime.now(timezone.utc).isoformat()})
        else:
            bucket.pop(0)
            bucket.append({"image": image, "ts": datetime.now(timezone.utc).isoformat()})
    return jsonify({"ok": True, "room": room})


@app.route("/api/phone/poll")
def phone_poll():
    room = (request.args.get("room") or "").strip()
    if not room:
        return jsonify({"pending": 0, "image": None})
    with PHONE_DROPS_LOCK:
        bucket = PHONE_DROPS.get(room, [])
        if not bucket:
            return jsonify({"pending": 0, "image": None})
        item = bucket.pop(0)
    return jsonify({"pending": len(bucket), "image": item["image"], "ts": item["ts"]})


@app.route("/api/phone/qr")
def phone_qr():
    room = (request.args.get("room") or "").strip()
    if not room or len(room) > 16:
        return jsonify({"error": "Missing pairing room"}), 400
    url = _phone_url(room)
    try:
        import qrcode
        qr = qrcode.QRCode(version=None, box_size=8, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        buf = io.BytesIO()
        qr.make_image(fill_color="#0a101f", back_color="#ffffff").save(buf, format="PNG")
        return Response(buf.getvalue(), mimetype="image/png")
    except Exception:
        traceback.print_exc()
        return jsonify({"url": url}), 200


def _read_phone_page():
    path = os.path.join(BASE, "phone_capture.html")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return "<!DOCTYPE html><html><body><h3>phone_capture.html missing</h3></body></html>"


PHONE_PAGE = _read_phone_page()


@app.route("/phone")
@app.route("/phone/")
def phone_page():
    return Response(PHONE_PAGE, mimetype="text/html")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    dist = os.path.join(PROJECT_ROOT, "frontend", "dist")
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    index = os.path.join(dist, "index.html")
    if os.path.exists(index):
        resp = send_from_directory(dist, "index.html")
        resp.headers["Cache-Control"] = "no-store, must-revalidate"
        return resp
    return jsonify({"message": "Frontend not built. Run npm run build in frontend/."}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    def lan_ip():
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return None

    ip = lan_ip()
    print()
    print("=" * 62)
    print("  Clinical Nutrition DSS is running")
    print(f"  This PC      : http://localhost:{port}")
    if ip:
        print(f"  Phone (Wi-Fi): http://{ip}:{port}")
    print()
    print("  PHONE CAMERA (Camera Lab / Patient Scan):")
    print("  1. Open Camera Lab on this PC and click 'Connect Phone'.")
    print("  2. Scan the QR code with the phone camera. The phone opens a")
    print("     capture page (no app install). Photos you take are sent back")
    print("     to the PC lab instantly over the same network.")
    print("  3. Works over Wi-Fi, USB tethering, Bluetooth PAN, or adb reverse.")
    print("  USB wired camera: DroidCam / IP Webcam make the phone appear as a")
    print("     USB webcam in the camera picker (use 'Refresh camera list').")
    print("  Bluetooth: keep the phone nearby; pairing to it is not needed for")
    print("     photos to transfer (Wi-Fi is used), Bluetooth is a fallback link.")
    print("=" * 62)
    print()
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
