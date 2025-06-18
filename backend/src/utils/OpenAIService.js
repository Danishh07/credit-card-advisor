import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OpenAI Service for handling conversational AI interactions
 */
class OpenAIService {
  constructor() {
    // Only initialize if API key is available
    this.apiKeyAvailable = !!process.env.OPENAI_API_KEY;
    
    if (this.apiKeyAvailable) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        this.apiKeyAvailable = false;
      }
    } else {
      console.warn('OpenAI API key not found - OpenAI service will be unavailable');
    }
    
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
   * Check if the OpenAI service is available
   * @returns {boolean} True if the service is available
   */
  async isAvailable() {
    return this.apiKeyAvailable;
  }
  
  /**
   * Generate AI response based on conversation context
   */  async generateResponse(chatHistory, userProfile, currentStep) {
    try {
      // Check if API key is available
      if (!this.apiKeyAvailable) {
        throw new Error('OpenAI API key not available');
      }
      
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.formatChatHistory(chatHistory),
        { role: 'system', content: this.getContextPrompt(userProfile, currentStep) }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseMessage = completion.choices[0].message.content;
      
      return {
        message: responseMessage,
        nextStep: this.determineNextStep(userProfile, currentStep),
        suggestions: this.generateSuggestions(currentStep)
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Check if it's a quota/billing error and use fallback
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.log('📢 OpenAI quota exceeded, using fallback responses...');
        
        // Simple fallback responses
        const fallbackMessages = {
          greeting: "Hello! I'm your credit card advisor. To help you find the perfect card, let's start with your monthly income. What's your approximate monthly income?",
          income: "Great! Now, what's your credit score range? (300-900, or just say 'I don't know')",
          creditScore: "Perfect! Let's talk about spending. How much do you spend monthly on dining and restaurants?",
          spending: "Excellent! What about travel and fuel expenses per month?",
          preferences: "Almost done! Do you prefer cashback, travel points, or premium benefits?",
          complete: "Perfect! I have all the details. Let me find the best credit cards for your profile!"
        };
        
        const message = fallbackMessages[currentStep] || fallbackMessages.greeting;
        
        return {
          message: message,
          nextStep: this.determineNextStep(userProfile, currentStep),
          suggestions: this.generateSuggestions(currentStep)
        };
      }
      
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Format chat history for OpenAI API
   */
  formatChatHistory(chatHistory) {
    return chatHistory.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));
  }

  /**
   * Generate context prompt based on current state
   */
  getContextPrompt(userProfile, currentStep) {
    let context = `Current user profile: ${JSON.stringify(userProfile, null, 2)}\n`;
    context += `Current conversation step: ${currentStep}\n`;
    
    const missingInfo = this.getMissingInformation(userProfile);
    if (missingInfo.length > 0) {
      context += `Missing information: ${missingInfo.join(', ')}\n`;
      context += `Focus on asking about the next missing piece of information naturally.\n`;
    } else {
      context += `Profile is complete! Ready to provide recommendations.\n`;
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
   * Generate quick response suggestions for user
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
   * Extract structured data from user message using AI
   */
  async extractUserData(userMessage, expectedType) {
    try {
      const extractionPrompts = {
        income: `Extract monthly income from: "${userMessage}". Return only the number in rupees, or null if unclear.`,
        creditScore: `Extract credit score from: "${userMessage}". Return the score (300-900) or "unknown" if user doesn't know.`,
        spending: `Extract spending amounts by category from: "${userMessage}". Return JSON with categories and amounts in rupees.`,
        preferences: `Extract credit card preferences from: "${userMessage}". Return JSON with rewardType and benefits array.`
      };      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
          { role: 'system', content: 'You are a data extraction assistant. Return only the requested data in the specified format.' },
          { role: 'user', content: extractionPrompts[expectedType] }
        ],
        max_tokens: 150,
        temperature: 0.1,
      });

      const extractedData = completion.choices[0].message.content.trim();
      
      try {
        return JSON.parse(extractedData);
      } catch {
        return extractedData;
      }
    } catch (error) {
      console.error('Data extraction error:', error);
      
      // Simple fallback extraction
      if (error.code === 'insufficient_quota' || error.status === 429) {
        return this.extractDataFallback(userMessage, expectedType);
      }
      
      return null;
    }
  }

  /**
   * Fallback data extraction when OpenAI is unavailable
   */
  extractDataFallback(userMessage, expectedType) {
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
   * Generate explanation for card recommendations
   */
  async generateRecommendationExplanation(recommendedCards, userProfile) {
    try {
      const prompt = `Based on this user profile: ${JSON.stringify(userProfile, null, 2)}

And these recommended cards: ${JSON.stringify(recommendedCards.map(card => ({
  name: card.name,
  bank: card.bank,
  rewards: card.rewards,
  fees: card.fees,
  benefits: card.benefits
})), null, 2)}

Write a personalized explanation of why these cards are recommended. Include:
1. Why the top card is the best fit
2. Expected annual rewards/savings
3. Key benefits they'll enjoy
4. Why the cards are ranked in this order

Keep it conversational and enthusiastic. Use ₹ for amounts.`;      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
          { role: 'system', content: 'You are a helpful credit card advisor providing personalized recommendations.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Recommendation explanation error:', error);
      
      // Fallback explanation
      if (error.code === 'insufficient_quota' || error.status === 429) {
        const income = userProfile.monthlyIncome || 50000;
        const topCard = recommendedCards[0];
        
        return `Based on your monthly income of ₹${income.toLocaleString('en-IN')} and spending patterns, here are my top recommendations:

🎯 **${topCard.name}** is my #1 pick for you because:
• Perfect match for your income range
• Excellent rewards on your spending categories  
• ${topCard.rewards?.dining || 1}% cashback on dining
• ${topCard.rewards?.fuel || 1}% rewards on fuel
• Great value for money

💰 **Expected Benefits:**
• Potential annual savings: ₹${Math.floor(income * 0.02).toLocaleString('en-IN')}
• Premium benefits and rewards

These cards are ranked based on maximum value for your specific profile. Ready to explore the detailed features?`;
      }
      
      return 'Based on your profile, here are the best credit cards for you!';
    }
  }
}

export default OpenAIService;
