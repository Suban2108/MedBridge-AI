import { MessageCircle } from 'lucide-react';

const Chatbot = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12" style={{ backgroundImage: "url('/Hospital_bg.png')" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Health Assistant</h1>
          <p className="text-lg text-gray-600">Describe your symptoms and get preliminary diagnostic assistance with multilingual support.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">MedBridge Assistant</div>
                <div className="text-xs text-cyan-100">Online • Multilingual Support</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-all">
              Voice Input
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-tl-none p-4 shadow max-w-md">
                <p className="text-gray-800">
                  Hello! I'm your AI health assistant. I can help you with symptom analysis in English, Hindi, Marathi, and other languages. How can I help you today?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-cyan-600 text-white rounded-lg rounded-tr-none p-4 shadow max-w-md">
                <p>I have been experiencing fever and headache for 2 days.</p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-tl-none p-4 shadow max-w-md">
                <p className="text-gray-800">
                  I understand. Can you tell me more about your symptoms? Do you have any other symptoms like body ache, cough, or fatigue?
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type your symptoms here..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all">
                Send
              </button>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Integration Point:</strong> Connect to your NLP backend with FAISS vector store and spaCy models (91.7% intent recognition accuracy).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;