import { useState } from "react";

const API = "http://localhost:8000/api/v1/disease-recommendation/predict";

export default function DiseaseRecommendation() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (title, items) => {
    if (!items) return null;
  
    let listItems = [];
  
    if (Array.isArray(items)) {
      listItems = items;
  
    } else if (typeof items === "string") {
      try {
        // Try parsing JSON-like string
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          listItems = parsed;
        } else {
          throw new Error();
        }
      } catch {
        // Fallback: clean string and split
        listItems = items
          .replace(/[\[\]'"]/g, "") // remove brackets & quotes
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);
      }
    }
  
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
          {listItems.map((item, idx) => (
            <li key={`${title}-${idx}`}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4">

        {/* 🔵 Header */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-6">
            <h1 className="text-3xl font-bold text-white">
              Disease Prediction & Recommendations
            </h1>
            <p className="text-white/80 mt-1">
              Get predicted disease, medications, diet plans and precautions
            </p>
          </div>
        </div>

        {/* 🧾 Input Card */}
        <form
          onSubmit={onSubmit}
          className="bg-white p-6 rounded-2xl shadow-md space-y-4 border border-gray-100"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms (comma separated)
            </label>
            <input
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="fever, nausea, headache"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </form>

        {/* ❌ Error */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* 📊 Result */}
        {result && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 space-y-6 border border-gray-100">

            {/* Disease Title */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {result.predicted_disease}
              </h2>
              {typeof result.confidence_percent === "number" && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200">
                    Confidence: {result.confidence_percent}%
                  </span>
                  {result.confidence_detail && (
                    <span className="text-xs text-gray-500">
                      Matched {result.confidence_detail.symptoms_matched} of{" "}
                      {result.confidence_detail.symptoms_provided} symptom
                      {result.confidence_detail.symptoms_provided !== 1 ? "s" : ""} you entered
                      {typeof result.confidence_detail.runner_up_score === "number"
                        ? ` · next-best overlap: ${result.confidence_detail.runner_up_score}`
                        : ""}
                    </span>
                  )}
                </div>
              )}
    {/*          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                Confidence is a heuristic from symptom overlap in the dataset, not a clinical
                probability. Always see a qualified professional for diagnosis.
              </p>
              */}
              <p className="text-gray-600 mt-2">{result.description}</p>
            </div>

            {/* Grid Sections */}
            <div className="grid md:grid-cols-2 gap-4">
              {renderCard("Precautions", result.precautions)}
              {renderCard("Medications", result.medications)}
              {renderCard("Diets", result.diets)}
              {renderCard("Workouts", result.workouts)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}