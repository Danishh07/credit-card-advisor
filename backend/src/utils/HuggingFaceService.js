/**
 * Hugging Face Service for handling AI interactions
 * Free alternative to OpenAI using Hugging Face models
 */
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.model = process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-large';
  }

  /**
   * Check if Hugging Face API is available
   */
  async isAvailable() {
    try {
      if (!this.apiKey) {
        console.log('Hugging Face API key not provided');
        return false;
      }
      
      // Test with a simple request
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "Hello",
          options: { wait_for_model: true }
        })
      });
      
      return response.ok || response.status === 503; // 503 means model is loading
    } catch (error) {
      console.log('Hugging Face not available:', error.message);
      return false;
    }
  }

  /**
   * Generate AI response using Hugging Face
   */
  async generateResponse(chatHistory, userProfile, currentStep) {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Hugging Face service not available');
      }

      const context = this.buildPrompt(userProfile, currentStep);
      const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].message : '';
      
      const prompt = `${context} User: ${lastMessage}`;

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true,
            max_length: 150,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      let aiMessage = '';
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        aiMessage = data[0].generated_text.replace(prompt, '').trim();
      } else if (data.generated_text) {
        aiMessage = data.generated_text.replace(prompt, '').trim();
      } else {
        throw new Error('Unexpected response format');
      }

      // Fallback to predefined responses if AI response is unclear
      if (!aiMessage || aiMessage.length < 10) {
        aiMessage = this.getFallbackResponse(currentStep);
      }

      return {
        message: aiMessage,
        nextStep: this.determineNextStep(userProfile, currentStep),
        suggestions: this.generateSuggestions(currentStep)
      };

    } catch (error) {
      console.error('Hugging Face Service Error:', error);
      throw new Error('Failed to generate AI response with Hugging Face');
    }
  }

  /**
   * Build context prompt
   */
  buildPrompt(userProfile, currentStep) {
    const stepPrompts = {
      greeting: "Welcome! I'm here to help you find the perfect Indian credit card. Let's start with your monthly income.",
      income: "Great! Now, what's your credit score range?",
      creditScore: "Perfect! Let's talk about your spending habits.",
      spending: "Excellent! What about your preferences?",
      preferences: "Almost done! Any specific benefits you prefer?"
    };

    return stepPrompts[currentStep] || stepPrompts.greeting;
  }

  /**
   * Get fallback response when AI fails
   */
  getFallbackResponse(currentStep) {
    const responses = {
      greeting: "Hello! I'm your credit card advisor. To help you find the perfect card, let's start with your monthly income. What's your approximate monthly income?",
      income: "Great! Now, what's your credit score range? (300-900, or just say 'I don't know')",
      creditScore: "Perfect! Let's talk about spending. How much do you spend monthly on dining and restaurants?",
      spending: "Excellent! What about travel and fuel expenses per month?",
      preferences: "Almost done! Do you prefer cashback, travel points, or premium benefits?"
    };

    return responses[currentStep] || responses.greeting;
  }

  /**
   * Determine what information is still needed
   */
  getMissingInformation(userProfile) {
    const missing = [];
    
    if (!userProfile.monthlyIncome) missing.push('monthly income');
    if (!userProfile.creditScore) missing.push('credit score');
    
    const hasSpending = Object.values(userProfile.spendingHabits || {}).some(amount => amount > 0);
    if (!hasSpending) missing.push('spending habits');
    
    if (!userProfile.preferences?.rewardType) missing.push('reward preference');
    
    return missing;
  }

  /**
   * Determine next conversation step
   */
  determineNextStep(userProfile, currentStep) {
    const missingInfo = this.getMissingInformation(userProfile);
    
    if (missingInfo.length === 0) {
      return 'complete';
    }

    const stepOrder = ['greeting', 'income', 'creditScore', 'spending', 'preferences'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    
    return 'complete';
  }

  /**
   * Generate quick response suggestions
   */
  generateSuggestions(currentStep) {
    const suggestions = {
      greeting: [
        "I'd like to find a new credit card",
        "Help me choose the best card",
        "I want cashback cards"
      ],
      income: [
        "₹30,000 per month",
        "₹50,000 per month", 
        "₹1,00,000 per month"
      ],
      creditScore: [
        "750-800",
        "I don't know my score",
        "Above 800"
      ],
      spending: [
        "₹5,000 on dining",
        "₹10,000 on fuel",
        "₹15,000 on groceries"
      ],
      preferences: [
        "I prefer cashback",
        "I want travel points",
        "Airport lounge access is important"
      ]
    };

    return suggestions[currentStep] || [];
  }

  /**
   * Generate explanation for recommendations
   */
  async generateRecommendationExplanation(recommendedCards, userProfile) {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Hugging Face service not available');
      }

      const income = userProfile.monthlyIncome || 50000;
      const topCard = recommendedCards[0];

      // Use simple template for recommendations
      return `🎯 **${topCard.cardName}** is perfect for your ₹${income.toLocaleString('en-IN')} monthly income! 

This card offers excellent rewards on your spending categories and provides great value for money. You can expect significant annual savings with ${topCard.bank}'s premium benefits.

Ready to explore the detailed features of your recommended cards?`;

    } catch (error) {
      console.error('Hugging Face recommendation explanation error:', error);
      
      // Fallback explanation
      const income = userProfile.monthlyIncome || 50000;
      const topCard = recommendedCards[0];
      
      return `Based on your monthly income of ₹${income.toLocaleString('en-IN')}, I've found excellent credit card options for you! The top recommendation offers great rewards and benefits tailored to your profile.`;
    }
  }
}

export default HuggingFaceService;
