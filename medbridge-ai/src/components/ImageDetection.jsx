import React, { useState } from "react";
import axios from "axios";
import { Camera } from "lucide-react";
import { cachedFormPost } from "../utils/offlineCache";

const ImageDetection = () => {
  const [selectedType, setSelectedType] = useState("Eye Diseases");
  const [eyeMode, setEyeMode] = useState("external");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setAiResponse("");
  };

  const generateAIExplanation = async (predictionData) => {
    try {
      const prompt = `
You are a medical assistant.

Based on the following detection result:
Condition: ${predictionData.prediction}
Confidence: ${predictionData.confidence}

Generate a structured response:
1. Condition Explanation (simple)
2. Remedies / Precautions

Keep it patient-friendly and concise.
and keep it short and simple. use bold for condition name and confidence. use bullet points for causes and remedies.
`;

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
        },
      );

      const text = response.data.choices?.[0]?.message?.content || "";

      setAiResponse(text);
    } catch (err) {
      console.error(err);
      setAiResponse("Failed to generate AI explanation.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    let apiURL = "";

    if (selectedType === "Eye Diseases") {
      apiURL = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/eye-detection/predict`;
      formData.append("mode", eyeMode);
    }

    if (selectedType === "Skin Conditions") {
      apiURL = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/skin-detection/predict`;
    }

    if (selectedType === "Chest X-Ray") {
      apiURL = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/xray-detection/predict`;
    }

    try {
      setLoading(true);

      const response = await cachedFormPost(apiURL, formData);
      const data = await response.json();

      setResult(data);

      // 🔥 AI Explanation call
      await generateAIExplanation(data);
    } catch (error) {
      console.error(error);
      alert("Error analyzing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/Hospital_bg.png')" }}
    >
      <div className="absolute inset-0 bg-white/60"></div>

      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-black">
          Medical Image Detection
        </h1>

        {/* 🔥 TWO COLUMN LAYOUT */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* ================= LEFT PANEL ================= */}
          <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
            {/* Type Selection */}
            <div className="mb-6">
              <label className="font-semibold mb-3 block">
                Select Condition Type
              </label>

              <div className="grid grid-cols-3 gap-3">
                {["Skin Conditions", "Eye Diseases", "Chest X-Ray"].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setResult(null);
                        setAiResponse("");
                      }}
                      className={`p-3 rounded-lg border ${
                        selectedType === type
                          ? "bg-[#0D7490] text-white"
                          : "bg-white"
                      }`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Eye Mode */}
            {selectedType === "Eye Diseases" && (
              <div className="mb-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEyeMode("external")}
                    className={`px-4 py-2 rounded ${
                      eyeMode === "external"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    External
                  </button>
                  <button
                    onClick={() => setEyeMode("retinal")}
                    className={`px-4 py-2 rounded ${
                      eyeMode === "retinal"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Retinal
                  </button>
                </div>
              </div>
            )}

            {/* Upload */}
            <label className="cursor-pointer block border-2 border-dashed p-10 text-center rounded-xl hover:border-[#0D7490]">
              <Camera className="mx-auto mb-3 text-gray-400" size={40} />
              Upload Image
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {preview && (
              <img src={preview} alt="preview" className="mt-4 rounded-lg" />
            )}

            <button
              onClick={handleUpload}
              className="w-full mt-6 bg-[#0D7490] text-white py-3 rounded-lg"
            >
              {loading ? "Analyzing..." : "Analyze Image"}
            </button>
          </div>

          {/* ================= RIGHT PANEL ================= */}
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
            {!result && (
              <p className="text-gray-500 text-center mt-20">
                Analysis results will appear here
              </p>
            )}

            {result && (
              <>
                <h2 className="text-xl font-bold mb-4 text-[#0D7490]">
                  Detection Result
                </h2>

                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p>
                    <strong>Condition:</strong> {result.prediction}
                  </p>
                  <p>
                    <strong>Confidence:</strong> {result.confidence}
                  </p>
                </div>

                {/* 🔥 AI RESPONSE */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg whitespace-pre-line">
                  <h3 className="font-semibold mb-2 text-[#0D7490]">
                    AI Medical Guidance
                  </h3>
                  {aiResponse || "Generating explanation..."}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDetection;
