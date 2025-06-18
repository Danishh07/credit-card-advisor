import React, { useState } from 'react';
import { 
  CreditCard, 
  Star, 
  TrendingUp, 
  Shield, 
  ExternalLink, 
  Info,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { RecommendedCard } from '../services/api';

interface RecommendationCardsProps {
  recommendations: RecommendedCard[];
}

const RecommendationCards: React.FC<RecommendationCardsProps> = ({ recommendations }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'Premium': 'bg-purple-100 text-purple-800',
      'Super Premium': 'bg-indigo-100 text-indigo-800',
      'Cashback': 'bg-green-100 text-green-800',
      'Entry-level': 'bg-blue-100 text-blue-800',
      'Mid-tier': 'bg-orange-100 text-orange-800',
      'Shopping': 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-4 lg:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-2">🎯</span>
          Your Personalized Recommendations
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          Based on your profile, here are the best credit cards for you
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">        {recommendations.map((card, index) => (
          <div key={card.id} className="card card-hover relative">
            {/* Recommendation Rank Badge */}
            {index === 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10 shadow-sm">
                #1 Pick
              </div>
            )}

            <div className="p-4 sm:p-5">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight mb-1 truncate">
                    {card.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2 truncate">{card.issuer}</p>
                  
                  {/* Category Badge */}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(card.category)}`}>
                    {card.category}
                  </span>
                </div>
                
                {/* Score */}
                <div className={`text-center px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(card.score)} flex-shrink-0 ml-2`}>
                  <div className="text-sm sm:text-base">{Math.round(card.score)}</div>
                  <div className="text-xs opacity-75">Score</div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 mb-1">Annual Reward</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(card.estimatedAnnualReward)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 mb-1">Net Value</div>
                  <div className={`font-semibold ${card.netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(card.netValue)}
                  </div>
                </div>
              </div>

              {/* Annual Fee */}
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-gray-500">Annual Fee:</span>
                <span className="font-medium">
                  {card.annualFee === 0 ? 'FREE' : formatCurrency(card.annualFee)}
                </span>
              </div>              {/* Top Reasons */}
              <div className="mb-3 sm:mb-4">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Why this card?</h5>
                <ul className="space-y-1">
                  {card.reasonsToChoose.slice(0, 2).map((reason, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <Star className="w-3 h-3 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleCardExpansion(card.id)}
                className="w-full btn btn-outline text-xs py-2 mb-3 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <span className="mr-1">
                  {expandedCard === card.id ? 'Less Details' : 'More Details'}
                </span>
                {expandedCard === card.id ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {/* Expanded Details */}
              {expandedCard === card.id && (
                <div className="border-t pt-4 space-y-3">
                  {/* All Reasons */}
                  {card.reasonsToChoose.length > 2 && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Additional Benefits:</h6>
                      <ul className="space-y-1">
                        {card.reasonsToChoose.slice(2).map((reason, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start">
                            <TrendingUp className="w-3 h-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Special Perks */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Special Perks:</h6>
                    <ul className="space-y-1">
                      {card.specialPerks.slice(0, 3).map((perk, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <Shield className="w-3 h-3 text-purple-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Eligibility */}
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Eligibility:</h6>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Min Income: {formatCurrency(card.eligibility.minIncome)}/year</div>
                      <div>Min Credit Score: {card.eligibility.minCreditScore}</div>
                      <div>Age: {card.eligibility.ageRange} years</div>
                    </div>
                  </div>

                  {/* Reward Rate Details */}
                  <div className="bg-green-50 p-2 rounded-lg">
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Reward Rates:</h6>
                    <div className="text-xs text-gray-600 space-y-1">
                      {Object.entries(card.rewardRate).slice(0, 4).map(([category, rate]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}:</span>
                          <span className="font-medium">{rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <a
                href={card.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn btn-primary text-sm py-2 flex items-center justify-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Apply Now
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium mb-1">Important Disclaimer:</p>
            <p>
              These recommendations are based on the information you provided and general card features. 
              Actual approval depends on bank policies, credit history, and other factors. 
              Please verify all details on the bank's official website before applying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCards;
