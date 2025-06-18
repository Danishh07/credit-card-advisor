import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      // Rate limited
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    throw error;
  }
);

export interface UserProfile {
  monthlyIncome: number | null;
  creditScore: number | string | null;
  spendingHabits: {
    dining: number;
    travel: number;
    fuel: number;
    groceries: number;
    online: number;
    default: number;
  };
  preferences: {
    rewardType: string | null;
    benefits: string[];
    maxAnnualFee: number | null;
    existingCards: string[];
  };
}

export interface ChatMessage {
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  cardImage: string;
  joiningFee: number;
  annualFee: number;
  feeWaiver: string;
  rewardType: string;
  rewardRate: Record<string, string>;
  eligibility: {
    minIncome: number;
    minCreditScore: number;
    ageRange: string;
  };
  specialPerks: string[];
  category: string;
  applyLink: string;
  bestFor: string[];
  pointValue: number;
}

export interface RecommendedCard extends CreditCard {
  score: number;
  estimatedAnnualReward: number;
  netValue: number;
  reasonsToChoose: string[];
}

export interface ChatSession {
  id: string;
  currentStep: string;
  isProfileComplete: boolean;
  chatHistory: ChatMessage[];
  userProfile: UserProfile;
  recommendations: RecommendedCard[] | null;
}

// Chat API functions
export const chatAPI = {
  startSession: async (): Promise<{ sessionId: string; message: string; suggestions: string[] }> => {
    const response = await api.post('/chat/start');
    return response.data;
  },

  sendMessage: async (sessionId: string, message: string): Promise<{
    message: string;
    suggestions: string[];
    session: Partial<ChatSession>;
    recommendations?: RecommendedCard[];
  }> => {
    const response = await api.post(`/chat/${sessionId}/message`, { message });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<{ session: ChatSession }> => {
    const response = await api.get(`/chat/${sessionId}`);
    return response.data;
  },

  resetSession: async (sessionId: string): Promise<{ message: string; suggestions: string[] }> => {
    const response = await api.post(`/chat/${sessionId}/reset`);
    return response.data;
  },
};

// Cards API functions
export const cardsAPI = {
  getAllCards: async (): Promise<{ data: CreditCard[] }> => {
    const response = await api.get('/cards');
    return response.data;
  },

  getCardById: async (cardId: string): Promise<{ data: CreditCard }> => {
    const response = await api.get(`/cards/${cardId}`);
    return response.data;
  },

  searchCards: async (query: string): Promise<{ data: CreditCard[] }> => {
    const response = await api.get(`/cards/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  filterCards: async (filters: {
    minIncome?: number;
    creditScore?: number;
    category?: string;
    maxAnnualFee?: number;
    rewardType?: string;
  }): Promise<{ data: CreditCard[] }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/cards/filter?${params.toString()}`);
    return response.data;
  },

  compareCards: async (cardIds: string[]): Promise<{ data: any }> => {
    const response = await api.post('/cards/compare', { cardIds });
    return response.data;
  },

  calculateRewards: async (cardId: string, spendingPattern: Record<string, number>): Promise<{
    calculation: {
      totalAnnualReward: number;
      annualFee: number;
      netValue: number;
      breakdown: Record<string, any>;
    };
  }> => {
    const response = await api.post(`/cards/${cardId}/calculate-rewards`, { spendingPattern });
    return response.data;
  },
};

// Recommendations API functions
export const recommendationsAPI = {
  getRecommendations: async (userProfile?: UserProfile, sessionId?: string): Promise<{
    recommendations: RecommendedCard[];
    explanation: string;
  }> => {
    if (sessionId) {
      const response = await api.post(`/recommendations/session/${sessionId}`);
      return response.data;
    } else {
      const response = await api.post('/recommendations', { userProfile });
      return response.data;
    }
  },

  getRecommendationsByCategory: async (
    category: string,
    userProfile: UserProfile
  ): Promise<{ data: RecommendedCard[] }> => {
    const response = await api.post(`/recommendations/category/${category}`, { userProfile });
    return response.data;
  },

  compareRecommendations: async (
    cardIds: string[],
    userProfile: UserProfile
  ): Promise<{
    comparison: RecommendedCard[];
    insights: any;
  }> => {
    const response = await api.post('/recommendations/compare', { cardIds, userProfile });
    return response.data;
  },

  getRecommendationExplanation: async (
    cardId: string,
    userProfile: UserProfile
  ): Promise<{
    explanation: string;
    metrics: any;
  }> => {
    const response = await api.post(`/recommendations/explain/${cardId}`, { userProfile });
    return response.data;
  },
};

export default api;
