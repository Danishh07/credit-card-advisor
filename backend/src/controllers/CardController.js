import CreditCardModel from '../models/CreditCardModel.js';

/**
 * Credit Card Controller for handling card-related API endpoints
 */
class CardController {
  constructor() {
    this.cardModel = new CreditCardModel();
  }

  /**
   * Get all credit cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllCards = async (req, res) => {
    try {
      const cards = this.cardModel.getAllCards();
      
      res.json({
        success: true,
        count: cards.length,
        data: cards
      });
    } catch (error) {
      console.error('Error fetching all cards:', error);
      res.status(500).json({
        error: 'Failed to fetch credit cards',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Get a specific credit card by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCardById = async (req, res) => {
    try {
      const { cardId } = req.params;
      const card = this.cardModel.getCardById(cardId);
      
      if (!card) {
        return res.status(404).json({
          error: 'Card not found',
          message: `Credit card with ID '${cardId}' does not exist`
        });
      }

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      res.status(500).json({
        error: 'Failed to fetch credit card',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Filter credit cards based on criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  filterCards = async (req, res) => {
    try {
      const {
        minIncome,
        creditScore,
        category,
        maxAnnualFee,
        rewardType,
        issuer
      } = req.query;

      const criteria = {};
      
      if (minIncome) criteria.minIncome = parseInt(minIncome);
      if (creditScore) criteria.creditScore = parseInt(creditScore);
      if (category) criteria.category = category.split(',');
      if (maxAnnualFee) criteria.maxAnnualFee = parseInt(maxAnnualFee);
      if (rewardType) criteria.rewardType = rewardType;
      if (issuer) criteria.issuer = issuer;

      const filteredCards = this.cardModel.filterCards(criteria);

      res.json({
        success: true,
        count: filteredCards.length,
        criteria,
        data: filteredCards
      });
    } catch (error) {
      console.error('Error filtering cards:', error);
      res.status(500).json({
        error: 'Failed to filter credit cards',
        message: 'Please check your filter criteria and try again'
      });
    }
  };

  /**
   * Search credit cards by name, issuer, or features
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  searchCards = async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          error: 'Invalid search query',
          message: 'Search query must be at least 2 characters long'
        });
      }

      const searchResults = this.cardModel.searchCards(q.trim());

      res.json({
        success: true,
        query: q.trim(),
        count: searchResults.length,
        data: searchResults
      });
    } catch (error) {
      console.error('Error searching cards:', error);
      res.status(500).json({
        error: 'Failed to search credit cards',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Get cards by spending category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCardsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      
      const validCategories = ['dining', 'travel', 'fuel', 'groceries', 'online', 'default'];
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }

      const cards = this.cardModel.getCardsBySpendingCategory(category.toLowerCase());

      res.json({
        success: true,
        category: category.toLowerCase(),
        count: cards.length,
        data: cards
      });
    } catch (error) {
      console.error('Error fetching cards by category:', error);
      res.status(500).json({
        error: 'Failed to fetch cards by category',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Compare multiple credit cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  compareCards = async (req, res) => {
    try {
      const { cardIds } = req.body;
      
      if (!cardIds || !Array.isArray(cardIds) || cardIds.length < 2) {
        return res.status(400).json({
          error: 'Invalid card IDs',
          message: 'Please provide at least 2 card IDs to compare'
        });
      }

      if (cardIds.length > 5) {
        return res.status(400).json({
          error: 'Too many cards',
          message: 'You can compare maximum 5 cards at once'
        });
      }

      const cards = cardIds.map(id => this.cardModel.getCardById(id)).filter(Boolean);
      
      if (cards.length !== cardIds.length) {
        return res.status(404).json({
          error: 'Some cards not found',
          message: 'One or more card IDs are invalid'
        });
      }

      // Generate comparison data
      const comparison = this.generateComparison(cards);

      res.json({
        success: true,
        cardCount: cards.length,
        data: comparison
      });
    } catch (error) {
      console.error('Error comparing cards:', error);
      res.status(500).json({
        error: 'Failed to compare cards',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Calculate potential rewards for spending pattern
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  calculateRewards = async (req, res) => {
    try {
      const { cardId } = req.params;
      const { spendingPattern } = req.body;
      
      if (!spendingPattern || typeof spendingPattern !== 'object') {
        return res.status(400).json({
          error: 'Invalid spending pattern',
          message: 'Please provide spending amounts for different categories'
        });
      }

      const card = this.cardModel.getCardById(cardId);
      if (!card) {
        return res.status(404).json({
          error: 'Card not found',
          message: `Credit card with ID '${cardId}' does not exist`
        });
      }

      const annualReward = this.cardModel.calculateAnnualReward(card, spendingPattern);
      const netValue = annualReward - card.annualFee;

      // Calculate category-wise breakdown
      const breakdown = {};
      Object.entries(spendingPattern).forEach(([category, amount]) => {
        if (amount > 0) {
          const rewardRate = card.rewardRate[category] || card.rewardRate.default;
          const numericRate = this.cardModel.getNumericRewardRate(rewardRate);
          
          if (card.rewardType === 'Cashback') {
            breakdown[category] = {
              spending: amount,
              rewardRate: `${numericRate}%`,
              reward: Math.round((amount * numericRate) / 100)
            };
          } else {
            const pointsEarned = this.cardModel.calculatePoints(amount, rewardRate);
            breakdown[category] = {
              spending: amount,
              rewardRate: rewardRate,
              pointsEarned: pointsEarned,
              cashValue: Math.round(pointsEarned * card.pointValue)
            };
          }
        }
      });

      res.json({
        success: true,
        card: {
          id: card.id,
          name: card.name,
          rewardType: card.rewardType
        },
        calculation: {
          totalAnnualReward: annualReward,
          annualFee: card.annualFee,
          netValue: netValue,
          breakdown: breakdown
        }
      });
    } catch (error) {
      console.error('Error calculating rewards:', error);
      res.status(500).json({
        error: 'Failed to calculate rewards',
        message: 'Please check your input and try again'
      });
    }
  };

  /**
   * Get card statistics and insights
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCardStats = async (req, res) => {
    try {
      const cards = this.cardModel.getAllCards();
      
      const stats = {
        totalCards: cards.length,
        byIssuer: {},
        byCategory: {},
        byRewardType: {},
        feeDistribution: {
          free: 0,
          low: 0,    // ₹1-1000
          medium: 0, // ₹1001-5000
          high: 0    // ₹5000+
        },
        averageAnnualFee: 0
      };

      cards.forEach(card => {
        // Count by issuer
        stats.byIssuer[card.issuer] = (stats.byIssuer[card.issuer] || 0) + 1;
        
        // Count by category
        stats.byCategory[card.category] = (stats.byCategory[card.category] || 0) + 1;
        
        // Count by reward type
        stats.byRewardType[card.rewardType] = (stats.byRewardType[card.rewardType] || 0) + 1;
        
        // Fee distribution
        if (card.annualFee === 0) {
          stats.feeDistribution.free++;
        } else if (card.annualFee <= 1000) {
          stats.feeDistribution.low++;
        } else if (card.annualFee <= 5000) {
          stats.feeDistribution.medium++;
        } else {
          stats.feeDistribution.high++;
        }
      });

      // Calculate average annual fee
      const totalFees = cards.reduce((sum, card) => sum + card.annualFee, 0);
      stats.averageAnnualFee = Math.round(totalFees / cards.length);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching card stats:', error);
      res.status(500).json({
        error: 'Failed to fetch card statistics',
        message: 'Please try again later'
      });
    }
  };

  /**
   * Generate comparison data for multiple cards
   * @param {Array} cards - Array of credit card objects
   * @returns {Object} Comparison data
   */
  generateComparison(cards) {
    const comparison = {
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        annualFee: card.annualFee,
        rewardType: card.rewardType,
        category: card.category
      })),
      comparison: {
        fees: {
          lowest: Math.min(...cards.map(c => c.annualFee)),
          highest: Math.max(...cards.map(c => c.annualFee)),
          free: cards.filter(c => c.annualFee === 0).length
        },
        rewards: {
          diningMax: Math.max(...cards.map(c => this.cardModel.getNumericRewardRate(c.rewardRate.dining || c.rewardRate.default))),
          travelMax: Math.max(...cards.map(c => this.cardModel.getNumericRewardRate(c.rewardRate.travel || c.rewardRate.default))),
          fuelMax: Math.max(...cards.map(c => this.cardModel.getNumericRewardRate(c.rewardRate.fuel || c.rewardRate.default)))
        },
        eligibility: {
          minIncomeRange: {
            lowest: Math.min(...cards.map(c => c.eligibility.minIncome)),
            highest: Math.max(...cards.map(c => c.eligibility.minIncome))
          },
          minCreditScoreRange: {
            lowest: Math.min(...cards.map(c => c.eligibility.minCreditScore)),
            highest: Math.max(...cards.map(c => c.eligibility.minCreditScore))
          }
        }
      },
      details: cards
    };

    return comparison;
  }
}

export default CardController;
