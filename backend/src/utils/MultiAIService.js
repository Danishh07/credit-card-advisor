import OpenAIService from './OpenAIService.js';
import OllamaService from './OllamaService.js';
import HuggingFaceService from './HuggingFaceService.js';
import MockAIService from './MockAIService.js';

/**
 * Multi-AI Service Provider
 * Automatically switches between available free AI services
 */
class MultiAIService {
  constructor() {
    this.services = {
      ollama: new OllamaService(),
      huggingface: new HuggingFaceService(),
      openai: new OpenAIService(),
      mock: new MockAIService()
    };
      // Get preference order from environment or use default
    const envPreference = process.env.AI_SERVICES;
    
    this.preferenceOrder = envPreference 
      ? envPreference.split(',').map(s => s.trim().toLowerCase())
      : [
        'mock',        // Always available fallback - put first in production without API keys
        'ollama',      // Free, local, no API costs
        'huggingface', // Free tier available
        'openai',      // Fallback to original
      ];
    
    this.currentService = null;
    this.availableServices = [];
  }
  /**
   * Initialize and check available services
   */
  async initialize() {
    console.log('🔍 Checking available AI services...');
    
    // Always add MockAI as a fallback
    this.availableServices.push('mock');
    console.log(`✅ MOCK service available (always available as fallback)`);
    
    for (const serviceName of this.preferenceOrder) {
      if (serviceName === 'mock') continue; // Already added above
      
      const service = this.services[serviceName];
      
      try {
        // Check if service has isAvailable method
        if (service.isAvailable) {
          const isAvailable = await service.isAvailable();
          if (isAvailable) {
            this.availableServices.push(serviceName);
            console.log(`✅ ${serviceName.toUpperCase()} service available`);
          } else {
            console.log(`❌ ${serviceName.toUpperCase()} service not available`);
          }
        } else {
          // For services without availability check
          this.availableServices.push(serviceName);
          console.log(`✅ ${serviceName.toUpperCase()} service available (no check method)`);
        }
      } catch (error) {
        console.log(`❌ ${serviceName.toUpperCase()} service failed: ${error.message}`);
      }
    }

    // Set the current service to the first available one
    if (this.availableServices.length > 0) {
      this.currentService = this.availableServices[0];
      console.log(`🎯 Using ${this.currentService.toUpperCase()} as primary AI service`);
    } else {
      this.currentService = 'mock';
      console.log('🔄 Falling back to MockAI service');
    }

    return this.currentService;
  }

  /**
   * Get the current active service
   */
  getCurrentService() {
    return this.services[this.currentService];
  }

  /**
   * Switch to next available service
   */
  async switchToNextService() {
    const currentIndex = this.availableServices.indexOf(this.currentService);
    const nextIndex = (currentIndex + 1) % this.availableServices.length;
    
    this.currentService = this.availableServices[nextIndex];
    console.log(`🔄 Switched to ${this.currentService.toUpperCase()} service`);
    
    return this.currentService;
  }

  /**
   * Generate AI response with automatic fallback
   */
  async generateResponse(chatHistory, userProfile, currentStep) {
    let lastError = null;
    
    // Try current service first
    try {
      const service = this.getCurrentService();
      console.log(`🤖 Generating response with ${this.currentService.toUpperCase()}`);
      
      const response = await service.generateResponse(chatHistory, userProfile, currentStep);
      console.log(`✅ Response generated successfully with ${this.currentService.toUpperCase()}`);
      
      return {
        ...response,
        aiProvider: this.currentService
      };
    } catch (error) {
      console.log(`❌ ${this.currentService.toUpperCase()} failed: ${error.message}`);
      lastError = error;
    }

    // Try other available services
    for (const serviceName of this.availableServices) {
      if (serviceName === this.currentService) continue; // Skip already tried service
      
      try {
        console.log(`🔄 Trying ${serviceName.toUpperCase()} as fallback...`);
        const service = this.services[serviceName];
        
        const response = await service.generateResponse(chatHistory, userProfile, currentStep);
        console.log(`✅ Fallback successful with ${serviceName.toUpperCase()}`);
        
        // Update current service to the working one
        this.currentService = serviceName;
        
        return {
          ...response,
          aiProvider: serviceName
        };
      } catch (error) {
        console.log(`❌ ${serviceName.toUpperCase()} also failed: ${error.message}`);
        lastError = error;
      }
    }

    // If all services fail, throw the last error
    throw lastError || new Error('All AI services unavailable');
  }

  /**
   * Generate recommendation explanation with fallback
   */
  async generateRecommendationExplanation(recommendedCards, userProfile) {
    let lastError = null;
    
    // Try current service first
    try {
      const service = this.getCurrentService();
      
      if (service.generateRecommendationExplanation) {
        const explanation = await service.generateRecommendationExplanation(recommendedCards, userProfile);
        return explanation;
      }
    } catch (error) {
      console.log(`❌ Recommendation explanation failed with ${this.currentService.toUpperCase()}: ${error.message}`);
      lastError = error;
    }

    // Try other services
    for (const serviceName of this.availableServices) {
      if (serviceName === this.currentService) continue;
      
      try {
        const service = this.services[serviceName];
        
        if (service.generateRecommendationExplanation) {
          const explanation = await service.generateRecommendationExplanation(recommendedCards, userProfile);
          return explanation;
        }
      } catch (error) {
        console.log(`❌ Recommendation explanation failed with ${serviceName.toUpperCase()}: ${error.message}`);
        lastError = error;
      }
    }

    // Fallback to simple explanation
    const income = userProfile.monthlyIncome || 50000;
    const topCard = recommendedCards[0];
    
    return `🎯 **${topCard.cardName}** is perfect for your ₹${income.toLocaleString('en-IN')} monthly income! 

Based on your profile, I've found ${recommendedCards.length} excellent credit cards that match your needs. These recommendations are tailored to maximize your rewards and benefits.

Ready to explore the detailed features of your recommended cards?`;
  }

  /**
   * Get service status information
   */
  getServiceStatus() {
    return {
      currentService: this.currentService,
      availableServices: this.availableServices,
      totalServices: Object.keys(this.services).length
    };
  }

  /**
   * Force switch to a specific service
   */
  async forceService(serviceName) {
    if (this.services[serviceName]) {
      this.currentService = serviceName;
      console.log(`🎯 Forced switch to ${serviceName.toUpperCase()} service`);
      return true;
    }
    return false;
  }
}

export default MultiAIService;
