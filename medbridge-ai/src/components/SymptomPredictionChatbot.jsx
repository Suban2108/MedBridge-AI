import { useMemo, useState } from "react";

const CHAT_API = "http://localhost:8000/api/v1/symptom-chatbot/chat";
const RESET_API = "http://localhost:8000/api/v1/symptom-chatbot/reset";

export default function SymptomPredictionChatbot() {
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I am your symptom assistant. Tell me your symptoms one by one, then type 'predict' for my best disease guess.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultCard, setResultCard] = useState(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId || undefined }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);

      if (data.result) {
        setResultCard(data.result);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetChat = async () => {
    if (sessionId) {
      try {
        await fetch(RESET_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch { }
    }

    setSessionId("");
    setError("");
    setResultCard(null);
    setMessages([
      {
        role: "bot",
        text: "Hi, I am your symptom assistant. Tell me your symptoms one by one, then type 'predict' for my best disease guess.",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-[900px] mx-auto px-4">
        {/* 🧠 Main Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Health Assistant
        </h1>
        <p className="text-gray-600 mb-6">
          Describe your symptoms and get preliminary diagnostic assistance with multilingual support.
        </p>

        {/* 🔵 Assistant Header Bar */}
        <div className="rounded-tr-2xl rounded-tl-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-5 flex items-center justify-between">

            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20">
                <span className="text-white text-xl">💬</span>
              </div>

              {/* Text */}
              <div>
                <h2 className="text-white font-semibold text-lg">
                  MedBridge Assistant
                </h2>
                <p className="text-white/80 text-sm">
                  Online • Multilingual Support
                </p>
              </div>
            </div>

            {/* Right Button */}
            <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Voice Input
            </button>
          </div>
        </div>

        <div className="shadow-lg overflow-hidden bg-white">

          {/* 💬 Chat Area */}
          <div className="h-[420px] overflow-y-auto p-5 bg-gray-50 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl text-sm shadow-sm ${m.role === "user"
                      ? "bg-cyan-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* ✍️ Input Area */}
          <form
            onSubmit={sendMessage}
            className="border-t border-gray-200 bg-white p-4 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I have fever and headache for 2 days"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              type="submit"
              disabled={!canSend}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg font-semibold"
            >
              Send
            </button>

            <button
              type="button"
              onClick={resetChat}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
            >
              Reset
            </button>
          </form>
        </div>

        {/* ❌ Error */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* 📊 Result Card */}
        {resultCard && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 space-y-3 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {resultCard.predicted_disease}
            </h2>

            {typeof resultCard.confidence_percent === "number" && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200">
                  Confidence: {resultCard.confidence_percent}%
                </span>
                {resultCard.confidence_detail && (
                  <span className="text-xs text-gray-500">
                    Matched {resultCard.confidence_detail.symptoms_matched} of{" "}
                    {resultCard.confidence_detail.symptoms_provided} captured symptom
                    {resultCard.confidence_detail.symptoms_provided !== 1 ? "s" : ""}
                    {typeof resultCard.confidence_detail.runner_up_score === "number"
                      ? ` · next-best overlap: ${resultCard.confidence_detail.runner_up_score}`
                      : ""}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Confidence is estimated from how well your symptoms align with the dataset and
              how clearly this result beats alternatives—it is not a medical probability.
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Severity:</span>{" "}
              {resultCard.severity}
            </p>

            <p className="text-gray-700">{resultCard.description}</p>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Precautions
              </h3>
              <ul className="list-disc list-inside text-gray-700">
                {(resultCard.precautions || []).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}