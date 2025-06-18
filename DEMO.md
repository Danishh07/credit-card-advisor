# Demo Instructions

## Video Demonstration Overview

This demo showcases the complete Credit Card Advisor experience, highlighting the AI-powered conversational interface and personalized recommendation engine.

## Demo Flow

### 1. Initial Landing (0:00-0:10)
- Application loads with clean, responsive interface
- Welcome message from AI advisor appears
- User sees chat interface with suggestion buttons

### 2. Income Collection (0:10-0:25)
- User inputs monthly income in natural language
- AI parses various formats: "₹75,000", "75K", "7.5 lakh"
- System validates and confirms income understanding

### 3. Credit Score Assessment (0:25-0:40)
- AI asks about credit score range
- Demonstrates handling of both numeric (750) and descriptive (excellent) inputs
- Shows graceful handling of "I don't know" responses

### 4. Spending Pattern Analysis (0:40-1:10)
- Sequential questions about spending categories:
  - Dining and restaurants
  - Travel and fuel
  - Groceries and online shopping
- AI extracts amounts from conversational responses
- Shows context awareness across multiple messages

### 5. Preference Collection (1:10-1:25)
- Captures reward type preferences (cashback vs travel points)
- Identifies priority benefits (lounge access, fuel surcharge waiver)
- Handles multiple preferences in single response

### 6. Recommendation Generation (1:25-1:50)
- AI generates personalized explanation
- Displays top 3-5 recommended cards
- Shows detailed card information:
  - Annual fees and eligibility
  - Reward rates for user's spending categories
  - Special perks and benefits
  - Expected annual rewards/savings

### 7. Card Comparison (1:50-2:05)
- User can compare multiple recommended cards
- Side-by-side feature comparison
- Reward calculation breakdown
- Clear value proposition for each card

### 8. Responsive Design Demo (2:05-2:15)
- Shows mobile responsiveness
- Touch-friendly interface
- Maintains functionality across screen sizes

## Key Highlights

### AI Intelligence
- **Natural Language Understanding**: Processes varied input formats
- **Context Retention**: Remembers previous conversation points
- **Smart Data Extraction**: Identifies amounts, preferences, and categories
- **Personalized Responses**: Tailors explanations to user profile

### User Experience
- **Conversational Flow**: Feels like chatting with a financial advisor
- **Progressive Disclosure**: Gathers information step-by-step
- **Visual Feedback**: Clear progress indication and suggestions
- **Instant Responses**: Real-time AI interactions

### Recommendation Quality
- **Data-Driven**: Based on actual spending patterns and income
- **Comprehensive**: Considers multiple factors (rewards, fees, eligibility)
- **Explainable**: Clear reasoning for each recommendation
- **Actionable**: Direct links to card applications

## Technical Demonstration

### Multi-AI Fallback
- Shows graceful degradation when primary AI service is unavailable
- Seamless switching between OpenAI, Ollama, and Mock services
- Maintains functionality regardless of external service status

### Real-time Features
- Typing indicators during AI processing
- Instant message delivery and response
- Smooth transitions between conversation steps

### Error Handling
- Graceful handling of invalid inputs
- Clear error messages and recovery options
- Robust fallback mechanisms

## Recording Notes

### Equipment Setup
- Screen resolution: 1920x1080 for optimal clarity
- Browser: Chrome/Firefox for best compatibility
- Recording software: OBS Studio or similar

### Timing Considerations
- Total duration: 2-3 minutes for complete flow
- Pause briefly between major sections
- Allow time for AI responses to complete
- Show both desktop and mobile views

### Voice-over Script (Optional)
"Welcome to Credit Card Advisor, an AI-powered recommendation system that helps Indian users find the perfect credit card based on their financial profile and spending habits. Watch as our conversational AI guides users through a personalized consultation, analyzing their income, credit score, and spending patterns to recommend the most suitable credit cards with detailed reward calculations and benefit explanations."

## GIF Creation Instructions

### Key Frames to Capture
1. Landing page with welcome message
2. Income input and validation
3. Credit score collection
4. Spending pattern questions
5. Preference gathering
6. Final recommendations display
7. Card comparison view

### GIF Specifications
- Duration: 30-45 seconds (looped)
- Resolution: 800x600 for GitHub README
- File size: < 10MB for fast loading
- Format: Optimized GIF or WebP

### Tools Recommended
- **LICEcap**: Simple, lightweight screen recording to GIF
- **GIPHY Capture**: Professional GIF creation with editing
- **Recordit**: Quick screen recording with automatic GIF conversion
