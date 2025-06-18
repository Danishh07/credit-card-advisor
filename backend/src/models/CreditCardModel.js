import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Credit Card Model class for handling credit card data operations
 */
class CreditCardModel {
  constructor() {
    this.cards = this.loadCards();
  }

  /**
   * Load credit cards from JSON file
   * @returns {Array} Array of credit card objects
   */
  loadCards() {
    try {
      const cardsPath = join(__dirname, '../database/creditCards.json');
      const cardsData = readFileSync(cardsPath, 'utf8');
      return JSON.parse(cardsData);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      return [];
    }
  }

  /**
   * Get all credit cards
   * @returns {Array} All credit cards
   */
  getAllCards() {
    return this.cards;
  }

  /**
   * Get card by ID
   * @param {string} cardId - The card ID
   * @returns {Object|null} Card object or null if not found
   */
  getCardById(cardId) {
    return this.cards.find(card => card.id === cardId) || null;
  }

  /**
   * Filter cards based on criteria
   * @param {Object} criteria - Filtering criteria
   * @returns {Array} Filtered cards
   */
  filterCards(criteria) {
    return this.cards.filter(card => {
      // Income filter
      if (criteria.minIncome && card.eligibility.minIncome > criteria.minIncome) {
        return false;
      }

      // Credit score filter
      if (criteria.creditScore && card.eligibility.minCreditScore > criteria.creditScore) {
        return false;
      }

      // Category filter
      if (criteria.category && !criteria.category.includes(card.category)) {
        return false;
      }

      // Annual fee filter
      if (criteria.maxAnnualFee !== undefined && card.annualFee > criteria.maxAnnualFee) {
        return false;
      }

      // Reward type filter
      if (criteria.rewardType && card.rewardType !== criteria.rewardType) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get cards by spending category
   * @param {string} category - Spending category (dining, travel, fuel, etc.)
   * @returns {Array} Cards sorted by reward rate for that category
   */
  getCardsBySpendingCategory(category) {
    return this.cards
      .filter(card => card.rewardRate[category])
      .sort((a, b) => {
        const aRate = this.getNumericRewardRate(a.rewardRate[category]);
        const bRate = this.getNumericRewardRate(b.rewardRate[category]);
        return bRate - aRate;
      });
  }

  /**
   * Extract numeric reward rate from string
   * @param {string} rateString - Reward rate string
   * @returns {number} Numeric rate
   */
  getNumericRewardRate(rateString) {
    const match = rateString.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Calculate annual reward for a card based on spending pattern
   * @param {Object} card - Credit card object
   * @param {Object} spending - Spending pattern object
   * @returns {number} Estimated annual reward
   */
  calculateAnnualReward(card, spending) {
    let totalReward = 0;

    Object.entries(spending).forEach(([category, amount]) => {
      if (amount > 0) {
        const rewardRate = card.rewardRate[category] || card.rewardRate.default;
        const numericRate = this.getNumericRewardRate(rewardRate);
        
        if (card.rewardType === 'Cashback') {
          totalReward += (amount * numericRate) / 100;
        } else {
          // Points-based calculation
          const pointsEarned = this.calculatePoints(amount, rewardRate);
          totalReward += pointsEarned * card.pointValue;
        }
      }
    });

    return Math.round(totalReward);
  }

  /**
   * Calculate points earned for spending amount
   * @param {number} amount - Spending amount
   * @param {string} rateString - Rate string (e.g., "2 points per ₹150")
   * @returns {number} Points earned
   */
  calculatePoints(amount, rateString) {
    const pointsMatch = rateString.match(/(\d+\.?\d*)\s*points?\s*per\s*₹(\d+)/i);
    if (pointsMatch) {
      const points = parseFloat(pointsMatch[1]);
      const rupees = parseFloat(pointsMatch[2]);
      return Math.floor(amount / rupees) * points;
    }
    return 0;
  }

  /**
   * Search cards by name or issuer
   * @param {string} query - Search query
   * @returns {Array} Matching cards
   */
  searchCards(query) {
    const searchTerm = query.toLowerCase();
    return this.cards.filter(card => 
      card.name.toLowerCase().includes(searchTerm) ||
      card.issuer.toLowerCase().includes(searchTerm) ||
      card.bestFor.some(category => category.toLowerCase().includes(searchTerm))
    );
  }
}

export default CreditCardModel;
