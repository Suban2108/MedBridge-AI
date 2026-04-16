import { useState } from 'react';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import ImageDetection from './components/ImageDetection';
import OCRReports from './components/OCRReports';
import Chatbot from './components/Chatbot';
import PreventiveAdvice from './components/PreventiveAdvice';
import SignIn from './components/SignIn';
import Footer from './components/Footer';
import SymptomPredictionChatbot from './components/SymptomPredictionChatbot';
import DiseaseRecommendation from './components/DiseaseRecommendation';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderPage = () => {
    // Require login for feature pages
    if (!isLoggedIn && currentPage !== 'home' && currentPage !== 'signin') {
      return <SignIn setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'image-detection':
        return <ImageDetection />;
      case 'ocr-reports':
        return <OCRReports />;
      case 'chatbot':
        return <Chatbot />;
      case 'preventive':
        return <PreventiveAdvice />;
      case 'symptom-prediction':
        return <SymptomPredictionChatbot />;
      case 'disease-recommendation':
        return <DiseaseRecommendation />;
      case 'signin':
        return <SignIn setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      {renderPage()}
      
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;