import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cachedFormPost } from "../utils/offlineCache";

const VOICE_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/voice-transcribe`;
const TTS_API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/tts/generate`;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

// ─── Inline Styles (no Tailwind dependency) ───────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #ffffff;
    --surface:   #f9f9f9;
    --panel:     #ffffff;
    --border:    #d9d9d9;
    --red:       #0A92B2;
    --red-dim:   #077a95;
    --amber:     #0A92B2;
    --green:     #22c55e;
    --text:      #1a1a1a;
    --muted:     #888888;
    --accent:    #0A92B2;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Noise texture overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.4;
  }

  .app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 20px;
    display: grid;
    grid-template-rows: auto auto 1fr;
    min-height: 100vh;
    gap: 24px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    padding-bottom: 18px;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .alert-badge {
    background: var(--red);
    color: #fff;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    padding: 4px 10px;
    border-radius: 3px;
    animation: pulse-badge 1.8s ease-in-out infinite;
  }
  @keyframes pulse-badge {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.55; }
  }
  .header h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(28px, 5vw, 42px);
    letter-spacing: 3px;
    color: var(--text);
    line-height: 1;
  }
  .header h1 span { color: var(--red); }
  .status-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Emergency Type Selector ── */
  .emergency-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .em-btn {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 10px;
    cursor: pointer;
    text-align: center;
    transition: all 0.18s ease;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
  }
  .em-btn:hover { border-color: var(--red-dim); background: #1e1e24; }
  .em-btn.active {
    border-color: var(--red);
    background: rgba(255,45,45,0.08);
    box-shadow: 0 0 16px rgba(255,45,45,0.15);
  }
  .em-btn .em-icon { font-size: 26px; margin-bottom: 6px; display: block; }
  .em-btn .em-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: var(--muted); }
  .em-btn.active .em-label { color: var(--red); }

  /* ── Main Layout ── */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 720px) { .main-grid { grid-template-columns: 1fr; } }

  /* ── Precaution Panel ── */
  .precaution-panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .panel-header {
    background: var(--red);
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
  }
  .precaution-list {
    padding: 16px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .precaution-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--surface);
    border-radius: 8px;
    border-left: 3px solid var(--red-dim);
    font-size: 13.5px;
    line-height: 1.5;
    color: #ccc;
    animation: slide-in 0.3s ease forwards;
    opacity: 0;
    transform: translateX(-10px);
  }
  .precaution-item:nth-child(1){animation-delay:0.05s}
  .precaution-item:nth-child(2){animation-delay:0.1s}
  .precaution-item:nth-child(3){animation-delay:0.15s}
  .precaution-item:nth-child(4){animation-delay:0.2s}
  .precaution-item:nth-child(5){animation-delay:0.25s}
  .precaution-item:nth-child(6){animation-delay:0.3s}
  @keyframes slide-in {
    to { opacity:1; transform:translateX(0); }
  }
  .step-num {
    min-width: 22px; height: 22px;
    background: var(--red);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    margin-top: 1px;
  }

  /* ── Chat Panel ── */
  .chat-panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    height: 580px;
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
    color:#18191B
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg {
    max-width: 82%;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    line-height: 1.55;
    animation: msg-in 0.2s ease;
  }
  @keyframes msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .msg.user {
    align-self: flex-end;
    background: rgba(255,45,45,0.15);
    border: 1px solid var(--red-dim);
    color: var(--text);
  }
  .msg.assistant {
    align-self: flex-start;
    background: var(--surface);
    border: 1px solid var(--border);
    color: #d4d2cc;
  }
  .msg.system {
    align-self: center;
    background: rgba(255,176,32,0.08);
    border: 1px solid rgba(255,176,32,0.25);
    color: var(--amber);
    font-size: 12px;
    text-align: center;
    font-style: italic;
    max-width: 90%;
  }
  .msg-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 5px;
    color: var(--muted);
  }
  .msg.user .msg-label { color: var(--red); }
  .msg.assistant .msg-label { color: var(--amber); }

  .typing-dots {
    display: flex; gap: 5px; padding: 4px 0;
  }
  .typing-dots span {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--muted);
    animation: bounce 1.2s ease-in-out infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{transform:scale(0.7)} 40%{transform:scale(1.1)} }

  /* ── Voice Controls ── */
  .voice-bar {
    border-top: 1px solid var(--border);
    padding: 14px 16px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .voice-btn {
    width: 48px; height: 48px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    transition: all 0.15s ease;
    flex-shrink: 0;
    color: var(--text);
  }
  .voice-btn:hover { border-color: var(--red); background: rgba(255,45,45,0.1); }
  .voice-btn.recording {
    border-color: var(--red);
    background: rgba(255,45,45,0.2);
    animation: pulse-ring 1s ease-in-out infinite;
  }
  @keyframes pulse-ring {
    0%  { box-shadow: 0 0 0 0 rgba(255,45,45,0.4); }
    70% { box-shadow: 0 0 0 12px rgba(255,45,45,0); }
    100%{ box-shadow: 0 0 0 0 rgba(255,45,45,0); }
  }
  .text-input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
    resize: none;
  }
  .text-input::placeholder { color: var(--muted); }
  .text-input:focus { border-color: var(--red-dim); }
  .send-btn {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: var(--red);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    transition: background 0.15s, transform 0.1s;
    color: #fff;
  }
  .send-btn:hover { background: #e02020; transform: scale(1.05); }
  .send-btn:disabled { background: var(--border); cursor: not-allowed; transform: none; }

  .tts-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--muted);
    margin-top: 6px;
    transition: all 0.15s;
  }
  .tts-btn:hover { border-color: var(--amber); color: var(--amber); }

  .transcript-preview {
    font-size: 11px;
    color: var(--muted);
    font-style: italic;
    padding: 4px 8px;
    min-height: 18px;
  }

  .no-emergency {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 100%; gap: 12px;
    color: var(--muted); text-align: center; padding: 30px;
  }
  .no-emergency .big-icon { font-size: 48px; opacity: 0.3; }
`;

// ─── Emergency Data ────────────────────────────────────────────────────────────
const EMERGENCIES = [
  { id: "fire",      icon: "🔥", label: "Fire",       color: "#ff6b35" },
  { id: "medical",   icon: "🚑", label: "Medical",    color: "#ff2d2d" },
  { id: "earthquake",icon: "🌍", label: "Earthquake", color: "#b08d57" },
  { id: "flood",     icon: "🌊", label: "Flood",      color: "#3b82f6" },
  { id: "chemical",  icon: "☣️",  label: "Chemical",  color: "#a3e635" },
  { id: "power",     icon: "⚡",  label: "Power Cut",  color: "#fbbf24" },
];

const PRECAUTIONS = {
  fire: [
    "Activate the nearest fire alarm immediately.",
    "Call 101 (Fire) or 112 (Emergency) at once.",
    "Crawl low under smoke — hot gases rise to the ceiling.",
    "Feel doors before opening — if hot, do NOT open.",
    "Evacuate via the nearest marked fire exit; never use elevators.",
    "If clothing catches fire: STOP, DROP, and ROLL.",
  ],
  medical: [
    "Call 108 (Ambulance) or 112 immediately.",
    "Keep the patient calm and still; do not move if spine injury suspected.",
    "Apply direct pressure to bleeding wounds with a clean cloth.",
    "If unconscious and not breathing, begin CPR (30 compressions : 2 breaths).",
    "Note time of symptom onset — critical for stroke/heart attack treatment.",
    "Do not offer food or water until medical professionals arrive.",
  ],
  earthquake: [
    "DROP to hands and knees immediately.",
    "Take COVER under a sturdy desk or against an interior wall.",
    "HOLD ON and protect your neck and head with your arms.",
    "Stay away from windows, exterior walls, and heavy furniture.",
    "Do not run outside during shaking — most injuries occur from falling debris.",
    "After shaking stops, check for gas leaks and evacuate if you smell gas.",
  ],
  flood: [
    "Move immediately to higher ground — never wait for instructions.",
    "Do not walk or drive through moving floodwater (6 inches can knock you down).",
    "Disconnect electrical appliances if safe to do so.",
    "Avoid contact with floodwater — it may be contaminated.",
    "Listen to emergency broadcasts (All India Radio, local FM).",
    "Signal for help from a rooftop using bright cloth or a flashlight.",
  ],
  chemical: [
    "Move upwind and uphill away from the spill immediately.",
    "Cover your nose and mouth with a wet cloth.",
    "Remove and bag contaminated clothing; wash exposed skin with water.",
    "Do not eat, drink, or touch your face until decontaminated.",
    "Call 1800-180-5095 (NDRF Helpline) and await official guidance.",
    "Shelter-in-place if evacuation is not possible — seal doors and windows.",
  ],
  power: [
    "Unplug sensitive electronics to prevent surge damage on restoration.",
    "Use battery-powered or wind-up torches — avoid candles near flammables.",
    "Keep refrigerator and freezer doors closed to preserve food (4 hrs safe).",
    "Report the outage to your local DISCOM (distribution company) helpline.",
    "Never use a generator indoors — risk of carbon monoxide poisoning.",
    "Check on elderly neighbors and those reliant on powered medical equipment.",
  ],
};

function buildEmergencyGroqMessages(history, emergencyType) {
  const systemContent =
    `You are MedBridge Emergency Assist — a concise emergency guidance assistant for "${emergencyType}" situations.\n` +
    `- Give short, actionable steps (numbered when helpful).\n` +
    `- Always tell users to call local emergency services when life-threatening (e.g. 112, 108, 101 as appropriate for their region).\n` +
    `- You are not a substitute for professional emergency responders.\n` +
    `- Respond in clear English only.`;

  const out = [{ role: "system", content: systemContent }];
  for (const m of history) {
    if (m.role === "user") out.push({ role: "user", content: m.content });
    else if (m.role === "assistant") out.push({ role: "assistant", content: m.content });
  }
  return out;
}

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

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsProcessing(true);
      setFeedback("🔄 Processing audio.. It may take a moment.");

      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      formData.append("language", selectedLanguage);
      formData.append("task", "translate");

      const response = await cachedFormPost(VOICE_API, formData);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Transcription failed");
      }

      setFeedback(
        `✅ Transcription complete! Language: ${data.detected_language_name}`
      );

      onTranscriptReceived(data.text);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">🎤 Voice Input</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

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

        {isRecording && (
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-semibold"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {feedback && (
          <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 text-center text-sm">
            {feedback}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-center text-sm">
            ❌ {error}
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmergencyAssistant() {
  const [selectedType, setSelectedType] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Select an emergency type above, then speak or type to get immediate AI assistance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [chatError, setChatError] = useState("");
  const [readingMessageIndex, setReadingMessageIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const ttsObjectUrlRef = useRef(null);

  const groqKey = import.meta.env.VITE_GROQ_API_KEY;

  const stopTts = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current.removeAttribute("src");
      ttsAudioRef.current.load();
      ttsAudioRef.current = null;
    }
    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
      ttsObjectUrlRef.current = null;
    }
    setReadingMessageIndex(null);
  }, []);

  const playTts = useCallback(
    async (text, messageIndex) => {
      if (!text) return;
      stopTts();
      if (typeof messageIndex === "number") {
        setReadingMessageIndex(messageIndex);
      }

      const clearSpeaking = () => setReadingMessageIndex(null);

      const speakBrowser = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          clearSpeaking();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = clearSpeaking;
        utterance.onerror = clearSpeaking;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };

      try {
        const response = await fetch(TTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice_id: "Joanna" }),
        });

        if (!response.ok) {
          speakBrowser();
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsObjectUrlRef.current = audioUrl;
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        audio.onended = () => {
          stopTts();
        };
        audio.onerror = () => {
          stopTts();
        };
        await audio.play();
      } catch {
        speakBrowser();
      }
    },
    [stopTts]
  );

  const toggleReadAloud = useCallback(
    (messageIndex, text) => {
      if (readingMessageIndex === messageIndex) {
        stopTts();
        return;
      }
      void playTts(text, messageIndex);
    },
    [readingMessageIndex, stopTts, playTts]
  );

  const canSend = useMemo(
    () => Boolean(selectedType && input.trim().length > 0 && !isLoading),
    [selectedType, input, isLoading]
  );

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Preload voices (browser TTS fallback)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  useEffect(() => () => stopTts(), [stopTts]);

  const handleSelectType = (type) => {
    stopTts();
    setSelectedType(type);
    setChatError("");
    setMessages([
      {
        role: "system",
        content: `Emergency mode: ${type.toUpperCase()}. Precautions loaded. AI assistant ready — describe your situation.`,
      },
    ]);
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || !selectedType) return;

      if (!groqKey) {
        setChatError(
          "Missing Groq API key. Add VITE_GROQ_API_KEY to your .env file and restart the dev server."
        );
        return;
      }

      const userMsg = { role: "user", content: trimmed };
      const historyForApi = [
        ...messages.filter((m) => m.role !== "system"),
        userMsg,
      ];

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setChatError("");
      setIsLoading(true);

      try {
        const groqMessages = buildEmergencyGroqMessages(historyForApi, selectedType);

        const res = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: groqMessages,
            temperature: 0.35,
            max_tokens: 1024,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg =
            data?.error?.message ||
            data?.message ||
            `Groq request failed (${res.status})`;
          throw new Error(errMsg);
        }

        const reply =
          data.choices?.[0]?.message?.content?.trim() ||
          "I'm sorry, I couldn't generate a response. Please try again.";

        setMessages((prev) => {
          const next = [...prev, { role: "assistant", content: reply }];
          if (voiceRepliesEnabled) {
            const idx = next.length - 1;
            queueMicrotask(() => {
              void playTts(reply, idx);
            });
          }
          return next;
        });
      } catch (err) {
        const msg =
          err?.message ||
          "Something went wrong contacting the AI. Follow the precautions on the left and call emergency services if needed.";
        setChatError(msg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ I could not reach the AI assistant. Use the precautions listed on the left and contact local emergency services (e.g. 112 / 108) if the situation is urgent.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedType, groqKey, voiceRepliesEnabled, playTts]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-left">
            <span className="alert-badge">LIVE</span>
            <h1>EMERGENCY <span>ASSIST</span></h1>
          </div>
          <div className="status-dot" title="System Online" />
        </header>

        {/* ── Emergency Type Grid ── */}
        <section>
          <div className="emergency-grid">
            {EMERGENCIES.map((em) => (
              <button
                key={em.id}
                className={`em-btn ${selectedType === em.id ? "active" : ""}`}
                onClick={() => handleSelectType(em.id)}
              >
                <span className="em-icon">{em.icon}</span>
                <span className="em-label">{em.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="main-grid">
          {/* ── Precautions ── */}
          <aside className="precaution-panel">
            <div className="panel-header">
              ⚠️ IMMEDIATE PRECAUTIONS
            </div>
            {selectedType ? (
              <ul className="precaution-list" key={selectedType}>
                {PRECAUTIONS[selectedType].map((step, i) => (
                  <li key={i} className="precaution-item">
                    <span className="step-num">{i + 1}</span>
                    <span className="text-black">{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-emergency">
                <span className="big-icon">🆘</span>
                <p>Select an emergency type above to view precautionary steps.</p>
              </div>
            )}
          </aside>

          {/* ── Chat ── */}
          <section className="chat-panel">
            <div
              className="panel-header"
              style={{
                background: "#1a1a22",
                color: "#aaa",
                fontSize: 13,
                letterSpacing: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <span>🤖 AI EMERGENCY ASSISTANT — SPEAK OR TYPE</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  disabled={!selectedType}
                  style={{
                    background: "rgba(10,146,178,0.35)",
                    border: "1px solid rgba(10,146,178,0.6)",
                    color: "#e0e0e0",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: selectedType ? "pointer" : "not-allowed",
                    opacity: selectedType ? 1 : 0.5,
                    fontFamily: "inherit",
                  }}
                >
                  🎤 Voice Input
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceRepliesEnabled((prev) => !prev)}
                  style={{
                    background: voiceRepliesEnabled
                      ? "rgba(34,197,94,0.35)"
                      : "rgba(120,120,120,0.3)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#e0e0e0",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {voiceRepliesEnabled ? "🔊 Voice Replies" : "🔇 Silent"}
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  {msg.role !== "system" && (
                    <div className="msg-label">
                      {msg.role === "user" ? "YOU" : "AI ASSISTANT"}
                    </div>
                  )}
                  {msg.content}
                  {msg.role === "assistant" && (
                    <div>
                      <button
                        type="button"
                        className="tts-btn"
                        onClick={() => toggleReadAloud(i, msg.content)}
                      >
                        {readingMessageIndex === i ? "⏹ Stop" : "🔊 Read aloud"}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="msg assistant">
                  <div className="msg-label">AI ASSISTANT</div>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div
                style={{
                  margin: "0 16px",
                  padding: "10px 12px",
                  background: "rgba(255,80,80,0.12)",
                  border: "1px solid rgba(255,80,80,0.35)",
                  borderRadius: 8,
                  color: "#c4a0a0",
                  fontSize: 12,
                }}
              >
                {chatError}
              </div>
            )}

            <div>
              <div className="voice-bar">
                <button
                  type="button"
                  className="voice-btn"
                  onClick={() => setShowVoiceModal(true)}
                  disabled={!selectedType}
                  title="Voice input (Whisper, translate to English)"
                >
                  🎙
                </button>

                <textarea
                  ref={inputRef}
                  className="text-input"
                  rows={1}
                  placeholder={
                    selectedType
                      ? `Describe your ${selectedType} situation...`
                      : "Select an emergency type first..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!selectedType || isLoading}
                />

                <button
                  type="button"
                  className="send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!canSend}
                  title="Send message"
                >
                  ➤
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <VoiceRecorderModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTranscriptReceived={handleVoiceTranscript}
      />
    </>
  );
}