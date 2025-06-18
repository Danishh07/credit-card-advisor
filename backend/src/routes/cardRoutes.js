import express from 'express';
import CardController from '../controllers/CardController.js';

const router = express.Router();
const cardController = new CardController();

// Card information routes
router.get('/', cardController.getAllCards);
router.get('/search', cardController.searchCards);
router.get('/filter', cardController.filterCards);
router.get('/stats', cardController.getCardStats);
router.get('/category/:category', cardController.getCardsByCategory);
router.get('/:cardId', cardController.getCardById);

// Card comparison and calculation routes
router.post('/compare', cardController.compareCards);
router.post('/:cardId/calculate-rewards', cardController.calculateRewards);

export default router;
