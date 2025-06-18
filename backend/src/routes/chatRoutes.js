import express from 'express';
import ChatController from '../controllers/ChatController.js';

const router = express.Router();
const chatController = new ChatController();

// Chat session routes
router.post('/start', chatController.startSession);
router.post('/:sessionId/message', chatController.sendMessage);
router.get('/:sessionId', chatController.getSession);
router.post('/:sessionId/reset', chatController.resetSession);
router.get('/stats/overview', chatController.getStats);

export default router;
