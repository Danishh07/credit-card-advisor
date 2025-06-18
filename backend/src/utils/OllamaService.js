/**
 * Ollama Service for handling local AI interactions
 * Free alternative to OpenAI using local models
 */
class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2:7b';
    
    this.systemPrompt = `You are a friendly and knowledgeable credit card advisor specializing in Indian credit cards. Your goal is to help users find the perfect credit card based on their financial profile and spending habits.

**Your Personality:**
- Friendly, professional, and trustworthy
- Ask one question at a time to avoid overwhelming users
- Provide clear explanations for your recommendations
- Use Indian currency (₹) and context throughout

**Conversation Flow:**
1. Greet the user warmly and explain your purpose
2. Ask about monthly income (essential for eligibility)
3. Ask about approximate credit score (300-900 range, or allow "I don't know")
4. Ask about spending habits in different categories:
   - Dining & restaurants
   - Travel & transportation  
   - Fuel expenses
   - Groceries & daily shopping
   - Entertainment & shopping
5. Ask about preferences:
   - Reward type preference (cashback, travel points, benefits)
   - Annual fee tolerance
   - Preferred bank (if any)
   - Special benefits importance

**Key Guidelines:**
- Keep responses conversational and under 3-4 sentences
- Ask follow-up questions naturally
- Be encouraging and positive
- Explain technical terms in simple language
- Use examples relevant to Indian context

Remember: Be conversational, not robotic. Show empathy and understanding.`;
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      return response.ok;
    } catch (error) {
      console.log('Ollama not available:', error.message);
      return false;
    }
  }

  /**
   * Generate AI response using Ollama
   */
  async generateResponse(chatHistory, userProfile, currentStep) {
    try {
      // Check if Ollama is available
      if (!(await this.isAvailable())) {
        throw new Error('Ollama service not available');
      }

      const context = this.buildContext(userProfile, currentStep);
      const conversationHistory = this.formatChatHistory(chatHistory);
      
      const prompt = `${this.systemPrompt}

${context}

${conversationHistory}

Respond as a helpful credit card advisor. Keep it conversational and ask the next logical question.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9,
            num_predict: 150
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.response.trim();

      return {
        message: aiMessage,
        nextStep: this.determineNextStep(userProfile, currentStep),
        suggestions: this.generateSuggestions(currentStep)
      };

    } catch (error) {
      console.error('Ollama Service Error:', error);
      throw new Error('Failed to generate AI response with Ollama');
    }
  }

  /**
   * Format chat history for Ollama
   */
  formatChatHistory(chatHistory) {
    return chatHistory.slice(-6).map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.message}`
    ).join('\n');
  }

  /**
   * Build context for the AI
   */
  buildContext(userProfile, currentStep) {
    let context = `Current conversation step: ${currentStep}\n`;
    
    if (userProfile.monthlyIncome) {
      context += `User's monthly income: ₹${userProfile.monthlyIncome.toLocaleString('en-IN')}\n`;
    }
    
    if (userProfile.creditScore) {
      context += `Credit score: ${userProfile.creditScore}\n`;
    }
    
    const spendingHabits = userProfile.spendingHabits || {};
    const hasSpending = Object.values(spendingHabits).some(amount => amount > 0);
    if (hasSpending) {
      context += `Spending habits: ${JSON.stringify(spendingHabits)}\n`;
    }
    
    if (userProfile.preferences?.rewardType) {
      context += `Preferences: ${userProfile.preferences.rewardType}\n`;
    }

    const missingInfo = this.getMissingInformation(userProfile);
    if (missingInfo.length > 0) {
      context += `Still needed: ${missingInfo.join(', ')}\n`;
    }

    return context;
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
        throw new Error('Ollama service not available');
      }

      const income = userProfile.monthlyIncome || 50000;
      const topCard = recommendedCards[0];

      const prompt = `As a credit card advisor, explain why these cards are recommended for a user with monthly income ₹${income.toLocaleString('en-IN')}:

Top recommendation: ${topCard.cardName} from ${topCard.bank}
Card features: ${JSON.stringify(topCard.rewards)}

Write a brief, enthusiastic explanation focusing on:
1. Why this card is perfect for them
2. Expected benefits
3. How it matches their profile

Keep it under 100 words and use ₹ for amounts.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 120
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response.trim();

    } catch (error) {
      console.error('Ollama recommendation explanation error:', error);
      
      // Fallback explanation
      const income = userProfile.monthlyIncome || 50000;
      const topCard = recommendedCards[0];
      
      return `🎯 **${topCard.cardName}** is perfect for your ₹${income.toLocaleString('en-IN')} monthly income! 

This card offers excellent rewards on your spending categories and provides great value for money. You can expect significant annual savings with ${topCard.bank}'s premium benefits.

Ready to explore the detailed features of your recommended cards?`;
    }
  }
}

export default OllamaService;