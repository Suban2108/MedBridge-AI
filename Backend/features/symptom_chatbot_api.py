import os
import re
import uuid
from flask import Blueprint, jsonify, request
import pandas as pd

from features.ml_models import predict_chatbot_disease_from_symptoms

symptom_chatbot_bp = Blueprint("symptom_chatbot_bp", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

TRAINING_CANDIDATES = [
    os.path.join(DATA_DIR, "dataset.csv"),
    os.path.join(BASE_DIR, "..", "Mypart", "Disease-Symptom-Prediction-Chatbot", "Medical_dataset", "Training.csv"),
]
DESCRIPTION_CANDIDATES = [
    os.path.join(DATA_DIR, "symptom_Description.csv"),
    os.path.join(BASE_DIR, "..", "Mypart", "Disease-Symptom-Prediction-Chatbot", "Medical_dataset", "symptom_Description.csv"),
]
PRECAUTION_CANDIDATES = [
    os.path.join(DATA_DIR, "symptom_precaution.csv"),
    os.path.join(BASE_DIR, "..", "Mypart", "Disease-Symptom-Prediction-Chatbot", "Medical_dataset", "symptom_precaution.csv"),
]
SEVERITY_CANDIDATES = [
    os.path.join(DATA_DIR, "Symptom-severity.csv"),
    os.path.join(DATA_DIR, "symptom-severity.csv"),
    os.path.join(BASE_DIR, "..", "Mypart", "Disease-Symptom-Prediction-Chatbot", "Medical_dataset", "symptom_severity.csv"),
]


def _first_existing(paths):
    for p in paths:
        normalized = os.path.normpath(p)
        if os.path.exists(normalized):
            return normalized
    return None


def _normalize_symptom(value):
    return str(value).strip().lower().replace("_", " ")


training_path = _first_existing(TRAINING_CANDIDATES)
description_path = _first_existing(DESCRIPTION_CANDIDATES)
precaution_path = _first_existing(PRECAUTION_CANDIDATES)
severity_path = _first_existing(SEVERITY_CANDIDATES)

df_training = pd.read_csv(training_path) if training_path else pd.DataFrame()
df_description = pd.read_csv(description_path) if description_path else pd.DataFrame()
df_precaution = pd.read_csv(precaution_path) if precaution_path else pd.DataFrame()
df_severity = pd.read_csv(severity_path) if severity_path else pd.DataFrame()

symptom_cols = [c for c in df_training.columns if c.startswith("Symptom_")]

desc_map = {}
if not df_description.empty and "Disease" in df_description.columns:
    for _, row in df_description.iterrows():
        desc_map[str(row["Disease"]).strip()] = str(row.get("Description", "")).strip()

prec_map = {}
if not df_precaution.empty and "Disease" in df_precaution.columns:
    for _, row in df_precaution.iterrows():
        disease = str(row["Disease"]).strip()
        vals = []
        for col in ["Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"]:
            if col in row and pd.notna(row[col]):
                item = str(row[col]).strip()
                if item and item.lower() != "nan":
                    vals.append(item)
        prec_map[disease] = vals

severity_map = {}
if not df_severity.empty:
    symptom_col = "Symptom" if "Symptom" in df_severity.columns else df_severity.columns[0]
    weight_col = "weight" if "weight" in df_severity.columns else df_severity.columns[1]
    for _, row in df_severity.iterrows():
        severity_map[_normalize_symptom(row[symptom_col])] = int(row[weight_col])

known_symptoms = set()
for _, row in df_training.iterrows():
    for c in symptom_cols:
        val = row.get(c)
        if pd.notna(val):
            item = _normalize_symptom(val)
            if item and item != "nan":
                known_symptoms.add(item)

chat_sessions = {}


def _confidence_from_scores(best_score, second_score, n_requested):
    if n_requested <= 0 or best_score <= 0:
        return 0.0
    coverage = 100.0 * best_score / n_requested
    if second_score >= best_score:
        return round(min(70.0, coverage), 1)
    margin = (best_score - second_score) / best_score
    return round(min(98.0, coverage * (0.55 + 0.45 * margin)), 1)


def _predict_by_overlap_with_confidence(input_symptoms):
    """
    Returns (disease, confidence_percent, detail_dict) or (None, 0.0, {}).
    Uses Naive Bayes for disease prediction and original symptom overlap heuristic
    for confidence calibration.
    """
    if df_training.empty or not symptom_cols or "Disease" not in df_training.columns:
        return None, 0.0, {}

    requested = {_normalize_symptom(s) for s in input_symptoms if str(s).strip()}
    if not requested:
        return None, 0.0, {}

    disease, _ = predict_chatbot_disease_from_symptoms(requested)
    if not disease:
        return None, 0.0, {}

    disease_scores = {}
    for _, row in df_training.iterrows():
        dis = str(row["Disease"]).strip()
        row_symptoms = set()
        for c in symptom_cols:
            val = row.get(c)
            if pd.notna(val):
                item = _normalize_symptom(val)
                if item and item != "nan":
                    row_symptoms.add(item)
        overlap = len(requested.intersection(row_symptoms))
        disease_scores[dis] = max(disease_scores.get(dis, 0), overlap)

    ranked = sorted(disease_scores.items(), key=lambda x: -x[1])
    if not ranked or ranked[0][1] <= 0:
        return None, 0.0, {}

    best_score = ranked[0][1]
    second_score = ranked[1][1] if len(ranked) > 1 else 0
    confidence = _confidence_from_scores(best_score, second_score, len(requested))

    detail = {
        "symptoms_provided": len(requested),
        "symptoms_matched": best_score,
        "runner_up_score": second_score,
    }
    return disease, confidence, detail


def _severity_label(input_symptoms):
    if not input_symptoms:
        return "moderate"
    weights = [severity_map.get(_normalize_symptom(s), 3) for s in input_symptoms]
    avg = sum(weights) / len(weights)
    if avg <= 2:
        return "mild"
    if avg <= 4:
        return "moderate"
    if avg <= 6:
        return "high"
    return "critical"


def _extract_days(text):
    match = re.search(r"(\d+)\s*(day|days|d)", text.lower())
    return int(match.group(1)) if match else None


def _extract_symptoms(text):
    normalized_text = _normalize_symptom(text)
    found = set()
    for symptom in known_symptoms:
        if symptom in normalized_text:
            found.add(symptom)
    return sorted(found)


def _build_result(symptoms, days):
    disease, confidence_percent, conf_detail = _predict_by_overlap_with_confidence(symptoms)
    if not disease:
        return None
    return {
        "predicted_disease": disease,
        "confidence_percent": confidence_percent,
        "confidence_detail": conf_detail,
        "description": desc_map.get(disease, "No description available."),
        "precautions": prec_map.get(disease, []),
        "severity": _severity_label(symptoms),
        "days_reported": days,
        "symptoms_used": symptoms,
    }


@symptom_chatbot_bp.route("/api/v1/symptom-chatbot/predict", methods=["POST"])
def symptom_chatbot_predict():
    body = request.get_json(silent=True) or {}
    symptoms = body.get("symptoms", [])
    days = int(body.get("days", 1))

    if isinstance(symptoms, str):
        symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]

    if not symptoms:
        return jsonify({"error": "symptoms is required"}), 400

    result = _build_result(symptoms, days)
    if not result:
        return jsonify({"error": "Could not predict disease from available data"}), 500

    return jsonify(result)


@symptom_chatbot_bp.route("/api/v1/symptom-chatbot/chat", methods=["POST"])
def symptom_chatbot_chat():
    body = request.get_json(silent=True) or {}
    message = str(body.get("message", "")).strip()
    session_id = body.get("session_id") or str(uuid.uuid4())

    if not message:
        return jsonify({"error": "message is required"}), 400

    state = chat_sessions.get(session_id, {"symptoms": [], "days": None, "done": False})
    newly_found = _extract_symptoms(message)
    merged = sorted(set(state["symptoms"]).union(newly_found))
    state["symptoms"] = merged

    parsed_days = _extract_days(message)
    if parsed_days:
        state["days"] = parsed_days

    lower_msg = message.lower()
    wants_prediction = any(x in lower_msg for x in ["done", "predict", "diagnose", "result", "that's all", "thats all"])
    enough_data = len(state["symptoms"]) >= 2

    if wants_prediction and enough_data:
        result = _build_result(state["symptoms"], state["days"] or 1)
        if result:
            state["done"] = True
            chat_sessions[session_id] = state
            return jsonify({
                "session_id": session_id,
                "reply": (
                    f"Based on your symptoms, the likely condition is {result['predicted_disease']} "
                    f"(model confidence ~{result.get('confidence_percent', 0)}%). "
                    "This is not a medical diagnosis. Please consult a doctor."
                ),
                "result": result,
                "collected_symptoms": state["symptoms"],
                "awaiting_more_info": False,
            })

    if len(state["symptoms"]) == 0:
        reply = (
            "Please tell me your main symptoms in plain text. "
            "For example: fever, cough, headache."
        )
    elif len(state["symptoms"]) < 2:
        reply = (
            f"I captured: {', '.join(state['symptoms'])}. "
            "Please share at least one more symptom."
        )
    elif state["days"] is None:
        reply = (
            f"I captured symptoms: {', '.join(state['symptoms'])}. "
            "How many days have you had these symptoms? "
            "Then type 'predict' when ready."
        )
    else:
        reply = (
            f"I captured symptoms: {', '.join(state['symptoms'])} for {state['days']} day(s). "
            "Type 'predict' to get my best guess."
        )

    chat_sessions[session_id] = state
    return jsonify({
        "session_id": session_id,
        "reply": reply,
        "collected_symptoms": state["symptoms"],
        "awaiting_more_info": True,
    })


@symptom_chatbot_bp.route("/api/v1/symptom-chatbot/reset", methods=["POST"])
def symptom_chatbot_reset():
    body = request.get_json(silent=True) or {}
    session_id = body.get("session_id")
    if session_id and session_id in chat_sessions:
        del chat_sessions[session_id]
    return jsonify({"ok": True})
