## MedBridge AI (Frontend + Backend)

This project has a React frontend and a Flask backend (Python) that provides multiple medical/healthcare-related AI features.

## Prerequisites

- Windows with PowerShell
- Node.js (for the frontend)
- Python 3.10+ (for the backend)
- (Optional) GPU support is used automatically by PyTorch if available

## Folder Structure

### The Folders `(Models, data)` are not present in this github repo because of large size and it is important to have it in `Backend/` folder
#### Download those folder by clicking on this drive link : 
https://drive.google.com/drive/folders/1Wuc0zzi-vEChhskf1gA3xritz1UkRa5R?usp=sharing

```text
MedBridge_Ai_project/
  Backend/
    app.py
    try.py
    features/
      symptom_chatbot_api.py
      disease_recommendation_api.py
    data/
      dataset.csv
      symptom_Description.csv
      symptom_precaution.csv
      Symptom-severity.csv
      recommendation/
        Training.csv
        description.csv
        medications.csv
        diets.csv
        workout_df.csv
        precautions_df.csv
    models/
      class_labels.json
      (model weights loaded by app.py, see below)
    uploads/            (created automatically at runtime)
    requirements.txt

  medbridge-ai/
    src/
      components/      (UI + API calls)
      App.jsx
      main.jsx
      index.css
    package.json       (Vite + React dependencies)
    vite.config.js
```

## Start the Backend (Flask)

1. Open PowerShell in the `Backend/` folder:
   - `cd Backend`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Ensure the required model files exist in `Backend/models/` (see next section).
4. Run the server:
   - `python app.py`

The backend starts on: `http://localhost:8000`

Notes:
- `Backend/app.py` uses relative paths like `uploads/` and `data/`, so run it from inside the `Backend/` directory.

## Start the Frontend (React + Vite)

1. Open PowerShell in the `medbridge-ai/` folder:
   - `cd medbridge-ai`
2. Install dependencies:
   - `npm install`
3. Start the dev server:
   - `npm run dev`

The frontend calls the backend at `http://localhost:8000/api/v1/...` (hardcoded in components).

## Features, Models, and Tech Stack

### 1) Eye Disease Detection (Image Upload)
- Feature: Eye image classification (External vs Retinal mode)
- API: `POST /api/v1/eye-detection/predict`
- Input: `multipart/form-data`
  - `image` (required)
  - `mode` = `external` or `retinal` (required)
- Model files (expected in `Backend/models/`):
  - `eye_external_model.pth` (PyTorch + timm/efficientnet)
  - `eye_retinal_model.pth` (PyTorch + timm/efficientnet)
- Tech stack:
  - Flask + PyTorch + timm + torchvision (plus PIL for image handling)

### 2) Skin Disease Detection (Image Upload)
- Feature: Skin image classification
- API: `POST /api/v1/skin-detection/predict`
- Input: `multipart/form-data` with `image`
- Model files (expected in `Backend/models/`):
  - `skin_disease_model.keras` (TensorFlow/Keras)
  - `class_labels.json` (maps predicted index -> label)
- Tech stack:
  - Flask + TensorFlow/Keras (+ PIL)

### 3) Chest X-Ray Detection (Image Upload)
- Feature: Chest X-Ray classification (COVID-related classes)
- API: `POST /api/v1/xray-detection/predict`
- Input: `multipart/form-data` with `image`
- Model files (expected in `Backend/models/`):
  - `Best_COVID-19_Model.keras` (TensorFlow/Keras)
- Tech stack:
  - Flask + TensorFlow/Keras

### 4) Symptom Prediction Chatbot (Dataset-based)
- Feature: Predict likely disease based on user-provided symptoms (and a chat-like flow)
- APIs (dataset-based logic):
  - `POST /api/v1/symptom-chatbot/predict`
  - `POST /api/v1/symptom-chatbot/chat`
  - `POST /api/v1/symptom-chatbot/reset`
- Data used:
  - `Backend/data/dataset.csv`
  - `Backend/data/symptom_Description.csv`
  - `Backend/data/symptom_precaution.csv`
  - `Backend/data/Symptom-severity.csv`
- Tech stack:
  - Flask + pandas + Python heuristics (fuzzy matching utilities)

### 5) Disease Recommendation (Dataset-based)
- Feature: Recommends disease using symptoms (and returns extra fields like precautions/medications)
- API: `POST /api/v1/disease-recommendation/predict`
- Data used:
  - `Backend/data/recommendation/*.csv` (under `Backend/data/recommendation/`)
- Tech stack:
  - Flask + pandas + Python heuristics

### 6) Preventive Healthcare Advice (Search + Detail)
- Feature: Search diseases by name, then view symptoms/precautions/severity
- APIs:
  - `GET /api/v1/preventive-advice/search?query=...`
  - `GET /api/v1/preventive-advice/disease?name=...`
  - `GET /api/v1/preventive-advice/all`
- Data used:
  - Same symptom dataset group from `Backend/data/`:
    - `dataset.csv`, `symptom_Description.csv`, `symptom_precaution.csv`, `Symptom-severity.csv`
- Tech stack:
  - Flask + pandas + Python heuristics + difflib fuzzy matching

