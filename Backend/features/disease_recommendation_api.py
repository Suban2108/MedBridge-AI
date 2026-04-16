import ast
import os
from flask import Blueprint, jsonify, request
import pandas as pd

from features.ml_models import predict_recommendation_disease_topk

disease_recommendation_bp = Blueprint("disease_recommendation_bp", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECO_DATA_DIR = os.path.join(BASE_DIR, "data", "recommendation")
MY_PART_DATA_DIR = os.path.join(
    BASE_DIR, "..", "Mypart", "Disease-Prediction-and-Medical-Recommendation-System", "dataset"
)


def _path_or_none(filename):
    a = os.path.normpath(os.path.join(RECO_DATA_DIR, filename))
    b = os.path.normpath(os.path.join(MY_PART_DATA_DIR, filename))
    if os.path.exists(a):
        return a
    if os.path.exists(b):
        return b
    return None


train_path = _path_or_none("Training.csv")
desc_path = _path_or_none("description.csv")
med_path = _path_or_none("medications.csv")
diet_path = _path_or_none("diets.csv")
workout_path = _path_or_none("workout_df.csv")
prec_path = _path_or_none("precautions_df.csv")

df_train = pd.read_csv(train_path) if train_path else pd.DataFrame()
df_desc = pd.read_csv(desc_path) if desc_path else pd.DataFrame()
df_med = pd.read_csv(med_path) if med_path else pd.DataFrame()
df_diet = pd.read_csv(diet_path) if diet_path else pd.DataFrame()
df_workout = pd.read_csv(workout_path) if workout_path else pd.DataFrame()
df_prec = pd.read_csv(prec_path) if prec_path else pd.DataFrame()

symptom_columns = [c for c in df_train.columns if c != "prognosis"]


def _normalize(s):
    return str(s).strip().lower().replace("_", " ")


def _confidence_from_scores(best_score, second_score, n_requested):
    """
    Heuristic confidence (not a clinical probability): combines how many of the
    user's symptoms match the best disease profile vs. how clearly it beats the
    next-best disease in the training data.
    """
    if n_requested <= 0 or best_score <= 0:
        return 0.0
    coverage = 100.0 * best_score / n_requested
    if second_score >= best_score:
        return round(min(70.0, coverage), 1)
    margin = (best_score - second_score) / best_score
    return round(min(98.0, coverage * (0.55 + 0.45 * margin)), 1)


def _predict_diseases_with_confidence(symptoms, top_k=3):
    """
    Returns a list of top candidate diseases with confidence data.
    """
    if df_train.empty or "prognosis" not in df_train.columns:
        return []

    requested = {_normalize(x) for x in symptoms if str(x).strip()}
    if not requested:
        return []

    return predict_recommendation_disease_topk(requested, top_k=top_k)


def _pluck_list(df, disease, key_col, value_col):
    if df.empty or key_col not in df.columns or value_col not in df.columns:
        return []
    vals = df[df[key_col] == disease][value_col].dropna().tolist()
    return [str(v).strip() for v in vals if str(v).strip()]


def _expand_python_list_cells(raw_values):
    """
    medications.csv / diets.csv store one cell per disease as a Python list literal
    e.g. "['A', 'B']". Expand to a flat list of display strings for JSON.
    """
    out = []
    for cell in raw_values:
        s = str(cell).strip()
        if not s:
            continue
        try:
            parsed = ast.literal_eval(s)
            if isinstance(parsed, (list, tuple)):
                out.extend(str(x).strip() for x in parsed if str(x).strip())
                continue
        except (ValueError, SyntaxError, TypeError):
            pass
        out.append(s)
    return out


@disease_recommendation_bp.route("/api/v1/disease-recommendation/predict", methods=["POST"])
def disease_recommendation_predict():
    body = request.get_json(silent=True) or {}
    symptoms = body.get("symptoms", [])
    if isinstance(symptoms, str):
        symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]
    if not symptoms:
        return jsonify({"error": "symptoms is required"}), 400

    candidates = _predict_diseases_with_confidence(symptoms, top_k=3)
    if not candidates:
        return jsonify({"error": "Unable to predict disease from available dataset"}), 500

    top_diseases = []
    for candidate in candidates:
        disease = candidate["disease"]
        description = ""
        if not df_desc.empty and "Disease" in df_desc.columns and "Description" in df_desc.columns:
            rows = df_desc[df_desc["Disease"] == disease]["Description"].dropna().tolist()
            description = rows[0] if rows else ""

        precautions = []
        if not df_prec.empty and "Disease" in df_prec.columns:
            rows = df_prec[df_prec["Disease"] == disease]
            if not rows.empty:
                r = rows.iloc[0]
                for c in ["Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"]:
                    if c in rows.columns and pd.notna(r[c]):
                        precautions.append(str(r[c]).strip())

        medications = _expand_python_list_cells(
            _pluck_list(df_med, disease, "Disease", "Medication")
        )
        diets = _expand_python_list_cells(
            _pluck_list(df_diet, disease, "Disease", "Diet")
        )
        workouts = _pluck_list(df_workout, disease, "disease", "workout")

        top_diseases.append({
            "disease": disease,
            "confidence_percent": candidate.get("confidence_percent", 0.0),
            "confidence_detail": {
                "symptoms_provided": len(symptoms),
                "symptoms_matched": candidate.get("matched_count", 0),
                "runner_up_score": candidate.get("runner_up_score", 0.0),
            },
            "description": description,
            "precautions": precautions,
            "medications": medications,
            "diets": diets,
            "workouts": workouts,
        })

    return jsonify({
        "predicted_disease": top_diseases[0]["disease"],
        "top_diseases": top_diseases,
    })
