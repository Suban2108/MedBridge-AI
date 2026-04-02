import { Menu, X, Heart } from 'lucide-react';

const Navigation = ({ currentPage, setCurrentPage, isLoggedIn, setIsLoggedIn, mobileMenuOpen, setMobileMenuOpen }) => {
  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'Image Detection', id: 'image-detection' },
    { name: 'OCR Reports', id: 'ocr-reports' },
    // { name: 'Chatbot', id: 'chatbot' },
    { name: 'Preventive Advice', id: 'preventive' },
    { name: 'Symptom Chatbot', id: 'symptom-prediction' },
    { name: 'Disease Recommendation', id: 'disease-recommendation' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              MedBridge<span className="text-cyan-600">.ai</span>
            </span>
          </div>

          {/* Desktop Navigation - Text Only, Equal Spacing */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-5 py-2 rounded-lg font-medium transition-all text-sm ${
                  currentPage === item.id 
                    ? 'bg-cyan-100 text-cyan-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Sign In/Out & Emergency Button */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <button 
                onClick={() => setIsLoggedIn(false)} 
                className="px-6 py-2 text-gray-700 hover:text-gray-900 font-semibold"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => setCurrentPage('signin')} 
                className="px-6 py-2 text-gray-700 hover:text-gray-900 font-semibold"
              >
                Sign In
              </button>
            )}
            <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all shadow-md">
              Emergency
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  currentPage === item.id 
                    ? 'bg-cyan-100 text-cyan-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
            <button 
              onClick={() => {
                if (isLoggedIn) setIsLoggedIn(false);
                else setCurrentPage('signin');
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all mt-4"
            >
              {isLoggedIn ? 'Sign Out' : 'Sign In'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;