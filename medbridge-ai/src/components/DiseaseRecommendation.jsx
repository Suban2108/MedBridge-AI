import { useState } from "react";
import { cachedJsonPost } from "../utils/offlineCache";

const API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/disease-recommendation/predict`;

export default function DiseaseRecommendation() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await cachedJsonPost(API, { symptoms });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);
      setSelectedIndex(0);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sortedTopDiseases = result?.top_diseases?.slice().sort((b,a) => a.confidence_percent - b.confidence_percent) ?? [];
  const selectedDisease = sortedTopDiseases[selectedIndex] ?? null;

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
          .replace(/[\\[\]'"]/g, "") // remove brackets & quotes
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
    <div className="min-h-screen bg-gray-100 py-12 bg-cover bg-center relative" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
      <div className="absolute inset-0 bg-white/30"></div>
      <div className="max-w-5xl mx-auto px-4 relative z-10">

        {/* 🔵 Header */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
          <div className="bg-gradient-to-br from-[#0D7490] to-cyan-500 px-6 py-6">
            <h1 className="text-3xl font-bold text-white">
              Disease Prediction
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
            className="px-6 py-3 bg-gradient-to-br from-[#0D7490] to-cyan-400 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-semibold transition"
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
        {result && result.top_diseases?.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 space-y-6 border border-gray-100">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Top {result.top_diseases.length} disease candidates
                  </h3>
                  <div className="space-y-2">
                    {sortedTopDiseases.map((candidate, idx) => (
                      <button
                        key={candidate.disease}
                        type="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          idx === selectedIndex
                            ? "border-cyan-500 bg-cyan-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-gray-900">
                            {candidate.disease}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                            {candidate.confidence_percent}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Matched {candidate.confidence_detail?.symptoms_matched} of {candidate.confidence_detail?.symptoms_provided} symptom{candidate.confidence_detail?.symptoms_provided !== 1 ? "s" : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Selected disease details
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Click a disease above to view its description, precautions, medications, diets, and workouts.
                  </p>
                </div>
              </div>

              {selectedDisease && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedDisease.disease}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200">
                        Confidence: {selectedDisease.confidence_percent}%
                      </span>
                      {selectedDisease.confidence_detail && (
                        <span className="text-xs text-gray-500">
                          Matched {selectedDisease.confidence_detail.symptoms_matched} of {selectedDisease.confidence_detail.symptoms_provided} symptom{selectedDisease.confidence_detail.symptoms_provided !== 1 ? "s" : ""}
                          {typeof selectedDisease.confidence_detail.runner_up_score === "number"
                            ? ` · next-best overlap: ${selectedDisease.confidence_detail.runner_up_score}`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2">{selectedDisease.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {renderCard("Precautions", selectedDisease.precautions)}
                    {renderCard("Medications", selectedDisease.medications)}
                    {renderCard("Diets", selectedDisease.diets)}
                    {renderCard("Workouts", selectedDisease.workouts)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}