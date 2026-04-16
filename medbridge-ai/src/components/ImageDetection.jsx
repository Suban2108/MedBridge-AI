import React, { useState } from "react";
import axios from "axios";
import { Camera } from "lucide-react";

const ImageDetection = () => {
  const [selectedType, setSelectedType] = useState("Eye Diseases");
  const [eyeMode, setEyeMode] = useState("external");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    let apiURL = "";

    // 🔥 Decide API based on selected type
    if (selectedType === "Eye Diseases") {
      apiURL = "http://localhost:8000/api/v1/eye-detection/predict";
      formData.append("mode", eyeMode); // required by backend
    }

    if (selectedType === "Skin Conditions") {
      apiURL = "http://localhost:8000/api/v1/skin-detection/predict";
    }

    if (selectedType === "Chest X-Ray") {
      apiURL = "http://localhost:8000/api/v1/xray-detection/predict";
    }

    try {
      setLoading(true);

      const response = await axios.post(apiURL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Error analyzing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6">Medical Image Detection</h1>

        {/* Condition Type Selection */}
        <div className="mb-6">
          <label className="block font-semibold mb-3">
            Select Condition Type
          </label>

          <div className="grid grid-cols-3 gap-4">
            {["Skin Conditions", "Eye Diseases", "Chest X-Ray"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setResult(null);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition ${
                    selectedType === type
                      ? "border-cyan-600 bg-cyan-100"
                      : "border-gray-300"
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {/* Eye Mode Selection */}
        {selectedType === "Eye Diseases" && (
          <div className="mb-6">
            <label className="block font-semibold mb-3">
              Select Eye Image Type
            </label>

            <div className="flex gap-4">
              <button
                onClick={() => setEyeMode("external")}
                className={`px-4 py-2 rounded-lg border-2 ${
                  eyeMode === "external"
                    ? "border-green-600 bg-green-100"
                    : "border-gray-300"
                }`}
              >
                External Eye
              </button>

              <button
                onClick={() => setEyeMode("retinal")}
                className={`px-4 py-2 rounded-lg border-2 ${
                  eyeMode === "retinal"
                    ? "border-purple-600 bg-purple-100"
                    : "border-gray-300"
                }`}
              >
                Retinal Image
              </button>
            </div>
          </div>
        )}

        {/* Upload Box */}
        <div className="bg-white p-8 rounded-xl shadow">
          <label className="cursor-pointer block border-4 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-cyan-500 transition">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-semibold">Click to upload image</p>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Preview */}
          {preview && (
            <div className="mt-6 text-center">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-64 rounded-lg"
              />
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-lg font-semibold transition"
          >
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-bold">
                Prediction: {result.prediction}
              </h3>

              <p>Confidence: {result.confidence}</p>

              {result.mode && <p>Mode: {result.mode}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDetection;