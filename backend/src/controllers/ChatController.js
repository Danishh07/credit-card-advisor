import { v4 as uuidv4 } from 'uuid';
import UserSessionModel from '../models/UserSessionModel.js';
import OpenAIService from '../utils/OpenAIService.js';
import MockAIService from '../utils/MockAIService.js';
import MultiAIService from '../utils/MultiAIService.js';
import RecommendationEngine from '../utils/RecommendationEngine.js';

/**
 * Chat Controller for handling conversational interactions
 * Manages user sessions, AI responses, and recommendation flow
 */
class ChatController {
  constructor() {
    this.sessionModel = new UserSessionModel();
    this.openAIService = new OpenAIService();
    this.mockAIService = new MockAIService();
    this.multiAIService = new MultiAIService();
    this.recommendationEngine = new RecommendationEngine();
    
    this.useMultiAI = true;
    this.usingFallback = false;
    
    this.initializeAIServices();
    
    // Clean up old sessions every hour
    setInterval(() => {
      this.sessionModel.cleanupOldSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Initialize AI services and check availability
   */
  async initializeAIServices() {
    try {
      await this.multiAIService.initialize();
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      this.useMultiAI = false;
    }
  }

  /**
   * Get the appropriate AI service based on configuration and availability
   * @returns {Object} AI service instance
   */
  async getAIService() {
    if (this.useMultiAI) {
      return this.multiAIService;
    }
    this.usingFallback = true;
    return this.mockAIService;
  }

  /**
   * Start a new chat session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  startSession = async (req, res) => {
    try {
      const sessionId = uuidv4();
      const session = this.sessionModel.createSession(sessionId);
      
      const welcomeResponse = await this.generateAIResponse(
        [],
        session.userProfile,
        'greeting'
      );

      this.sessionModel.addChatMessage(sessionId, {
        type: 'assistant',
        message: welcomeResponse.message
      });

      res.status(201).json({
        sessionId,
        message: welcomeResponse.message,
        suggestions: welcomeResponse.suggestions,
        session: {
          currentStep: session.currentStep,
          isProfileComplete: session.isProfileComplete
        }
      });
    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({
        error: 'Failed to start chat session',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Send a message in an existing chat session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendMessage = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message is required',
          message: 'Please provide a message'
        });
      }

      let session = this.sessionModel.getSession(sessionId);
      if (!session) {
        session = this.sessionModel.createSession(sessionId);
      }

      this.sessionModel.addChatMessage(sessionId, {
        type: 'user',
        message: message.trim()
      });

      await this.processUserMessage(sessionId, message, session.currentStep);
      session = this.sessionModel.getSession(sessionId);

      // Check if ready for recommendations
      if (session.isProfileComplete && !session.recommendations) {
        const recommendations = this.recommendationEngine.generateRecommendations(session.userProfile);
        this.sessionModel.setRecommendations(sessionId, recommendations);
        
        const explanation = await this.generateRecommendationExplanation(
          recommendations,
          session.userProfile
        );

        this.sessionModel.addChatMessage(sessionId, {
          type: 'assistant',
          message: explanation
        });

        return res.json({
          message: explanation,
          recommendations,
          session: {
            currentStep: 'recommendations_ready',
            isProfileComplete: session.isProfileComplete
          },
          suggestions: ['Show me more details', 'Compare these cards', 'Find different options']
        });
      }

      const aiResponse = await this.generateAIResponse(
        session.chatHistory,
        session.userProfile,
        session.currentStep
      );

      this.sessionModel.addChatMessage(sessionId, {
        type: 'assistant',
        message: aiResponse.message
      });

      this.sessionModel.updateSession(sessionId, {
        currentStep: aiResponse.nextStep
      });

      res.json({
        message: aiResponse.message,
        suggestions: aiResponse.suggestions,
        session: {
          currentStep: aiResponse.nextStep,
          isProfileComplete: session.isProfileComplete
        }
      });

    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: 'I apologize for the technical difficulty. Please try again.'
      });
    }
  };

  /**
   * Process user message and extract relevant data
   * @param {string} sessionId - Session ID
   * @param {string} message - User message
   * @param {string} currentStep - Current conversation step
   */
  async processUserMessage(sessionId, message, currentStep) {
    try {
      let extractedData = null;

      switch (currentStep) {
        case 'greeting':
          extractedData = await this.extractIncomeData(message);
          if (extractedData) {
            this.sessionModel.updateUserProfile(sessionId, {
              monthlyIncome: extractedData
            });
          }
          break;

        case 'income':
          extractedData = await this.extractIncomeData(message);
          if (extractedData) {
            this.sessionModel.updateUserProfile(sessionId, {
              monthlyIncome: extractedData
            });
          }
          break;

        case 'creditScore':
          extractedData = await this.extractCreditScoreData(message);
          if (extractedData) {
            this.sessionModel.updateUserProfile(sessionId, {
              creditScore: extractedData
            });
          }
          break;

        case 'spending':
          extractedData = await this.extractSpendingData(message);
          if (extractedData) {
            this.sessionModel.updateUserProfile(sessionId, {
              spendingHabits: extractedData
            });
          }
          break;

        case 'preferences':
          extractedData = await this.extractPreferencesData(message);
          if (extractedData) {
            this.sessionModel.updateUserProfile(sessionId, {
              preferences: extractedData
            });
          }
          break;

        case 'annualFee':
          extractedData = await this.extractAnnualFeeData(message);
          if (extractedData !== null) {
            this.sessionModel.updateUserProfile(sessionId, {
              preferences: { maxAnnualFee: extractedData }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing user message:', error);
    }
  }

  /**
   * Extract income information from user message
   * @param {string} message - User message
   * @returns {number|null} Extracted income amount
   */
  async extractIncomeData(message) {
    let amount = null;
    
    // Look for numbers followed by currency indicators
    let match = message.match(/(\d{1,6})\s*(?:rupees?|rs|₹)/i);
    if (match) {
      amount = parseInt(match[1]);
    }
    
    // Look for ₹ followed by numbers
    if (!amount) {
      match = message.match(/₹\s*(\d{1,6})/i);
      if (match) {
        amount = parseInt(match[1]);
      }
    }
    
    // Look for numbers with "k" or "thousand"
    if (!amount) {
      match = message.match(/(\d{1,3})\s*(?:k|thousand)/i);
      if (match) {
        amount = parseInt(match[1]) * 1000;
      }
    }
    
    // Look for numbers with "lakh"
    if (!amount) {
      match = message.match(/(\d{1,2})\s*lakh/i);
      if (match) {
        amount = parseInt(match[1]) * 100000;
      }
    }
    
    // Look for any 4-6 digit number as last resort
    if (!amount) {
      match = message.match(/\b(\d{4,6})\b/);
      if (match) {
        amount = parseInt(match[1]);
      }
    }
    
    // Validate range
    if (amount && amount >= 15000 && amount <= 10000000) {
      return amount;
    }
    
    return null;
  }

  /**
   * Extract credit score from user message
   * @param {string} message - User message
   * @returns {number|string|null} Extracted credit score
   */
  async extractCreditScoreData(message) {
    // Handle "don't know" cases
    if (message.toLowerCase().includes("don't know") || 
        message.toLowerCase().includes("unknown") ||
        message.toLowerCase().includes("not sure") ||
        message.toLowerCase().includes("no idea")) {
      return 'unknown';
    }
    
    // Handle descriptive scores
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('excellent') || lowerMessage.includes('very good')) {
      return 800;
    } else if (lowerMessage.includes('good')) {
      return 700;
    } else if (lowerMessage.includes('fair') || lowerMessage.includes('average')) {
      return 600;
    } else if (lowerMessage.includes('poor') || lowerMessage.includes('bad')) {
      return 500;
    }
    
    // Extract numeric score
    const scorePatterns = [
      /\b(\d{3})\b/g,
      /score.*?(\d{3})/gi,
      /around.*?(\d{3})/gi,
      /(\d{3}).*?range/gi
    ];
    
    for (const pattern of scorePatterns) {
      const matches = message.match(pattern);
      if (matches) {
        const score = parseInt(matches[0].match(/\d{3}/)[0]);
        if (score >= 300 && score <= 900) {
          return score;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract spending habits from user message
   * @param {string} message - User message
   * @returns {Object|null} Extracted spending data
   */
  async extractSpendingData(message) {
    const spendingData = {};
    const categories = ['dining', 'travel', 'fuel', 'groceries', 'online'];
    
    categories.forEach(category => {
      const regex = new RegExp(`${category}[^\\d]*₹?\\s*(\\d{1,3}(?:,\\d{3})*|\\d+)`, 'i');
      const match = message.match(regex);
      
      if (match) {
        let amount = parseInt(match[1].replace(/,/g, ''));
        spendingData[category] = amount;
      }
    });
    
    // Look for general amounts without specific categories
    const generalAmountRegex = /₹?\s*(\d{1,3}(?:,\d{3})*|\d+)/g;
    const amounts = message.match(generalAmountRegex);
    
    if (amounts && Object.keys(spendingData).length === 0) {
      const amount = parseInt(amounts[0].replace(/[₹,]/g, ''));
      spendingData.default = amount;
    }
    
    return Object.keys(spendingData).length > 0 ? spendingData : null;
  }

  /**
   * Extract preferences from user message
   * @param {string} message - User message
   * @returns {Object|null} Extracted preferences
   */
  async extractPreferencesData(message) {
    const preferences = {};
    
    if (message.toLowerCase().includes('cashback')) {
      preferences.rewardType = 'Cashback';
    } else if (message.toLowerCase().includes('points') || message.toLowerCase().includes('travel')) {
      preferences.rewardType = 'Points';
    }
    
    const benefits = [];
    if (message.toLowerCase().includes('lounge')) benefits.push('lounge');
    if (message.toLowerCase().includes('travel')) benefits.push('travel');
    if (message.toLowerCase().includes('dining')) benefits.push('dining');
    if (message.toLowerCase().includes('fuel')) benefits.push('fuel');
    
    if (benefits.length > 0) {
      preferences.benefits = benefits;
    }
    
    return Object.keys(preferences).length > 0 ? preferences : null;
  }

  /**
   * Extract annual fee preference from user message
   * @param {string} message - User message
   * @returns {number|null} Extracted annual fee preference
   */
  async extractAnnualFeeData(message) {
    if (message.toLowerCase().includes('free') || message.toLowerCase().includes('no fee')) {
      return 0;
    }
    
    const feeRegex = /₹?\s*(\d{1,3}(?:,\d{3})*|\d+)/g;
    const matches = message.match(feeRegex);
    
    if (matches) {
      return parseInt(matches[0].replace(/[₹,]/g, ''));
    }
    
    return null;
  }

  /**
   * Get session details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSession = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = this.sessionModel.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Please start a new chat session'
        });
      }

      res.json({
        session: {
          id: session.id,
          currentStep: session.currentStep,
          isProfileComplete: session.isProfileComplete,
          chatHistory: session.chatHistory,
          userProfile: session.userProfile,
          recommendations: session.recommendations
        }
      });
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        error: 'Failed to retrieve session',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Reset chat session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetSession = async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      this.sessionModel.deleteSession(sessionId);
      const newSession = this.sessionModel.createSession(sessionId);
      
      const welcomeResponse = await this.openAIService.generateResponse(
        [],
        newSession.userProfile,
        'greeting'
      );

      this.sessionModel.addChatMessage(sessionId, {
        type: 'assistant',
        message: welcomeResponse.message
      });

      res.json({
        message: welcomeResponse.message,
        suggestions: welcomeResponse.suggestions,
        session: {
          currentStep: newSession.currentStep,
          isProfileComplete: newSession.isProfileComplete
        }
      });
    } catch (error) {
      console.error('Error resetting session:', error);
      res.status(500).json({
        error: 'Failed to reset session',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Get session statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getStats = async (req, res) => {
    try {
      const stats = this.sessionModel.getSessionStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Generate AI response with fallback handling
   * @param {Array} chatHistory - Chat history
   * @param {Object} userProfile - User profile
   * @param {string} currentStep - Current step
   * @returns {Object} AI response
   */
  async generateAIResponse(chatHistory, userProfile, currentStep) {
    try {
      const aiService = await this.getAIService();
      return await aiService.generateResponse(chatHistory, userProfile, currentStep);
    } catch (error) {
      console.error('AI Service Error:', error.message);
      
      // Fallback to mock service
      return await this.mockAIService.generateResponse(chatHistory, userProfile, currentStep);
    }
  }

  /**
   * Generate recommendation explanation with fallback
   * @param {Array} recommendations - Recommended cards
   * @param {Object} userProfile - User profile
   * @returns {string} Explanation text
   */
  async generateRecommendationExplanation(recommendations, userProfile) {
    try {
      const aiService = await this.getAIService();
      if (aiService.generateRecommendationExplanation) {
        return await aiService.generateRecommendationExplanation(recommendations, userProfile);
      } else {
        return `Based on your profile, I've found ${recommendations.length} excellent credit cards that match your needs! These cards offer great rewards for your spending pattern and fit within your preferences.`;
      }
    } catch (error) {
      return `Perfect! I've analyzed your spending habits and found ${recommendations.length} ideal credit cards for you. These recommendations are tailored to maximize your rewards and benefits!`;
    }
  }
}

export default ChatController;
