import os
import json
import torch
import torch.nn as nn
import timm
import tensorflow as tf
import numpy as np
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS
from torchvision import transforms
from PIL import Image
from werkzeug.utils import secure_filename
from tensorflow.keras.applications.efficientnet import preprocess_input as skin_preprocess
from difflib import get_close_matches
from features.symptom_chatbot_api import symptom_chatbot_bp
from features.disease_recommendation_api import disease_recommendation_bp


# ==============================
# FLASK SETUP
# ==============================

app = Flask(__name__)
CORS(app)
app.register_blueprint(symptom_chatbot_bp)
app.register_blueprint(disease_recommendation_bp)

UPLOAD_FOLDER    = "uploads"
MODEL_FOLDER     = "models"
DISEASE_DATA_DIR = "data"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ==============================
# LOAD DISEASE CSVs
# ==============================

df_dataset     = pd.read_csv(os.path.join(DISEASE_DATA_DIR, "dataset.csv"))
df_description = pd.read_csv(os.path.join(DISEASE_DATA_DIR, "symptom_Description.csv"))
df_precaution  = pd.read_csv(os.path.join(DISEASE_DATA_DIR, "symptom_precaution.csv"))
df_severity    = pd.read_csv(os.path.join(DISEASE_DATA_DIR, "symptom-severity.csv"))

# ── Symptom columns ──────────────────────────────────────────────────────────
SYMPTOM_COLS = [c for c in df_dataset.columns if c.startswith("Symptom_")]

# ── Build master disease lookup: disease_name → dict ─────────────────────────
#    Aggregates all unique symptoms across every row for that disease

def build_disease_db():
    db = {}

    # 1. Symptoms — collect unique non-null symptoms per disease
    for disease, group in df_dataset.groupby("Disease"):
        symptoms = set()
        for col in SYMPTOM_COLS:
            vals = group[col].dropna().str.strip().str.replace("_", " ")
            symptoms.update(v for v in vals if v)
        db[disease] = {"symptoms": sorted(symptoms)}

    # 2. Description
    for _, row in df_description.iterrows():
        name = row["Disease"]
        if name in db:
            db[name]["description"] = str(row["Description"]).strip()

    # 3. Precautions (treatments/prevention)
    prec_cols = ["Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"]
    for _, row in df_precaution.iterrows():
        name = row["Disease"]
        if name in db:
            precs = [str(row[c]).strip() for c in prec_cols
                     if pd.notna(row[c]) and str(row[c]).strip() not in ("", "nan")]
            db[name]["precautions"] = precs

    # 4. Severity score — average weight of the disease's symptoms
    sev_map = dict(zip(
        df_severity["Symptom"].str.strip().str.replace("_", " "),
        df_severity["weight"]
    ))
    for disease, info in db.items():
        weights = [sev_map.get(s, 3) for s in info["symptoms"]]
        avg = sum(weights) / len(weights) if weights else 3
        if avg <= 2:
            info["severity"] = "mild"
        elif avg <= 4:
            info["severity"] = "moderate"
        elif avg <= 6:
            info["severity"] = "high"
        else:
            info["severity"] = "critical"

    return db

DISEASE_DB = build_disease_db()
ALL_DISEASE_NAMES = sorted(DISEASE_DB.keys())

print(f"Disease DB loaded: {len(DISEASE_DB)} diseases")


# ── Helper: fuzzy search ──────────────────────────────────────────────────────

def search_diseases(query, n=8):
    """
    Returns list of disease names that match the query.
    Tries exact substring first, then fuzzy match.
    """
    q_lower = query.lower().strip()

    # 1. Exact substring match (case-insensitive)
    exact = [d for d in ALL_DISEASE_NAMES if q_lower in d.lower()]
    if exact:
        return exact[:n]

    # 2. Fuzzy match using difflib
    fuzzy = get_close_matches(query, ALL_DISEASE_NAMES, n=n, cutoff=0.4)
    return fuzzy


def get_disease_info(name):
    """Return full info dict for a disease name (exact match)."""
    # Try exact
    if name in DISEASE_DB:
        return name, DISEASE_DB[name]
    # Try case-insensitive
    for key in DISEASE_DB:
        if key.lower() == name.lower():
            return key, DISEASE_DB[key]
    return None, None


# ==============================
# PYTORCH IMAGE TRANSFORM (Eye)
# ==============================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

external_classes = ["Bulging_Eyes", "Cataracts", "Crossed_Eyes", "Uveitis"]
retinal_classes  = ["cataract", "diabetic_retinopathy", "glaucoma", "normal"]
xray_classes     = ["COVID", "Lung_Opacity", "Normal", "Viral Pneumonia"]


# ==============================
# LOAD EYE MODELS
# ==============================

def load_eye_model(model_path, num_classes):
    model = timm.create_model("efficientnet_b0", pretrained=False)
    model.classifier = nn.Linear(model.classifier.in_features, num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

eye_external_model = load_eye_model(os.path.join(MODEL_FOLDER, "eye_external_model.pth"), 4)
eye_retinal_model  = load_eye_model(os.path.join(MODEL_FOLDER, "eye_retinal_model.pth"),  4)


# ==============================
# LOAD SKIN MODEL
# ==============================

# Patch Dense.from_config to ignore quantization_config
from keras.layers import Dense
original_from_config = Dense.from_config
@classmethod
def patched_from_config(cls, config):
    config = config.copy()
    config.pop('quantization_config', None)
    return original_from_config(config)
Dense.from_config = patched_from_config

skin_model = tf.keras.models.load_model(os.path.join(MODEL_FOLDER, "skin_disease_model.keras"))

with open(os.path.join(MODEL_FOLDER, "class_labels.json"), "r") as f:
    skin_classes = json.load(f)
skin_classes = {v: k for k, v in skin_classes.items()}
print("Skin classes:", skin_classes)


# ==============================
# LOAD CHEST X-RAY MODEL
# ==============================

xray_model = tf.keras.models.load_model(os.path.join(MODEL_FOLDER, "Best_COVID-19_Model.keras"))
print("X-Ray input shape:", xray_model.input_shape)


# ==============================
# IMAGE PREDICTION HELPERS
# ==============================

def predict_eye(image_path, model, classes):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        probs      = torch.softmax(model(image), dim=1)
        conf, pred = torch.max(probs, 1)
    return classes[pred.item()], round(conf.item() * 100, 2)


SKIN_IMG_SIZE = 380

def predict_skin(image_path):
    raw  = tf.io.read_file(image_path)
    img  = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img  = tf.image.resize(img, [SKIN_IMG_SIZE, SKIN_IMG_SIZE], method="bilinear")
    img  = tf.cast(img, tf.float32)
    img  = tf.expand_dims(img, axis=0)
    img  = skin_preprocess(img)
    pred = skin_model.predict(img, verbose=0)
    idx  = int(np.argmax(pred))
    return skin_classes[idx], round(float(np.max(pred)) * 100, 2)


XRAY_IMG_SIZE = 224

def predict_xray(image_path):
    raw  = tf.io.read_file(image_path)
    img  = tf.image.decode_image(raw, channels=3, expand_animations=False)
    img  = tf.image.resize(img, [XRAY_IMG_SIZE, XRAY_IMG_SIZE], method="bilinear")
    img  = tf.cast(img, tf.float32)
    img  = tf.expand_dims(img, axis=0)
    pred = xray_model.predict(img, verbose=0)
    idx  = int(np.argmax(pred))
    return xray_classes[idx], round(float(np.max(pred)) * 100, 2)


# ==============================
# EYE DETECTION API
# ==============================

@app.route("/api/v1/eye-detection/predict", methods=["POST"])
def eye_detection():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        file = request.files["image"]
        mode = request.form.get("mode")
        if mode not in ["external", "retinal"]:
            return jsonify({"error": "Mode must be external or retinal"}), 400
        filename  = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        if mode == "external":
            prediction, confidence = predict_eye(file_path, eye_external_model, external_classes)
        else:
            prediction, confidence = predict_eye(file_path, eye_retinal_model, retinal_classes)
        return jsonify({"type": "eye", "mode": mode, "prediction": prediction, "confidence": f"{confidence}%"})
    except Exception as e:
        print("EYE ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ==============================
# SKIN DETECTION API
# ==============================

@app.route("/api/v1/skin-detection/predict", methods=["POST"])
def skin_detection():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        file      = request.files["image"]
        filename  = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        prediction, confidence = predict_skin(file_path)
        return jsonify({"type": "skin", "prediction": prediction, "confidence": f"{confidence}%"})
    except Exception as e:
        print("SKIN ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ==============================
# CHEST X-RAY DETECTION API
# ==============================

@app.route("/api/v1/xray-detection/predict", methods=["POST"])
def xray_detection():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        file      = request.files["image"]
        filename  = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        prediction, confidence = predict_xray(file_path)
        return jsonify({"type": "xray", "prediction": prediction, "confidence": f"{confidence}%"})
    except Exception as e:
        print("XRAY ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ==============================
# PREVENTIVE ADVICE — SEARCH
# GET /api/v1/preventive-advice/search?query=malaria
# Returns list of matching disease names (for autocomplete)
# ==============================

@app.route("/api/v1/preventive-advice/search", methods=["GET"])
def advice_search():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"results": []})
    matches = search_diseases(query, n=8)
    return jsonify({"results": matches})


# ==============================
# PREVENTIVE ADVICE — DETAIL
# GET /api/v1/preventive-advice/disease?name=Malaria
# Returns full info for one disease
# ==============================

@app.route("/api/v1/preventive-advice/disease", methods=["GET"])
def advice_disease():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    matched_name, info = get_disease_info(name)
    if not info:
        return jsonify({"error": f"Disease '{name}' not found"}), 404

    return jsonify({
        "name":        matched_name,
        "description": info.get("description", "No description available."),
        "symptoms":    info.get("symptoms", []),
        "precautions": info.get("precautions", []),
        "severity":    info.get("severity", "moderate"),
        # dataset doesn't have these fields — set sensible defaults
        "disease_code": "N/A",
        "contagious":   None,
        "chronic":      None,
    })


# ==============================
# PREVENTIVE ADVICE — ALL DISEASES
# GET /api/v1/preventive-advice/all
# ==============================

@app.route("/api/v1/preventive-advice/all", methods=["GET"])
def advice_all():
    return jsonify({"diseases": ALL_DISEASE_NAMES})


# ==============================
# DEBUG ENDPOINTS
# ==============================

@app.route("/api/v1/skin-detection/debug", methods=["GET"])
def skin_debug():
    return jsonify({
        "model_input_shape":  str(skin_model.input_shape),
        "model_output_shape": str(skin_model.output_shape),
        "class_map":          skin_classes,
        "img_size_used":      SKIN_IMG_SIZE
    })

@app.route("/api/v1/xray-detection/debug", methods=["GET"])
def xray_debug():
    return jsonify({
        "model_input_shape":  str(xray_model.input_shape),
        "model_output_shape": str(xray_model.output_shape),
        "class_map":          {str(i): c for i, c in enumerate(xray_classes)},
        "img_size_used":      XRAY_IMG_SIZE,
    })


# ==============================
# RUN SERVER
# ==============================

if __name__ == "__main__":
    app.run(debug=True, port=8000)