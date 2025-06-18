import React, { useState } from 'react';
import { CreditCard, Sparkles, Shield, TrendingUp } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { RecommendedCard } from './services/api';
import './App.css';

function App() {
  const [recommendations, setRecommendations] = useState<RecommendedCard[] | null>(null);

  const handleRecommendationsReceived = (newRecommendations: RecommendedCard[]) => {
    setRecommendations(newRecommendations);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  Credit Card Advisor
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  AI-powered recommendations for Indian credit cards
                </p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="whitespace-nowrap">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="whitespace-nowrap">Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="whitespace-nowrap">20+ Cards</span>
              </div>
            </div>
            
            {/* Mobile indicators */}
            <div className="flex lg:hidden items-center space-x-1 text-xs text-gray-500">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <Shield className="w-3 h-3 text-green-500" />
              <TrendingUp className="w-3 h-3 text-purple-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Chat Section */}
          <div className="lg:col-span-2 flex flex-col min-h-0 order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
              <ChatInterface onRecommendationsReceived={handleRecommendationsReceived} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6 order-2 lg:order-3">
            {/* Welcome Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-lg mr-2">👋</span>
                Welcome!
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                I'm your AI credit card advisor. I'll help you find the perfect credit card 
                based on your income, spending habits, and preferences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>Reward calculations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span>Expert guidance</span>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                How it works
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="text-sm text-gray-600">
                    Tell me about your income and spending habits
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="text-sm text-gray-600">
                    Share your credit score and card preferences
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="text-sm text-gray-600">
                    Get personalized card recommendations with reward calculations
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm text-white p-4 lg:p-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">✨</span>
                Premium Features
              </h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <span>20+ Indian credit cards database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <span>Real-time reward calculations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <span>Eligibility checking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <span>Comparison tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <span>Expert AI recommendations</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            {recommendations && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Your Recommendations
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-green-600">
                      {recommendations.length}
                    </div>
                    <div className="text-xs text-gray-600">Cards Found</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(recommendations[0]?.score || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Top Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
            <div className="text-center sm:text-left">
              © 2025 Credit Card Advisor. Made with ❤️ for Indian users.
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="flex items-center space-x-1">
                <span>🔒</span>
                <span className="hidden sm:inline">Secure</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🚀</span>
                <span className="hidden sm:inline">Fast</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🎯</span>
                <span className="hidden sm:inline">Accurate</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
