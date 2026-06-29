import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  readAllNotifications,
  deleteNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications)
  .delete(protect, deleteNotifications);

router.put('/read-all', protect, readAllNotifications);
router.put('/:id/read', protect, markNotificationAsRead);

export default router;
