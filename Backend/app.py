import os
import json
import re
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
import pytesseract
from werkzeug.utils import secure_filename
from tensorflow.keras.applications.efficientnet import preprocess_input as skin_preprocess
from difflib import get_close_matches
import urllib.request
import urllib.parse
import certifi
import requests
import time
import whisper
import scipy.io.wavfile as wav
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv
from features.symptom_chatbot_api import symptom_chatbot_bp
from features.disease_recommendation_api import disease_recommendation_bp

# Load environment variables from .env file
load_dotenv()

# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"


# ==============================
# FLASK SETUP
# ==============================

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)
app.register_blueprint(symptom_chatbot_bp)
app.register_blueprint(disease_recommendation_bp)

UPLOAD_FOLDER    = "uploads"
MODEL_FOLDER     = "models"
DISEASE_DATA_DIR = "data"
ALLOWED_AUDIO_EXT = {'.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# LOAD WHISPER MODEL FOR VOICE
# ==============================
WHISPER_MODEL = whisper.load_model("medium")
print("Whisper model loaded successfully")

# ==============================
# AMAZON POLLY TTS CLIENT
# ==============================
try:
    POLLY_CLIENT = boto3.client(
        'polly',
        region_name='us-east-1',  # Default region, can be changed
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    print("Amazon Polly client initialized successfully")
except Exception as e:
    print(f"Warning: Amazon Polly client failed to initialize: {e}")
    POLLY_CLIENT = None

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# GROQ API Configuration (replacing OpenAI)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
openai_enabled = bool(GROQ_API_KEY)
if(openai_enabled):
    print("GROQ API key found. LLM features enabled.")

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
# OCR POST PROCESSING HELPERS
# ==============================

OCR_COMMON_REPLACEMENTS = {
    "rn": "m",
    "|": "I",
}

SECTION_KEYWORDS = {
    "patient_information": ["patient", "name", "age", "gender", "dob", "date of birth", "id"],
    "clinical_history": ["history", "complaint", "symptoms", "clinical history", "reason"],
    "findings": ["finding", "observation", "exam", "result"],
    "impression": ["impression", "assessment", "diagnosis", "conclusion"],
    "prescription": ["prescription", "medication", "dose", "dosage", "tablet", "capsule", "syrup"],
    "advice": ["advice", "recommend", "follow up", "precaution", "instruction"],
}


def clean_ocr_text(raw_text):
    if not raw_text:
        return ""

    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    for wrong, right in OCR_COMMON_REPLACEMENTS.items():
        text = text.replace(wrong, right)

    cleaned_lines = []
    for line in text.split("\n"):
        normalized = line.strip()
        if not normalized:
            cleaned_lines.append("")
            continue
        normalized = re.sub(r"[^A-Za-z0-9.,:%()/+\- ]", "", normalized)
        normalized = re.sub(r"\s{2,}", " ", normalized).strip()
        cleaned_lines.append(normalized)

    text = "\n".join(cleaned_lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def split_sections(cleaned_text):
    sections = {k: [] for k in SECTION_KEYWORDS}
    sections["other"] = []

    for line in cleaned_text.split("\n"):
        if not line.strip():
            continue

        lowered = line.lower()
        best_section = "other"
        best_score = 0

        for section_name, keywords in SECTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in lowered)
            if score > best_score:
                best_score = score
                best_section = section_name

        sections[best_section].append(line)

    # Convert lists into readable paragraphs and only keep non-empty sections.
    return {k: " ".join(v) for k, v in sections.items() if v}


def extract_abnormal_markers(cleaned_text):
    markers = []
    lines = cleaned_text.split("\n")
    for line in lines:
        lower = line.lower()
        if any(flag in lower for flag in ["high", "low", "abnormal", "critical", "positive"]):
            markers.append(line)
    return markers[:8]


def build_ocr_metrics(cleaned_text):
    """
    Lightweight, processing-based quality metrics for OCR result cards.
    These are heuristic confidence scores, not model probabilities.
    """
    if not cleaned_text.strip():
        return {
            "drug_name_accuracy": 0.0,
            "dosage_accuracy": 0.0,
            "date_accuracy": 0.0,
        }

    # Drug cues: medicine words, brands, Rx-like lines.
    drug_keywords = ["tablet", "tab", "capsule", "cap", "syrup", "injection", "mg", "ml"]
    drug_hits = sum(1 for kw in drug_keywords if re.search(rf"\b{re.escape(kw)}\b", cleaned_text, re.I))
    drug_score = min(97.0, 55.0 + (drug_hits * 7.5))

    # Dosage cues: number+unit and frequency patterns.
    dosage_patterns = [
        r"\b\d+(\.\d+)?\s?(mg|ml|g|mcg)\b",
        r"\b(once|twice|thrice)\s+(daily|a day)\b",
        r"\b\d+\s?(x|times)\s?(daily|day)\b",
        r"\b(before|after)\s+(food|meal)\b",
    ]
    dosage_hits = sum(1 for pat in dosage_patterns if re.search(pat, cleaned_text, re.I))
    dosage_score = min(98.0, 50.0 + (dosage_hits * 12.0))

    # Date cues: common date formats.
    date_patterns = [
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
        r"\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\b",
        r"\b[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}\b",
    ]
    date_hits = sum(1 for pat in date_patterns if re.search(pat, cleaned_text))
    date_score = min(99.0, 45.0 + (date_hits * 22.0))

    return {
        "drug_name_accuracy": round(drug_score, 1),
        "dosage_accuracy": round(dosage_score, 1),
        "date_accuracy": round(date_score, 1),
    }


def openai_generate_text(prompt, temperature=0.2, max_output_tokens=1200):
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "max_tokens": max_output_tokens,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            verify=certifi.where(),
            timeout=60
        )

        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            wait_time = int(retry_after) if retry_after and retry_after.isdigit() else min(5 * attempt, 20)
            print(f"GROQ rate limit hit (429). Retrying in {wait_time}s... [attempt {attempt}/{max_retries}]")
            if attempt == max_retries:
                break
            time.sleep(wait_time)
            continue

        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as http_err:
            print(f"GROQ API HTTP error: {http_err} - {response.text}")
            raise RuntimeError(f"GROQ API error: {str(http_err)}")

        result = response.json()

        # Parse GROQ response format
        if isinstance(result, dict):
            if "choices" in result and result["choices"]:
                choice = result["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    return choice["message"]["content"]

            # Log unexpected response format
            print(f"Unexpected GROQ API response format: {result}")
            return json.dumps(result)

        return ""

    raise RuntimeError(f"GROQ API rate limit exceeded after {max_retries} attempts.")


def llm_descriptive_summary(cleaned_text, sections, abnormal_markers):
    if not cleaned_text:
        return {
            "clinical_summary": "No OCR text available for summarization.",
            "patient_summary": "No readable text was extracted from the document.",
            "recommended_next_steps": ["Retake a clearer image and try again."],
            "structured_sections": {},
            "safety_note": "This is AI-generated information and not a medical diagnosis.",
        }

    if not openai_enabled:
        return {
            "clinical_summary": "LLM summary disabled because GROQ_API_KEY is not configured.",
            "patient_summary": (
                "Text has been cleaned and structured, but descriptive summary is unavailable "
                "until a GROQ API key is configured."
            ),
            "recommended_next_steps": [
                "Set GROQ_API_KEY in Backend environment variables.",
                "Re-run OCR to generate a descriptive summary.",
            ],
            "structured_sections": sections,
            "safety_note": "This is AI-generated information and not a medical diagnosis.",
        }

    prompt = f"""
You are an OCR assistant. Extract ONLY patient demographic information from the OCR text.

Task: Find and extract the following patient information:
- Name
- Age or Date of Birth
- Gender
- Contact Number (if present)
- Address (if present)
- Patient ID / Medical Record Number (if present)

Output Format (STRICT JSON):
{{
  "patient_name": "extracted name or 'Not found'",
  "age": "extracted age or 'Not found'",
  "date_of_birth": "extracted DOB or 'Not found'",
  "gender": "extracted gender or 'Not found'",
  "contact_number": "extracted phone or 'Not found'",
  "address": "extracted address or 'Not found'",
  "patient_id": "extracted ID or 'Not found'"
}}

Rules:
- Only extract information that is explicitly present in the text.
- Do NOT invent or assume any patient information.
- If a field is not found, set it to 'Not found'.
- Return ONLY valid JSON, no additional text.

Source OCR text:
{cleaned_text}
"""

    try:
        output_text = openai_generate_text(prompt, temperature=0.1, max_output_tokens=500)
        
        # Extract JSON from response
        if not output_text.strip():
            output_text = "{}"
        
        # Try to parse JSON directly
        try:
            parsed = json.loads(output_text.strip())
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if "```json" in output_text:
                json_text = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                json_text = output_text.split("```")[1].split("```")[0].strip()
            else:
                json_text = output_text.strip()
            parsed = json.loads(json_text)

        return {
            "patient_demographics": parsed,
            "raw_text": cleaned_text,
        }
    except Exception as err:
        return {
            "patient_demographics": {
                "patient_name": "Not found",
                "age": "Not found",
                "date_of_birth": "Not found",
                "gender": "Not found",
                "contact_number": "Not found",
                "address": "Not found",
                "patient_id": "Not found",
                "error": str(err)
            },
            "raw_text": cleaned_text,
        }


def extract_structured_medical_data(cleaned_text, sections):
    """
    Extract basic patient information from OCR text.
    Simplified to focus only on demographics.
    """
    if not cleaned_text:
        return {
            "patient_demographics": {},
            "raw_text": "",
            "notes": "No OCR text available."
        }

    if not openai_enabled:
        return {
            "patient_demographics": {},
            "raw_text": cleaned_text,
            "notes": "GROQ_API_KEY not configured. Showing raw text only."
        }

    prompt = f"""
Extract ONLY patient demographic information from this OCR text.

Find:
- Name
- Age or Date of Birth
- Gender
- Contact Number (if present)
- Address (if present)
- Patient ID / Medical Record Number (if present)

Output JSON:
{{
  "patient_name": "name or 'Not found'",
  "age": "age or 'Not found'",
  "date_of_birth": "DOB or 'Not found'",
  "gender": "gender or 'Not found'",
  "contact_number": "phone or 'Not found'",
  "address": "address or 'Not found'",
  "patient_id": "ID or 'Not found'"
}}

Rules:
- Only extract what is in the text.
- Do NOT invent information.
- Return ONLY valid JSON.

Text:
{cleaned_text}
"""

    try:
        output_text = openai_generate_text(prompt, temperature=0.1, max_output_tokens=500)
        
        if not output_text or not output_text.strip():
            print("LLM returned empty response")
            return {
                "patient_demographics": {},
                "raw_text": cleaned_text,
                "notes": "LLM returned empty response."
            }
        
        response_text = output_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        parsed = json.loads(response_text)
        
        return {
            "patient_demographics": parsed,
            "raw_text": cleaned_text,
            "notes": "Patient demographics extracted successfully."
        }
    except json.JSONDecodeError as json_err:
        print(f"JSON parsing error: {json_err}")
        return {
            "patient_demographics": {},
            "raw_text": cleaned_text,
            "notes": f"Failed to parse LLM response: {str(json_err)}"
        }
    except Exception as err:
        print(f"Extraction error: {err}")
        return {
            "patient_demographics": {},
            "raw_text": cleaned_text,
            "notes": f"Error during extraction: {str(err)}"
        }


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
# OCR DOCUMENT EXTRACTION API
# ==============================

@app.route("/api/v1/ocr/extract", methods=["POST"])
def ocr_extract():
    try:
        if "document" not in request.files:
            return jsonify({"error": "No document uploaded"}), 400

        file = request.files["document"]
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        image = Image.open(file_path)
        raw_text = pytesseract.image_to_string(image)
        cleaned_text = clean_ocr_text(raw_text)
        ocr_metrics = build_ocr_metrics(cleaned_text)
        heuristic_sections = split_sections(cleaned_text)
        abnormal_markers = extract_abnormal_markers(cleaned_text)
        summary = llm_descriptive_summary(cleaned_text, heuristic_sections, abnormal_markers)
        llm_structured_sections = summary.get("structured_sections", heuristic_sections)
        
        # Extract structured medical data using LLM
        structured_data = extract_structured_medical_data(cleaned_text, llm_structured_sections)

        return jsonify({
            "type": "ocr",
            "text": raw_text,  # keep backward compatibility
            "raw_text": raw_text,
            "cleaned_text": cleaned_text,
            "sections": llm_structured_sections,
            "heuristic_sections": heuristic_sections,
            "abnormal_markers": abnormal_markers,
            "summary": summary,
            "metrics": ocr_metrics,
            "llm_enabled": openai_enabled,
            "structured_medical_data": structured_data.get("extracted_data", {}),
            "missing_data": structured_data.get("missing_data", []),
            "extraction_confidence": structured_data.get("confidence", 0.0),
            "extraction_notes": structured_data.get("notes", ""),
        })
    except Exception as e:
        print("OCR ERROR:", e)
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
# VOICE TRANSCRIPTION API
# POST /api/v1/voice-transcribe
# Accepts: audio file (wav/mp3), optional language code, optional task (transcribe/translate)
# ==============================

@app.route("/api/v1/voice-transcribe", methods=["POST"])
def voice_transcribe():
    """
    Transcribe audio file using Whisper.
    Request Data (form):
        - language: "auto" or language code (e.g., "en", "es", "fr", "hi") - optional, default: auto-detect
        - task: "transcribe" or "translate" - optional, default: "transcribe"
    Request Files:
        - audio: audio file (wav, mp3, m4a, ogg, flac)
    """
    try:
        # Get audio file
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided", "success": False}), 400
        
        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "No audio file selected", "success": False}), 400
        
        # Get language and task parameters
        language = request.form.get("language", "auto").strip().lower()
        task = request.form.get("task", "transcribe").strip().lower()
        
        # Validate task
        if task not in ["transcribe", "translate"]:
            task = "transcribe"
        
        # Save audio file temporarily
        filename = secure_filename(audio_file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Check file extension
        if file_ext not in ALLOWED_AUDIO_EXT:
            return jsonify({"error": f"Unsupported audio format. Supported: {', '.join(ALLOWED_AUDIO_EXT)}", "success": False}), 400
        
        # Save with unique name to prevent conflicts
        unique_filename = f"audio_{int(time.time())}_{os.urandom(4).hex()}{file_ext}"
        audio_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        audio_file.save(audio_path)
        
        try:
            # Load audio and process with Whisper
            audio = whisper.load_audio(audio_path)
            audio = whisper.pad_or_trim(audio)
            mel = whisper.log_mel_spectrogram(audio).to(WHISPER_MODEL.device)
            
            # Auto-detect language or use specified language
            detected_lang = None
            detected_lang_name = "Unknown"
            
            if language == "auto":
                # Auto-detect language
                _, probs = WHISPER_MODEL.detect_language(mel)
                detected_lang = max(probs, key=probs.get)
            else:
                # Use specified language code
                detected_lang = language
            
            # Get language name (for user display)
            lang_map = {
                "en": "English", "es": "Spanish", "fr": "French", "de": "German",
                "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
                "zh": "Chinese", "hi": "Hindi", "ar": "Arabic", "ko": "Korean",
                "th": "Thai", "pl": "Polish", "tr": "Turkish", "nl": "Dutch",
                "vi": "Vietnamese", "id": "Indonesian", "fil": "Filipino"
            }
            detected_lang_name = lang_map.get(detected_lang, detected_lang.upper())
            
            # Decode audio
            options = whisper.DecodingOptions(
                task=task,
                language=None if task == "translate" else detected_lang
            )
            result = whisper.decode(WHISPER_MODEL, mel, options)
            
            transcribed_text = result.text.strip()
            
            return jsonify({
                "success": True,
                "text": transcribed_text,
                "detected_language": detected_lang,
                "detected_language_name": detected_lang_name,
                "task": task,
                "confidence": "high" if len(transcribed_text) > 0 else "low"
            })
        
        finally:
            # Clean up temporary audio file
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception as cleanup_err:
                print(f"Warning: Could not delete temporary audio file: {cleanup_err}")
    
    except Exception as e:
        print(f"Voice transcription error: {e}")
        return jsonify({"error": str(e), "success": False}), 500


# ==============================
# AMAZON POLLY TTS API
# POST /api/v1/tts/generate
# Generates natural voice audio from text
# ==============================

@app.route("/api/v1/tts/generate", methods=["POST"])
def tts_generate():
    """
    Generate speech audio using Amazon Polly.
    Request JSON: {"text": "text to speak", "voice_id": "Joanna" (optional)}
    Returns: Audio file (MP3)
    """
    try:
        if not POLLY_CLIENT:
            return jsonify({"error": "Amazon Polly not configured", "success": False}), 500

        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Text is required", "success": False}), 400

        text = data["text"].strip()
        if not text:
            return jsonify({"error": "Text cannot be empty", "success": False}), 400

        # Default to calming female voice (Joanna is natural and pleasant)
        voice_id = data.get("voice_id", "Joanna")

        # Polly parameters for natural, calming voice
        response = POLLY_CLIENT.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine='neural',  # Neural engine for more natural speech
            TextType='text'
        )

        if "AudioStream" in response:
            audio_data = response["AudioStream"].read()
            return audio_data, 200, {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'inline; filename="speech.mp3"'
            }
        else:
            return jsonify({"error": "Failed to generate speech", "success": False}), 500

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ThrottlingException':
            return jsonify({"error": "TTS rate limit exceeded", "success": False}), 429
        elif error_code == 'InvalidParameterValueException':
            return jsonify({"error": "Invalid text or voice parameters", "success": False}), 400
        else:
            return jsonify({"error": f"Polly error: {str(e)}", "success": False}), 500
    except Exception as e:
        print(f"TTS generation error: {e}")
        return jsonify({"error": str(e), "success": False}), 500


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
    app.run(debug=True, host='0.0.0.0', port=8000)