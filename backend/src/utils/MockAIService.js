/**
 * Mock AI Service for testing when OpenAI quota is exceeded
 */
class MockAIService {
  constructor() {
    this.responses = {
      greeting: [
        "Hello! I'm your personal credit card advisor. I'll help you find the perfect credit card based on your needs and spending habits. To get started, could you tell me your approximate monthly income?",
        "Hi there! Welcome to Credit Card Advisor. I'm here to help you discover the best credit cards for your lifestyle. Let's begin - what's your monthly income range?",
        "Namaste! I'm excited to help you find the ideal credit card. To provide personalized recommendations, I'd like to know about your monthly income first."
      ],
      income: [
        "Great! Now, do you know your credit score? It typically ranges from 300-900. If you're not sure, that's perfectly fine - just let me know!",
        "Perfect! Next, I'd like to understand your credit profile. What's your approximate credit score, or would you say it's excellent, good, or fair?",
        "Thank you! Credit score is important for card eligibility. Do you know your current credit score, or should we proceed assuming a good credit profile?"
      ],
      creditScore: [
        "Excellent! Now let's talk about your spending habits. How much do you typically spend on dining and restaurants each month?",
        "Perfect! Understanding your spending patterns will help me recommend the best rewards cards. What's your monthly spending on food and dining?",
        "Great! Let's dive into your spending categories. Starting with dining - how much do you usually spend at restaurants and cafes monthly?"
      ],
      spending: [
        "That's helpful! What about travel and transportation expenses? This includes flights, hotels, fuel, metro, uber, etc.",
        "Thanks! Now for travel expenses - including flights, hotels, fuel for your car, and daily transportation. What's your monthly spending here?",
        "Good to know! Next category is travel and transport. How much do you spend monthly on fuel, flights, hotel bookings, and commuting?"
      ],
      preferences: [
        "Almost done! What type of rewards do you prefer - cashback, travel points, or specific benefits like airport lounge access?",
        "Perfect! Last question - what matters most to you: earning cashback, collecting reward points for travel, or premium benefits like lounge access?",
        "Excellent! Finally, what's your preference: cash rewards, travel benefits, or luxury perks like concierge services and lounge access?"
      ],
      complete: [
        "Fantastic! I have all the information I need. Based on your profile, I'll now analyze our database of 20+ Indian credit cards and find the perfect matches for you. Let me generate your personalized recommendations!",
        "Perfect! I've gathered all your details. I'm now processing your profile against our comprehensive database of Indian credit cards to find the best options for your needs. Your recommendations are coming up!",
        "Excellent! With your complete profile, I can now match you with the most suitable credit cards from our extensive collection of Indian banks. Preparing your personalized recommendations..."
      ]
    };

    this.conversations = new Map();
  }

  /**
   * Generate mock AI response
   */
  async generateResponse(chatHistory, userProfile, currentStep) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stepResponses = this.responses[currentStep] || this.responses.greeting;
      const randomResponse = stepResponses[Math.floor(Math.random() * stepResponses.length)];

      return {
        message: randomResponse,
        nextStep: this.determineNextStep(userProfile, currentStep),
        suggestions: this.generateSuggestions(currentStep)
      };
    } catch (error) {
      console.error('Mock AI Service Error:', error);
      throw new Error('Failed to generate AI response');
    }
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
   * Check what information is missing
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
   * Generate quick response suggestions
   */
  generateSuggestions(currentStep) {
    const suggestions = {
      greeting: [
        "I'd like to find a credit card",
        "Help me choose the best card",
        "I want cashback cards"
      ],
      income: [
        "₹30,000 per month",
        "₹50,000 per month",
        "₹1,00,000 per month",
        "₹2,00,000 per month"
      ],
      creditScore: [
        "750-800 (Excellent)",
        "650-750 (Good)",
        "I don't know my score"
      ],
      spending: [
        "₹5,000 on dining",
        "₹10,000 on fuel",
        "₹15,000 on groceries",
        "₹20,000 on travel"
      ],
      preferences: [
        "I prefer cashback",
        "I want travel points", 
        "Airport lounge access is important",
        "No annual fee cards only"
      ]
    };

    return suggestions[currentStep] || [];
  }

  /**
   * Extract user data from message (mock implementation)
   */
  async extractUserData(userMessage, expectedType) {
    // Simple mock extraction
    const lowerMessage = userMessage.toLowerCase();
    
    switch (expectedType) {
      case 'income':
        const incomeMatch = userMessage.match(/₹?(\d{1,3}(?:,\d{3})*)/);
        return incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : null;
        
      case 'creditScore':
        if (lowerMessage.includes("don't know") || lowerMessage.includes("unknown")) {
          return "unknown";
        }
        const scoreMatch = userMessage.match(/(\d{3})/);
        return scoreMatch ? parseInt(scoreMatch[1]) : null;
        
      case 'spending':
        const amounts = userMessage.match(/₹?(\d{1,3}(?:,\d{3})*)/g);
        return amounts ? { dining: parseInt(amounts[0].replace(/₹|,/g, '')) } : null;
        
      case 'preferences':
        if (lowerMessage.includes('cashback')) return { rewardType: 'cashback' };
        if (lowerMessage.includes('travel')) return { rewardType: 'travel' };
        if (lowerMessage.includes('lounge')) return { rewardType: 'benefits' };
        return { rewardType: 'cashback' };
        
      default:
        return null;
    }
  }

  /**
   * Generate mock recommendation explanation
   */
  async generateRecommendationExplanation(recommendedCards, userProfile) {
    const income = userProfile.monthlyIncome || 50000;
    const topCard = recommendedCards[0];
    
    return `Based on your monthly income of ₹${income.toLocaleString('en-IN')} and spending patterns, here are my top recommendations:

🎯 **${topCard.name}** is my #1 pick for you because:
• Perfect match for your income range
• Excellent rewards on your spending categories  
• ${topCard.rewards.dining}% cashback on dining
• ${topCard.rewards.fuel}% rewards on fuel
• Annual fee of ₹${topCard.fees.annual.toLocaleString('en-IN')} is justified by benefits

💰 **Expected Benefits:**
• Potential annual savings: ₹${Math.floor(income * 0.02).toLocaleString('en-IN')}
• Premium benefits worth ₹${(topCard.fees.annual * 2).toLocaleString('en-IN')}

These cards are ranked based on maximum value for your specific profile. Ready to explore the detailed features?`;
  }
}

export default MockAIService;
