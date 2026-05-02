import { useMemo, useState, useRef } from "react";
import { cachedFormPost, cachedJsonPost } from "../utils/offlineCache";

const CHAT_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/symptom-chatbot/chat`;
const RESET_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/symptom-chatbot/reset`;
const VOICE_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/voice-transcribe`;
const TTS_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/tts/generate`;

// Language options for voice input
const LANGUAGE_OPTIONS = [
  { code: "auto", name: "🔍 Auto-Detect" },
  { code: "en", name: "🇬🇧 English" },
  { code: "es", name: "🇪🇸 Spanish" },
  { code: "fr", name: "🇫🇷 French" },
  { code: "de", name: "🇩🇪 German" },
  { code: "it", name: "🇮🇹 Italian" },
  { code: "pt", name: "🇵🇹 Portuguese" },
  { code: "ru", name: "🇷🇺 Russian" },
  { code: "ja", name: "🇯🇵 Japanese" },
  { code: "zh", name: "🇨🇳 Chinese" },
  { code: "hi", name: "🇮🇳 Hindi" },
  { code: "ar", name: "🇸🇦 Arabic" },
  { code: "ko", name: "🇰🇷 Korean" },
  { code: "th", name: "🇹🇭 Thai" },
];

// Voice Recorder Modal Component
function VoiceRecorderModal({ isOpen, onClose, onTranscriptReceived }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      setError("");
      setFeedback("🎙️ Starting recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        setFeedback("🔴 Recording... Click STOP when done");
        
        // Timer
        timerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      mediaRecorder.onerror = (event) => {
        setError(`Recording error: ${event.error}`);
        setIsRecording(false);
      };

      mediaRecorder.start();
    } catch (err) {
      setError(`Microphone access denied: ${err.message}`);
    }
  };

  const stopRecording = () => {
    setFeedback("⏹️ Stopping recording...");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = async () => {
        clearInterval(timerIntervalRef.current);
        setIsRecording(false);
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Transcribe
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsProcessing(true);
      setFeedback("🔄 Processing audio.. It may take a moment");
      
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      formData.append("language", selectedLanguage);
      formData.append("task", "translate"); // Always translate to English for symptom analysis

      const response = await cachedFormPost(VOICE_API, formData);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Transcription failed");
      }

      setFeedback(
        `✅ Transcription complete! Language: ${data.detected_language_name}`
      );
      
      // Pass transcribed text to parent
      onTranscriptReceived(data.text);

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to transcribe audio");
      setFeedback("");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">🎤 Voice Input</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording || isProcessing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recording Time Display */}
        {isRecording && (
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-semibold"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 text-center text-sm">
            {feedback}
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-center text-sm">
            ❌ {error}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const speakText = async (text) => {
    if (!text) return;
    try {
      const response = await fetch(TTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: "Joanna" }), // Joanna is a natural, calming female voice
      });

      if (!response.ok) {
        console.warn("TTS failed, falling back to browser speech");
        // Fallback to browser TTS if Polly fails
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.warn("TTS error:", error);
      // Fallback to browser TTS
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await cachedJsonPost(CHAT_API, {
        message,
        session_id: sessionId || undefined,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);

      if (voiceRepliesEnabled) {
        speakText(data.reply);
      }

      if (data.result) {
        setResultCard(data.result);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  const resetChat = async () => {
    if (sessionId) {
      try {
        await fetch(RESET_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch { /* empty */ }
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
    <div className="min-h-screen bg-gray-100 py-12 bg-cover bg-center relative" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
      <div className="absolute inset-0 bg-white/30"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* 🧠 Main Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Health Assistant
        </h1>
        <p className="text-gray-600 mb-6">
          Describe your symptoms and get preliminary diagnostic assistance with multilingual voice support.
        </p>

        {/* 🔵 Assistant Header Bar */}
        <div className="rounded-tr-2xl rounded-tl-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-br from-[#0D7490] to-cyan-500 px-6 py-5 flex items-center justify-between">

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
                  Online • Multilingual Voice Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowVoiceModal(true)}
                className="bg-white/40 hover:bg-white/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🎤 Voice Input
              </button>
              <button
                type="button"
                onClick={() => setVoiceRepliesEnabled((prev) => !prev)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${voiceRepliesEnabled ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white/40 text-white hover:bg-white/50"}`}
              >
                {voiceRepliesEnabled ? "🔊 Voice Replies" : "🔇 Silent Replies"}
              </button>
            </div>
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

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTranscriptReceived={handleVoiceTranscript}
      />
    </div>
  );
}