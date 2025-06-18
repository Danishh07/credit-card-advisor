import express from 'express';
import RecommendationController from '../controllers/RecommendationController.js';

const router = express.Router();
const recommendationController = new RecommendationController();

// Recommendation routes
router.post('/', recommendationController.getRecommendations);
router.post('/session/:sessionId', recommendationController.getRecommendations);
router.post('/category/:category', recommendationController.getRecommendationsByCategory);
router.post('/compare', recommendationController.compareRecommendations);
router.post('/explain/:cardId', recommendationController.getRecommendationExplanation);

export default router;
