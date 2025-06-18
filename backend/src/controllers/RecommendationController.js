import RecommendationEngine from '../utils/RecommendationEngine.js';
import UserSessionModel from '../models/UserSessionModel.js';
import OpenAIService from '../utils/OpenAIService.js';

/**
 * Recommendation Controller for handling card recommendations
 */
class RecommendationController {
  constructor() {
    this.recommendationEngine = new RecommendationEngine();
    this.sessionModel = new UserSessionModel();
    this.openAIService = new OpenAIService();
  }

  /**
   * Get personalized card recommendations based on user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRecommendations = async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get session if sessionId provided
      let userProfile = null;
      if (sessionId) {
        const session = this.sessionModel.getSession(sessionId);
        if (session && session.isProfileComplete) {
          userProfile = session.userProfile;
        }
      }

      // If no session, try to get profile from request body
      if (!userProfile) {
        userProfile = req.body.userProfile;
        
        if (!userProfile || !this.isValidProfile(userProfile)) {
          return res.status(400).json({
            error: 'Invalid user profile',
            message: 'Please provide a complete user profile or use a valid session ID'
          });
        }
      }

      // Generate recommendations
      const recommendations = this.recommendationEngine.generateRecommendations(userProfile);

      if (recommendations.length === 0) {
        return res.status(404).json({
          error: 'No recommendations found',
          message: 'No suitable credit cards found for your profile'
        });
      }

      // Generate AI explanation
      const explanation = await this.openAIService.generateRecommendationExplanation(
        recommendations,
        userProfile
      );

      // Update session with recommendations if sessionId provided
      if (sessionId) {
        this.sessionModel.setRecommendations(sessionId, recommendations);
      }

      res.json({
        success: true,
        explanation,
        userProfile: {
          monthlyIncome: userProfile.monthlyIncome,
          creditScore: userProfile.creditScore,
          preferences: userProfile.preferences
        },
        recommendations: recommendations.map(card => ({
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          cardImage: card.cardImage,
          annualFee: card.annualFee,
          rewardType: card.rewardType,
          score: card.score,
          estimatedAnnualReward: card.estimatedAnnualReward,
          netValue: card.netValue,
          reasonsToChoose: card.reasonsToChoose,
          applyLink: card.applyLink,
          category: card.category,
          specialPerks: card.specialPerks.slice(0, 3) // Top 3 perks
        }))
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Get recommendations by specific category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRecommendationsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const { userProfile } = req.body;

      const validCategories = ['cashback', 'travel', 'dining', 'fuel', 'premium', 'free'];
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }

      if (!userProfile || !this.isValidProfile(userProfile)) {
        return res.status(400).json({
          error: 'Invalid user profile',
          message: 'Please provide a complete user profile'
        });
      }

      const cards = this.recommendationEngine.getCardsByCategory(category, userProfile);

      if (cards.length === 0) {
        return res.status(404).json({
          error: 'No cards found',
          message: `No ${category} cards found matching your profile`
        });
      }

      res.json({
        success: true,
        category: category.toLowerCase(),
        count: cards.length,
        data: cards.slice(0, 10) // Return top 10 cards
      });
    } catch (error) {
      console.error('Error getting category recommendations:', error);
      res.status(500).json({
        error: 'Failed to get category recommendations',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Compare recommended cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  compareRecommendations = async (req, res) => {
    try {
      const { cardIds, userProfile } = req.body;

      if (!cardIds || !Array.isArray(cardIds) || cardIds.length < 2) {
        return res.status(400).json({
          error: 'Invalid card IDs',
          message: 'Please provide at least 2 card IDs to compare'
        });
      }

      if (!userProfile || !this.isValidProfile(userProfile)) {
        return res.status(400).json({
          error: 'Invalid user profile',
          message: 'Please provide a complete user profile for accurate comparison'
        });
      }

      // Get card details with personalized calculations
      const cardModel = this.recommendationEngine.cardModel;
      const comparisonData = cardIds.map(cardId => {
        const card = cardModel.getCardById(cardId);
        if (!card) return null;

        return {
          ...card,
          estimatedAnnualReward: cardModel.calculateAnnualReward(card, userProfile.spendingHabits),
          netValue: cardModel.calculateAnnualReward(card, userProfile.spendingHabits) - card.annualFee,
          score: this.recommendationEngine.calculateCardScore(card, userProfile),
          reasonsToChoose: this.recommendationEngine.generateReasons(card, userProfile)
        };
      }).filter(Boolean);

      if (comparisonData.length !== cardIds.length) {
        return res.status(404).json({
          error: 'Some cards not found',
          message: 'One or more card IDs are invalid'
        });
      }

      // Generate comparison insights
      const insights = this.generateComparisonInsights(comparisonData, userProfile);

      res.json({
        success: true,
        userProfile: {
          monthlyIncome: userProfile.monthlyIncome,
          creditScore: userProfile.creditScore
        },
        comparison: comparisonData,
        insights
      });
    } catch (error) {
      console.error('Error comparing recommendations:', error);
      res.status(500).json({
        error: 'Failed to compare recommendations',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Get recommendation explanation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRecommendationExplanation = async (req, res) => {
    try {
      const { cardId } = req.params;
      const { userProfile } = req.body;

      if (!userProfile || !this.isValidProfile(userProfile)) {
        return res.status(400).json({
          error: 'Invalid user profile',
          message: 'Please provide a complete user profile'
        });
      }

      const cardModel = this.recommendationEngine.cardModel;
      const card = cardModel.getCardById(cardId);
      
      if (!card) {
        return res.status(404).json({
          error: 'Card not found',
          message: `Credit card with ID '${cardId}' does not exist`
        });
      }

      // Calculate personalized metrics
      const score = this.recommendationEngine.calculateCardScore(card, userProfile);
      const estimatedReward = cardModel.calculateAnnualReward(card, userProfile.spendingHabits);
      const netValue = estimatedReward - card.annualFee;
      const reasons = this.recommendationEngine.generateReasons(card, userProfile);

      // Generate detailed explanation
      const explanation = await this.generateDetailedExplanation(card, userProfile, {
        score,
        estimatedReward,
        netValue,
        reasons
      });

      res.json({
        success: true,
        card: {
          id: card.id,
          name: card.name,
          issuer: card.issuer
        },
        metrics: {
          score: score,
          estimatedAnnualReward: estimatedReward,
          netValue: netValue,
          reasonsToChoose: reasons
        },
        explanation
      });
    } catch (error) {
      console.error('Error getting recommendation explanation:', error);
      res.status(500).json({
        error: 'Failed to get recommendation explanation',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Validate user profile for recommendations
   * @param {Object} userProfile - User profile object
   * @returns {boolean} True if valid
   */
  isValidProfile(userProfile) {
    return !!(
      userProfile &&
      userProfile.monthlyIncome &&
      userProfile.spendingHabits &&
      Object.values(userProfile.spendingHabits).some(amount => amount > 0)
    );
  }

  /**
   * Generate comparison insights
   * @param {Array} cards - Array of cards to compare
   * @param {Object} userProfile - User profile
   * @returns {Object} Comparison insights
   */
  generateComparisonInsights(cards, userProfile) {
    const insights = {
      bestValue: null,
      bestRewards: null,
      lowestFee: null,
      highestScore: null,
      summary: []
    };

    // Find best performers
    insights.bestValue = cards.reduce((best, card) => 
      card.netValue > best.netValue ? card : best
    );

    insights.bestRewards = cards.reduce((best, card) => 
      card.estimatedAnnualReward > best.estimatedAnnualReward ? card : best
    );

    insights.lowestFee = cards.reduce((best, card) => 
      card.annualFee < best.annualFee ? card : best
    );

    insights.highestScore = cards.reduce((best, card) => 
      card.score > best.score ? card : best
    );

    // Generate summary insights
    const totalSpending = Object.values(userProfile.spendingHabits)
      .reduce((sum, amount) => sum + amount, 0);

    if (insights.bestValue.netValue > 0) {
      insights.summary.push(
        `${insights.bestValue.name} offers the best value with ₹${insights.bestValue.netValue.toLocaleString()} net annual benefit`
      );
    }

    if (insights.lowestFee.annualFee === 0) {
      insights.summary.push(
        `${insights.lowestFee.name} is free for life with no annual fee`
      );
    }

    insights.summary.push(
      `Based on your ₹${totalSpending.toLocaleString()} monthly spending, ${insights.bestRewards.name} maximizes your rewards`
    );

    return insights;
  }

  /**
   * Generate detailed explanation for a specific card recommendation
   * @param {Object} card - Credit card object
   * @param {Object} userProfile - User profile
   * @param {Object} metrics - Calculated metrics
   * @returns {string} Detailed explanation
   */
  async generateDetailedExplanation(card, userProfile, metrics) {
    try {
      const prompt = `Explain why ${card.name} by ${card.issuer} is recommended for this user:

User Profile:
- Monthly Income: ₹${userProfile.monthlyIncome.toLocaleString()}
- Credit Score: ${userProfile.creditScore}
- Monthly Spending: ${JSON.stringify(userProfile.spendingHabits)}

Card Metrics:
- Recommendation Score: ${metrics.score}/100
- Estimated Annual Reward: ₹${metrics.estimatedReward}
- Net Value: ₹${metrics.netValue}
- Key Reasons: ${metrics.reasons.join(', ')}

Card Details:
- Annual Fee: ₹${card.annualFee}
- Reward Type: ${card.rewardType}
- Special Perks: ${card.specialPerks.slice(0, 3).join(', ')}

Provide a detailed, personalized explanation covering:
1. Why this card matches their spending pattern
2. Specific reward calculations
3. Value proposition analysis
4. Comparison with alternatives
5. Action steps

Keep it informative but conversational.`;

      const completion = await this.openAIService.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a credit card expert providing detailed recommendation explanations.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating detailed explanation:', error);
      return `${card.name} is recommended based on your spending pattern and profile. It offers ₹${metrics.estimatedReward} in annual rewards with a net value of ₹${metrics.netValue}.`;
    }
  }
}

export default RecommendationController;
