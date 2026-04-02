import { Heart, Phone, Clock } from 'lucide-react';

const Footer = ({ setCurrentPage }) => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold">MedBridge.ai</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered healthcare for rural communities. Empowering health workers with accurate diagnostics.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button onClick={() => setCurrentPage('home')} className="hover:text-cyan-400">Home</button></li>
              <li><button onClick={() => setCurrentPage('chatbot')} className="hover:text-cyan-400">AI Chatbot</button></li>
              <li><button onClick={() => setCurrentPage('image-detection')} className="hover:text-cyan-400">Image Detection</button></li>
              <li><button onClick={() => setCurrentPage('preventive')} className="hover:text-cyan-400">Preventive Care</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-cyan-400">Documentation</a></li>
              <li><a href="#" className="hover:text-cyan-400">Training Videos</a></li>
              <li><a href="#" className="hover:text-cyan-400">FAQ</a></li>
              <li><a href="#" className="hover:text-cyan-400">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +1 (555) 987-6543
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                24/7 Available
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 MedBridge.ai. Built for rural healthcare workers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;