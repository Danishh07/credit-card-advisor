/**
 * User Session Model for managing chat sessions and user preferences
 */
class UserSessionModel {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new user session
   * @param {string} sessionId - Unique session identifier
   * @returns {Object} Session object
   */
  createSession(sessionId) {
    const session = {
      id: sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userProfile: {
        monthlyIncome: null,
        creditScore: null,
        age: null,
        spendingHabits: {
          dining: 0,
          travel: 0,
          fuel: 0,
          groceries: 0,
          online: 0,
          default: 0
        },
        preferences: {
          rewardType: null, // 'Points' or 'Cashback'
          benefits: [], // ['lounge', 'cashback', 'travel', 'dining']
          maxAnnualFee: null,
          existingCards: []
        }
      },
      chatHistory: [],
      questionsAsked: [],
      currentStep: 'greeting',
      isProfileComplete: false,
      recommendations: null
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session object or null if not found
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session data
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated session or null if not found
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Merge updates with existing session
    Object.assign(session, updates);
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update user profile within a session
   * @param {string} sessionId - Session identifier
   * @param {Object} profileUpdates - Profile updates
   * @returns {Object|null} Updated session or null if not found
   */
  updateUserProfile(sessionId, profileUpdates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Deep merge profile updates
    if (profileUpdates.spendingHabits) {
      Object.assign(session.userProfile.spendingHabits, profileUpdates.spendingHabits);
      delete profileUpdates.spendingHabits;
    }

    if (profileUpdates.preferences) {
      Object.assign(session.userProfile.preferences, profileUpdates.preferences);
      delete profileUpdates.preferences;
    }

    Object.assign(session.userProfile, profileUpdates);
    session.updatedAt = new Date();

    // Check if profile is complete
    session.isProfileComplete = this.isProfileComplete(session.userProfile);

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Add message to chat history
   * @param {string} sessionId - Session identifier
   * @param {Object} message - Message object
   * @returns {Object|null} Updated session or null if not found
   */
  addChatMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.chatHistory.push({
      ...message,
      timestamp: new Date()
    });
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Mark a question as asked
   * @param {string} sessionId - Session identifier
   * @param {string} questionType - Type of question asked
   * @returns {Object|null} Updated session or null if not found
   */
  markQuestionAsked(sessionId, questionType) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (!session.questionsAsked.includes(questionType)) {
      session.questionsAsked.push(questionType);
    }
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Check if a question has been asked
   * @param {string} sessionId - Session identifier
   * @param {string} questionType - Type of question
   * @returns {boolean} True if question was asked
   */
  hasQuestionBeenAsked(sessionId, questionType) {
    const session = this.sessions.get(sessionId);
    return session ? session.questionsAsked.includes(questionType) : false;
  }
  /**
   * Check if user profile is complete enough for recommendations
   * @param {Object} userProfile - User profile object
   * @returns {boolean} True if profile is complete
   */  isProfileComplete(userProfile) {
    const hasIncome = userProfile.monthlyIncome && userProfile.monthlyIncome > 0;
    const hasCreditScore = userProfile.creditScore && (userProfile.creditScore === 'unknown' || userProfile.creditScore > 0);
    const hasSpendingHabits = userProfile.spendingHabits && Object.values(userProfile.spendingHabits).some(amount => amount > 0);
    const hasPreferences = userProfile.preferences && userProfile.preferences.rewardType;
    
    return hasIncome && hasCreditScore && hasSpendingHabits && hasPreferences;
  }

  /**
   * Set recommendations for a session
   * @param {string} sessionId - Session identifier
   * @param {Array} recommendations - Array of recommended cards
   * @returns {Object|null} Updated session or null if not found
   */
  setRecommendations(sessionId, recommendations) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.recommendations = recommendations;
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if session was deleted
   */
  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up old sessions (older than 24 hours)
   */
  cleanupOldSessions() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.updatedAt < twentyFourHoursAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        session => new Date() - session.updatedAt < 60 * 60 * 1000 // Active in last hour
      ).length,
      completedProfiles: Array.from(this.sessions.values()).filter(
        session => session.isProfileComplete
      ).length
    };
  }
}

export default UserSessionModel;
