import os
import re
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECO_DATA_DIR = os.path.join(BASE_DIR, "data", "recommendation")
SYMPTOM_DATA_DIR = os.path.join(BASE_DIR, "data")


def _normalize_token(value):
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"[\W_]+", " ", text)
    return text.strip()


def _load_csv(path):
    if path and os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()


def _load_recommendation_classifier():
    path = os.path.join(RECO_DATA_DIR, "Training.csv")
    df = _load_csv(path)
    if df.empty or "prognosis" not in df.columns:
        return None, [], []

    X = df.drop(columns=["prognosis"]).fillna(0).astype(int)
    y = df["prognosis"].astype(str).str.strip()

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=24,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)

    feature_names = list(X.columns)
    normalized_features = [_normalize_token(name) for name in feature_names]
    return model, feature_names, normalized_features


def _build_chatbot_training_data():
    path = os.path.join(SYMPTOM_DATA_DIR, "dataset.csv")
    df = _load_csv(path)
    if df.empty or "Disease" not in df.columns:
        return [], []

    symptom_cols = [c for c in df.columns if c.startswith("Symptom_")]
    texts = []
    labels = []

    for _, row in df.iterrows():
        symptoms = [
            _normalize_token(row[col])
            for col in symptom_cols
            if col in row and pd.notna(row[col]) and str(row[col]).strip().lower() != "nan"
        ]
        if symptoms:
            texts.append(" ".join(symptoms))
            labels.append(str(row["Disease"]).strip())

    return texts, labels


def _load_chatbot_classifier():
    texts, labels = _build_chatbot_training_data()
    if not texts:
        return None, None

    vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b\w+\b", ngram_range=(1, 2), lowercase=True)
    X = vectorizer.fit_transform(texts)
    model = MultinomialNB(alpha=0.8)
    model.fit(X, labels)

    return model, vectorizer


RECOMMENDATION_MODEL, RECOMMENDATION_FEATURES, RECOMMENDATION_FEATURES_NORM = _load_recommendation_classifier()
CHATBOT_MODEL, CHATBOT_VECTORIZER = _load_chatbot_classifier()


def _build_feature_vector(symptoms):
    if not RECOMMENDATION_FEATURES:
        return None
    request_norm = {_normalize_token(s) for s in symptoms if str(s).strip()}
    return [[1 if feature in request_norm else 0 for feature in RECOMMENDATION_FEATURES_NORM]]


def predict_recommendation_disease(symptoms):
    """
    Hybrid approach: Use Random Forest for disease classification,
    but calculate confidence using original overlap-based heuristic.
    """
    if RECOMMENDATION_MODEL is None:
        return None, 0.0, 0, 0.0

    feature_vector = _build_feature_vector(symptoms)
    if not feature_vector or sum(feature_vector[0]) == 0:
        return None, 0.0, 0, 0.0

    # Use RF to predict disease
    disease = RECOMMENDATION_MODEL.predict(feature_vector)[0]
    
    # Calculate confidence using original heuristic formula
    # Count matched symptoms
    matched_count = int(sum(feature_vector[0]))
    n_requested = len(symptoms)
    
    # Get all diseases and their prediction confidence from RF
    probabilities = RECOMMENDATION_MODEL.predict_proba(feature_vector)[0]
    best_prob = probabilities[RECOMMENDATION_MODEL.classes_.tolist().index(disease)]
    
    # Get second-best score
    sorted_probs = sorted(probabilities, reverse=True)
    second_best_score = sorted_probs[1] if len(sorted_probs) > 1 else 0.0
    
    # Apply original confidence formula
    coverage = 100.0 * matched_count / n_requested if n_requested > 0 else 0.0
    if second_best_score >= best_prob:
        confidence = round(min(70.0, coverage), 1)
    else:
        margin = (best_prob - second_best_score) / best_prob if best_prob > 0 else 0.0
        confidence = round(min(98.0, coverage * (0.55 + 0.45 * margin)), 1)
    
    return disease, confidence, matched_count, round(float(second_best_score) * 100.0, 1)


def predict_recommendation_disease_topk(symptoms, top_k=3):
    """
    Return the top-k candidate diseases sorted by model confidence.
    """
    if RECOMMENDATION_MODEL is None:
        return []

    feature_vector = _build_feature_vector(symptoms)
    if not feature_vector or sum(feature_vector[0]) == 0:
        return []

    probabilities = RECOMMENDATION_MODEL.predict_proba(feature_vector)[0]
    classes = list(RECOMMENDATION_MODEL.classes_)
    ranked = sorted(
        [
            {"disease": classes[i], "probability": float(prob)}
            for i, prob in enumerate(probabilities)
        ],
        key=lambda item: -item["probability"],
    )[:top_k]

    matched_count = int(sum(feature_vector[0]))
    n_requested = len(symptoms)
    coverage = 100.0 * matched_count / n_requested if n_requested > 0 else 0.0

    for idx, candidate in enumerate(ranked):
        prob = candidate["probability"]
        next_prob = ranked[idx + 1]["probability"] if idx + 1 < len(ranked) else 0.0
        if next_prob >= prob:
            confidence = round(min(70.0, coverage), 1)
        else:
            margin = (prob - next_prob) / prob if prob > 0 else 0.0
            confidence = round(min(98.0, coverage * (0.55 + 0.45 * margin)), 1)

        candidate["confidence_percent"] = confidence
        candidate["matched_count"] = matched_count
        candidate["runner_up_score"] = round(next_prob * 100.0, 1)

    return ranked


def predict_chatbot_disease_from_symptoms(symptoms):
    """
    Hybrid approach: Use Naive Bayes for disease classification,
    but calculate confidence using original overlap-based heuristic.
    """
    if CHATBOT_MODEL is None or CHATBOT_VECTORIZER is None:
        return None, 0.0

    text = " ".join(_normalize_token(s) for s in symptoms if str(s).strip())
    if not text:
        return None, 0.0

    # Use NB to predict disease
    X = CHATBOT_VECTORIZER.transform([text])
    probabilities = CHATBOT_MODEL.predict_proba(X)[0]
    best_idx = int(probabilities.argmax())
    disease = CHATBOT_MODEL.classes_[best_idx]
    best_prob = float(probabilities[best_idx])
    
    # Get second-best probability
    sorted_probs = sorted(probabilities, reverse=True)
    second_best_prob = float(sorted_probs[1]) if len(sorted_probs) > 1 else 0.0
    
    # Apply original confidence formula with symptom count as coverage proxy.
    n_requested = len(symptoms)
    coverage = 0.0
    if n_requested > 0:
        coverage = min(100.0, 100.0 * n_requested / 3.0)
    
    if second_best_prob >= best_prob:
        confidence = round(min(70.0, coverage), 1)
    else:
        margin = (best_prob - second_best_prob) / best_prob if best_prob > 0 else 0.0
        confidence = round(min(98.0, coverage * (0.55 + 0.45 * margin)), 1)
    
    return disease, confidence
