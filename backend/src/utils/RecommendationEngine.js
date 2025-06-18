import CreditCardModel from '../models/CreditCardModel.js';

/**
 * Recommendation Engine for matching users with suitable credit cards
 */
class RecommendationEngine {
  constructor() {
    this.cardModel = new CreditCardModel();
  }

  /**
   * Generate card recommendations based on user profile
   * @param {Object} userProfile - User profile with preferences and spending habits
   * @returns {Array} Array of recommended cards with scores and explanations
   */
  generateRecommendations(userProfile) {
    try {
      // Get all eligible cards based on income and credit score
      const eligibleCards = this.getEligibleCards(userProfile);
      
      if (eligibleCards.length === 0) {
        return this.getFallbackRecommendations(userProfile);
      }

      // Score each card based on user preferences
      const scoredCards = eligibleCards.map(card => ({
        ...card,
        score: this.calculateCardScore(card, userProfile),
        estimatedAnnualReward: this.cardModel.calculateAnnualReward(card, userProfile.spendingHabits),
        reasonsToChoose: this.generateReasons(card, userProfile),
        netValue: this.calculateNetValue(card, userProfile)
      }));

      // Sort by score and return top 5
      const topCards = scoredCards
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return topCards;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  /**
   * Get cards that user is eligible for based on income and credit score
   * @param {Object} userProfile - User profile
   * @returns {Array} Eligible cards
   */
  getEligibleCards(userProfile) {
    const { monthlyIncome, creditScore, preferences } = userProfile;
    const annualIncome = monthlyIncome * 12;
    
    return this.cardModel.getAllCards().filter(card => {
      // Income eligibility
      if (card.eligibility.minIncome > annualIncome) {
        return false;
      }

      // Credit score eligibility (if user provided it)
      if (creditScore && creditScore !== 'unknown' && creditScore < card.eligibility.minCreditScore) {
        return false;
      }

      // Annual fee preference
      if (preferences.maxAnnualFee !== null && card.annualFee > preferences.maxAnnualFee) {
        return false;
      }

      // Reward type preference
      if (preferences.rewardType && card.rewardType !== preferences.rewardType) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate comprehensive score for a card based on user profile
   * @param {Object} card - Credit card object
   * @param {Object} userProfile - User profile
   * @returns {number} Card score (0-100)
   */
  calculateCardScore(card, userProfile) {
    let score = 0;
    const { spendingHabits, preferences } = userProfile;

    // 1. Reward alignment score (40% weight)
    score += this.calculateRewardScore(card, spendingHabits) * 0.4;

    // 2. Preference match score (25% weight)
    score += this.calculatePreferenceScore(card, preferences) * 0.25;

    // 3. Value for money score (20% weight)
    score += this.calculateValueScore(card, userProfile) * 0.2;

    // 4. Feature match score (15% weight)
    score += this.calculateFeatureScore(card, preferences) * 0.15;

    return Math.round(score * 100) / 100;
  }

  /**
   * Calculate reward alignment score based on spending habits
   * @param {Object} card - Credit card
   * @param {Object} spendingHabits - User spending patterns
   * @returns {number} Score (0-1)
   */
  calculateRewardScore(card, spendingHabits) {
    let totalSpending = Object.values(spendingHabits).reduce((sum, amount) => sum + amount, 0);
    if (totalSpending === 0) return 0.5; // Default score if no spending data

    let weightedRewardRate = 0;

    Object.entries(spendingHabits).forEach(([category, amount]) => {
      if (amount > 0) {
        const weight = amount / totalSpending;
        const rewardRate = card.rewardRate[category] || card.rewardRate.default;
        const numericRate = this.cardModel.getNumericRewardRate(rewardRate);
        
        // Normalize reward rate (cashback vs points)
        const normalizedRate = card.rewardType === 'Cashback' 
          ? numericRate 
          : numericRate * card.pointValue;

        weightedRewardRate += weight * normalizedRate;
      }
    });

    // Normalize to 0-1 scale (assuming max 6% reward rate)
    return Math.min(weightedRewardRate / 6, 1);
  }

  /**
   * Calculate preference match score
   * @param {Object} card - Credit card
   * @param {Object} preferences - User preferences
   * @returns {number} Score (0-1)
   */
  calculatePreferenceScore(card, preferences) {
    let score = 0;
    let maxScore = 0;

    // Reward type preference
    if (preferences.rewardType) {
      maxScore += 0.4;
      if (card.rewardType === preferences.rewardType) {
        score += 0.4;
      }
    }

    // Benefits preference
    if (preferences.benefits && preferences.benefits.length > 0) {
      maxScore += 0.6;
      const benefitKeywords = preferences.benefits.join(' ').toLowerCase();
      const cardBenefits = card.specialPerks.join(' ').toLowerCase();
      
      let benefitMatches = 0;
      preferences.benefits.forEach(benefit => {
        if (cardBenefits.includes(benefit.toLowerCase())) {
          benefitMatches++;
        }
      });
      
      score += (benefitMatches / preferences.benefits.length) * 0.6;
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  }

  /**
   * Calculate value for money score
   * @param {Object} card - Credit card
   * @param {Object} userProfile - User profile
   * @returns {number} Score (0-1)
   */
  calculateValueScore(card, userProfile) {
    const annualReward = this.cardModel.calculateAnnualReward(card, userProfile.spendingHabits);
    const netValue = annualReward - card.annualFee;
    
    // Normalize based on expected value range
    const normalizedValue = Math.max(0, netValue + 5000) / 15000;
    return Math.min(normalizedValue, 1);
  }

  /**
   * Calculate feature match score
   * @param {Object} card - Credit card
   * @param {Object} preferences - User preferences
   * @returns {number} Score (0-1)
   */
  calculateFeatureScore(card, preferences) {
    let score = 0;

    // Premium features bonus
    if (card.category === 'Premium' || card.category === 'Super Premium') {
      score += 0.3;
    }

    // Issuer reputation (major banks get bonus)
    const majorIssuers = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Mahindra Bank'];
    if (majorIssuers.includes(card.issuer)) {
      score += 0.2;
    }

    // Low/no annual fee bonus
    if (card.annualFee === 0) {
      score += 0.3;
    } else if (card.annualFee <= 1000) {
      score += 0.2;
    }

    // Welcome bonus consideration
    if (card.specialPerks.some(perk => perk.toLowerCase().includes('welcome'))) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate net annual value (rewards - fees)
   * @param {Object} card - Credit card
   * @param {Object} userProfile - User profile
   * @returns {number} Net value in rupees
   */
  calculateNetValue(card, userProfile) {
    const annualReward = this.cardModel.calculateAnnualReward(card, userProfile.spendingHabits);
    return annualReward - card.annualFee;
  }

  /**
   * Generate reasons why a card is recommended
   * @param {Object} card - Credit card
   * @param {Object} userProfile - User profile
   * @returns {Array} Array of reason strings
   */
  generateReasons(card, userProfile) {
    const reasons = [];
    const { spendingHabits, preferences } = userProfile;

    // Find top spending categories
    const topSpendingCategories = Object.entries(spendingHabits)
      .filter(([_, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);

    // Reward rate reasons
    topSpendingCategories.forEach(category => {
      const rewardRate = card.rewardRate[category];
      if (rewardRate && category !== 'default') {
        const rate = this.cardModel.getNumericRewardRate(rewardRate);
        if (rate >= 3) {
          reasons.push(`Excellent ${rate}${card.rewardType === 'Cashback' ? '%' : 'x'} rewards on ${category}`);
        }
      }
    });

    // Annual fee consideration
    if (card.annualFee === 0) {
      reasons.push('Lifetime free with no annual fee');
    } else if (card.feeWaiver && card.feeWaiver !== 'None') {
      reasons.push(`Annual fee waived with ${card.feeWaiver.toLowerCase()}`);
    }

    // Special benefits
    if (card.specialPerks.some(perk => perk.toLowerCase().includes('lounge'))) {
      reasons.push('Airport lounge access included');
    }

    if (card.specialPerks.some(perk => perk.toLowerCase().includes('welcome'))) {
      reasons.push('Attractive welcome bonus');
    }

    // Value proposition
    const netValue = this.calculateNetValue(card, userProfile);
    if (netValue > 5000) {
      reasons.push(`High value card with ₹${netValue.toLocaleString()} annual benefit`);
    }

    // Preference alignment
    if (preferences.rewardType && card.rewardType === preferences.rewardType) {
      reasons.push(`Matches your preference for ${preferences.rewardType.toLowerCase()}`);
    }

    return reasons.slice(0, 4); // Return top 4 reasons
  }

  /**
   * Get fallback recommendations for users with limited eligibility
   * @param {Object} userProfile - User profile
   * @returns {Array} Fallback recommendations
   */
  getFallbackRecommendations(userProfile) {
    // Return entry-level cards for users with low income/credit score
    const entryLevelCards = this.cardModel.getAllCards()
      .filter(card => 
        card.eligibility.minIncome <= 300000 && 
        card.eligibility.minCreditScore <= 650
      )
      .slice(0, 3);

    return entryLevelCards.map(card => ({
      ...card,
      score: 0.6,
      estimatedAnnualReward: this.cardModel.calculateAnnualReward(card, userProfile.spendingHabits),
      reasonsToChoose: ['Good entry-level option', 'Easy approval process', 'Build credit history'],
      netValue: this.calculateNetValue(card, userProfile)
    }));
  }

  /**
   * Get cards by specific category for comparison
   * @param {string} category - Card category (cashback, travel, etc.)
   * @param {Object} userProfile - User profile
   * @returns {Array} Cards in the specified category
   */
  getCardsByCategory(category, userProfile) {
    const categoryFilters = {
      'cashback': { rewardType: 'Cashback' },
      'travel': { bestFor: ['Travel'] },
      'dining': { bestFor: ['Dining'] },
      'fuel': { bestFor: ['Fuel'] },
      'premium': { category: ['Premium', 'Super Premium'] },
      'free': { maxAnnualFee: 0 }
    };

    const filter = categoryFilters[category.toLowerCase()] || {};
    const filteredCards = this.cardModel.filterCards(filter);

    return filteredCards.map(card => ({
      ...card,
      estimatedAnnualReward: this.cardModel.calculateAnnualReward(card, userProfile.spendingHabits),
      netValue: this.calculateNetValue(card, userProfile)
    }));
  }
}

export default RecommendationEngine;
