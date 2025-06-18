import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Loader, MessageCircle } from 'lucide-react';
import { chatAPI, ChatMessage, RecommendedCard } from '../services/api';
import RecommendationCards from './RecommendationCards';

interface ChatInterfaceProps {
  onRecommendationsReceived?: (recommendations: RecommendedCard[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onRecommendationsReceived }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[] | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.startSession();
      setSessionId(response.sessionId);
      
      const welcomeMessage: ChatMessage = {
        type: 'assistant',
        message: response.message,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      const errorMessage: ChatMessage = {
        type: 'assistant',
        message: 'Sorry, I encountered an issue starting our conversation. Please refresh the page to try again.',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !sessionId || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setSuggestions([]);

    try {
      const response = await chatAPI.sendMessage(sessionId, message.trim());
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          type: 'assistant',
          message: response.message,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setSuggestions(response.suggestions || []);
        
        // Handle recommendations if received
        if (response.recommendations) {
          setRecommendations(response.recommendations);
          onRecommendationsReceived?.(response.recommendations);
        }
        
        setIsLoading(false);
        setIsTyping(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        type: 'assistant',
        message: 'I apologize for the technical difficulty. Please try sending your message again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const resetChat = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const response = await chatAPI.resetSession(sessionId);
      
      const welcomeMessage: ChatMessage = {
        type: 'assistant',
        message: response.message,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setSuggestions(response.suggestions);
      setRecommendations(null);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to reset chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                Credit Card Advisor
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                AI-powered card recommendations
              </p>
            </div>
          </div>          
          <button
            onClick={resetChat}
            disabled={isLoading}
            className="btn btn-outline flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
            title="Start Over"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Start Over</span>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-bubble ${
                message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.message}
              </p>
              <p className={`text-xs mt-1 opacity-70 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}        {/* Suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 justify-center px-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="btn btn-outline text-xs sm:text-sm py-1 px-2 sm:px-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recommendations Section */}
      {recommendations && (
        <div className="border-t border-gray-200 bg-white">
          <RecommendationCards recommendations={recommendations} />
        </div>
      )}      {/* Input Section */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
        <div className="flex items-end space-x-2 sm:space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="input-field resize-none text-sm sm:text-base"
              maxLength={500}
            />
          </div>
          
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={isLoading || !inputMessage.trim()}
            className="btn btn-primary flex items-center justify-center w-10 h-10 sm:w-12 sm:h-10 flex-shrink-0"
            title="Send Message"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Press Enter to send</span>
          <span className="sm:hidden">Press Enter</span>
          <span className="tabular-nums">{inputMessage.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
