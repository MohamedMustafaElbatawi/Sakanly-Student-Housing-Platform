import { Router } from 'express';
import { MessagesController } from '../controllers/messagesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All message routes require user authentication
router.use(requireAuth);

router.get('/conversations', MessagesController.getConversations);
router.get('/unread-count', MessagesController.getUnreadCount);
router.post('/initiate', MessagesController.initiateConversation);
router.get('/conversations/:id', MessagesController.getConversationById);
router.post('/conversations/:id/messages', MessagesController.sendMessage);
router.post('/conversations/:id/read', MessagesController.markAsRead);
router.patch('/requests/:id/status', MessagesController.updateViewingRequestStatus);
router.post('/conversations/:id/report', MessagesController.reportConversation);

export default router;
