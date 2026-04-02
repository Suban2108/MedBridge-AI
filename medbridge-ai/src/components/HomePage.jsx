import { ChevronRight, Heart, Users, Clock, Phone, MessageCircle, Camera, FileText, Shield, Activity, Stethoscope, Brain } from 'lucide-react';

const HomePage = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      {/* Hero Section with Illustration */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-cyan-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Leading Healthcare AI Solution
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Advanced Medical Care<br />
                <span className="text-cyan-300">for Rural Healthcare</span>
              </h1>
              
              <p className="text-xl text-gray-200 mb-8">
                AI-powered diagnostic system empowering rural health workers with accurate, accessible, and reliable preliminary healthcare support.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <button onClick={() => setCurrentPage('chatbot')} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                  Start Diagnosis
                </button>
                <button onClick={() => setCurrentPage('image-detection')} className="bg-transparent border-2 border-white hover:bg-white hover:text-cyan-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all">
                  Explore Features
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Phone className="w-6 h-6 text-cyan-300" />
                  <div>
                    <div className="text-sm text-gray-300">Emergency Line</div>
                    <div className="font-semibold">+1 (555) 987-6543</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Clock className="w-6 h-6 text-cyan-300" />
                  <div>
                    <div className="text-sm text-gray-300">Working Hours</div>
                    <div className="font-semibold">24/7 Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image - Doctor/Healthcare Worker */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400 rounded-full blur-3xl opacity-20"></div>
                <div className="relative">
                  {/* Decorative Background Elements */}
                  <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-300 rounded-full opacity-20 blur-2xl"></div>
                  <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-300 rounded-full opacity-20 blur-2xl"></div>
                  
                  {/* Main Image Container */}
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 overflow-hidden">
                    {/* Replace with actual doctor image */}
                    <img 
                      src="https://i.pinimg.com/1200x/20/aa/44/20aa442a1ef36172e30fefa625720270.jpg"
                      alt="Healthcare Professional" 
                      className="w-full h-[500px] object-cover rounded-xl"
                    />
                    
                    {/* Floating Stats Cards */}
                    <div className="absolute top-6 right-6 bg-white rounded-lg shadow-xl p-4 animate-bounce">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                          <div className="text-lg font-bold text-gray-900">94.3%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Health Workers</div>
                          <div className="text-lg font-bold text-gray-900">5,000+</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Healthcare Solutions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            MedBridge.ai combines multiple AI technologies to provide accurate diagnostics and support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: MessageCircle, title: 'AI Chatbot', description: 'Intelligent symptom analysis with multilingual support', page: 'chatbot', gradient: 'from-cyan-500 to-blue-500' },
            { icon: Camera, title: 'Image Detection', description: 'Advanced computer vision for medical image analysis', page: 'image-detection', gradient: 'from-blue-500 to-indigo-500' },
            { icon: FileText, title: 'OCR Reports', description: 'Extract and digitize medical documents', page: 'ocr-reports', gradient: 'from-indigo-500 to-purple-500' },
            { icon: Shield, title: 'Preventive Care', description: 'Personalized health advice and preventive measures', page: 'preventive', gradient: 'from-teal-500 to-cyan-500' },
            { icon: Heart, title: 'Offline Support', description: 'Full functionality without internet connectivity', page: 'home', gradient: 'from-rose-500 to-pink-500' },
            { icon: Users, title: 'Patient Records', description: 'Secure patient history management', page: 'home', gradient: 'from-purple-500 to-violet-500' }
          ].map((feature, idx) => (
            <div key={idx} onClick={() => setCurrentPage(feature.page)} className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 border border-gray-100 overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient}`}></div>
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <button className="text-cyan-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Learn more <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '94.3%', label: 'Diagnostic Accuracy', icon: Activity },
              { number: '41+', label: 'Disease Categories', icon: Stethoscope },
              { number: '132', label: 'Symptom Patterns', icon: Brain },
              { number: '24/7', label: 'Availability', icon: Clock }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <stat.icon className="w-10 h-10 mx-auto mb-3 text-cyan-200" />
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-cyan-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section with Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              About MedBridge.ai
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Bridging the Healthcare Gap in Rural Communities
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              MedBridge.ai is an AI-powered diagnostic system specifically designed for resource-constrained environments. We empower rural health workers, ASHA workers, and auxiliary nurse midwives with cutting-edge technology.
            </p>
            <div className="space-y-4">
              {[
                { icon: Heart, text: 'Serving rural healthcare workers across India', color: 'text-red-600' },
                { icon: Shield, text: 'WHO-aligned health guidelines', color: 'text-green-600' },
                { icon: Users, text: 'Supporting ASHA workers and health centers', color: 'text-blue-600' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mission Card with Visual */}
          <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl p-8">
            <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
              </div>
              <p className="text-gray-600">
                To make quality healthcare accessible to every rural community by empowering frontline health workers with intelligent, reliable, and easy-to-use diagnostic tools.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Users className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-cyan-600 mb-1">5,000+</div>
                <div className="text-sm text-gray-600">Health Workers Trained</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Activity className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-cyan-600 mb-1">25,000+</div>
                <div className="text-sm text-gray-600">Diagnoses Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Advanced AI Technology</h2>
            <p className="text-xl text-gray-600">
              Built with state-of-the-art machine learning models optimized for rural healthcare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'K-Nearest Neighbors', description: 'Symptom-based disease prediction', stat: '94.3%', icon: Brain, color: 'cyan' },
              { title: 'Computer Vision', description: 'CNN models for image analysis', stat: 'CNN', icon: Camera, color: 'blue' },
              { title: 'NLP Chatbot', description: 'Intent recognition multilingual', stat: '91.7%', icon: MessageCircle, color: 'indigo' },
              { title: 'OCR Engine', description: 'Prescription digitization', stat: '89.2%', icon: FileText, color: 'purple' }
            ].map((tech, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className={`w-12 h-12 bg-${tech.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <tech.icon className={`w-6 h-6 text-${tech.color}-600`} />
                </div>
                <div className="text-3xl font-bold text-cyan-600 mb-3">{tech.stat}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tech.title}</h3>
                <p className="text-sm text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section with Visual Flow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How MedBridge.ai Works</h2>
          <p className="text-xl text-gray-600">Simple, fast, and accurate diagnostic process</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Input Symptoms', description: 'Health worker enters patient symptoms via text or voice', icon: MessageCircle, color: 'cyan' },
            { step: '02', title: 'AI Analysis', description: 'Machine learning models analyze symptoms and images', icon: Brain, color: 'blue' },
            { step: '03', title: 'Get Diagnosis', description: 'System provides probable diseases with confidence scores', icon: Stethoscope, color: 'indigo' },
            { step: '04', title: 'Take Action', description: 'Receive treatment recommendations and referral guidance', icon: Shield, color: 'purple' }
          ].map((item, idx) => (
            <div key={idx} className="relative">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white rounded-full text-2xl font-bold mb-4 shadow-lg`}>
                  {item.step}
                </div>
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-cyan-200 to-blue-200 -translate-x-1/2">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6 text-cyan-200" />
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Rural Healthcare?</h2>
          <p className="text-xl text-cyan-100 mb-8">
            Join thousands of health workers using MedBridge.ai to provide better care
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setCurrentPage('chatbot')}
              className="bg-white text-cyan-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all"
            >
              Start Free Trial
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-cyan-600 transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;