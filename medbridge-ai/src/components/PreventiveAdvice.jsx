// src/components/PreventiveAdvice.jsx
// Uses local Kaggle CSV dataset via Flask — no API key needed

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Volume2, VolumeX, Loader2, AlertCircle,
  Thermometer, Shield, X, ChevronRight
} from "lucide-react";

const API = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/preventive-advice`;

const SEVERITY_STYLES = {
  mild:     { badge: "bg-green-100 text-green-700",   dot: "bg-green-500",  bar: "bg-green-400",  width: "w-1/4"  },
  moderate: { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500", bar: "bg-yellow-400", width: "w-2/4"  },
  high:     { badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500", bar: "bg-orange-400", width: "w-3/4"  },
  critical: { badge: "bg-red-100 text-red-700",       dot: "bg-red-500",    bar: "bg-red-400",    width: "w-full" },
};

const TABS = [
  { id: "symptoms",   label: "Symptoms",   icon: Thermometer },
  { id: "precautions", label: "Precautions", icon: Shield     },
];

export default function PreventiveAdvice() {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [disease,     setDisease]     = useState(null);
  const [allDiseases, setAllDiseases] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [speaking,    setSpeaking]    = useState(false);
  const [activeTab,   setActiveTab]   = useState("symptoms");
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef   = useRef(null);
  const debounceRef = useRef(null);

  // Load all disease names on mount for the quick-browse grid
  useEffect(() => {
    fetch(`${API}/all`)
      .then(r => r.json())
      .then(d => setAllDiseases(d.diseases || []))
      .catch(() => {});
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // ── Debounced autocomplete ────────────────────────────────────────────────
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setShowSuggest(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/search?query=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggest(true);
      } catch { setSuggestions([]); }
    }, 250);
  };

  // ── Fetch full disease detail ─────────────────────────────────────────────
  const fetchDisease = async (name) => {
    setLoading(true);
    setError("");
    setDisease(null);
    setSpeaking(false);
    window.speechSynthesis?.cancel();
    setShowSuggest(false);
    setQuery(name);
    try {
      const res  = await fetch(`${API}/disease?name=${encodeURIComponent(name)}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      setDisease(data);
      setActiveTab("symptoms");
    } catch (e) {
      setError(e.message || "Could not load disease information.");
    } finally {
      setLoading(false);
    }
  };

  // ── Audio ─────────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    if (!disease) return;
    if (!("speechSynthesis" in window)) { alert("Speech not supported."); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }

    const text = `${disease.name}. ${disease.description} `
      + `Key symptoms include: ${disease.symptoms.slice(0, 4).join(", ")}. `
      + `Precautions: ${disease.precautions.join(". ")}.`;

    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = "en-US"; utt.rate = 0.88; utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const clearResult = () => {
    setDisease(null); setQuery(""); setSuggestions([]);
    setSpeaking(false); window.speechSynthesis?.cancel();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sev = disease ? (SEVERITY_STYLES[disease.severity] || SEVERITY_STYLES.moderate) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 bg-cover bg-center relative" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
      <div className="absolute inset-0 bg-white/30"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">

        {/* ── Title ── */}
        <h1 className="text-4xl font-bold mb-2">Preventive Healthcare Advice</h1>
        <p className="text-gray-900 mb-8 text-lg">
          Search from {allDiseases.length} diseases — symptoms, precautions and audio briefing.
        </p>

        {/* ── Search ── */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={e => { if (e.key === "Enter" && query.trim()) fetchDisease(query.trim()); }}
                onFocus={() => suggestions.length && setShowSuggest(true)}
                placeholder="Type a disease name e.g. Malaria, Diabetes…"
                className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base"
              />
              {query && (
                <button onClick={clearResult}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggest && suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border
                               border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map(s => (
                    <li key={s}>
                      <button
                        onMouseDown={() => fetchDisease(s)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700
                                   hover:bg-cyan-50 hover:text-cyan-700 flex items-center
                                   justify-between group transition-colors"
                      >
                        {s}
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => query.trim() && fetchDisease(query.trim())}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-cyan-400 hover:bg-cyan-700 disabled:opacity-50
                         text-white font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-white rounded-xl shadow p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
            <p className="text-gray-500">Loading disease information…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ── Result ── */}
        {disease && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow overflow-hidden">

              {/* Gradient header */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">

                    {/* Name + severity badge */}
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-3xl font-bold">{disease.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                        text-xs font-semibold ${sev.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                        {(disease.severity || "").toUpperCase()}
                      </span>
                    </div>

                    {/* Severity bar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 max-w-xs h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sev.bar} ${sev.width} transition-all`} />
                      </div>
                      <span className="text-cyan-100 text-xs capitalize">{disease.severity} severity</span>
                    </div>

                    {/* Description */}
                    <p className="text-cyan-100 text-sm leading-relaxed">{disease.description}</p>
                  </div>

                  {/* Audio button */}
                  <button
                    onClick={toggleAudio}
                    title={speaking ? "Stop audio" : "Listen to summary"}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                                border-2 transition-all duration-200
                                ${speaking
                                  ? "bg-white text-cyan-600 border-white shadow-lg scale-105"
                                  : "bg-white/20 hover:bg-white/30 text-white border-white/30"}`}
                  >
                    {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Speaking animation */}
                {speaking && (
                  <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 w-fit">
                    <span className="flex gap-1 items-end">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1 bg-white rounded-full animate-bounce"
                              style={{ height: 16, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                    <span className="text-xs text-white/80">Playing audio summary…</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm
                                        border-b-2 transition-all
                                        ${activeTab === id
                                          ? "text-cyan-600 border-cyan-600 bg-white"
                                          : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100"}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "symptoms" && (
                  <>
                    <p className="text-xs text-gray-400 mb-4">
                      {disease.symptoms.length} symptoms recorded in dataset
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {disease.symptoms.map((s, i) => (
                        <span key={i}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100
                                         rounded-full text-sm capitalize">
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === "precautions" && (
                  <ul className="space-y-3">
                    {disease.precautions.map((p, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-green-50 text-green-600
                                          flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 text-sm leading-relaxed pt-0.5 capitalize">{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button onClick={clearResult}
                    className="w-full py-3 bg-white border border-gray-200 rounded-xl
                               text-gray-500 hover:text-cyan-600 hover:border-cyan-300
                               font-medium text-sm transition-all">
              ← Search another disease
            </button>
          </div>
        )}

        {/* ── Browse all diseases grid (shown when no result) ── */}
        {!disease && !loading && allDiseases.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Browse All Diseases
              <span className="ml-2 text-sm font-normal text-gray-400">({allDiseases.length} total)</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allDiseases.map(name => (
                <button key={name} onClick={() => fetchDisease(name)}
                        className="text-left px-3 py-2.5 rounded-lg text-sm text-gray-600
                                   hover:bg-cyan-50 hover:text-cyan-700 border border-gray-100
                                   hover:border-cyan-200 transition-all flex items-center justify-between group">
                  <span className="truncate">{name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-cyan-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-gray-400 text-xs">
          Data sourced from Kaggle Disease Symptom Dataset. For informational purposes only.
        </p>
      </div>
    </div>
  );
}