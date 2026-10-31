import express from 'express';
import {
  getActivePromotions,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  togglePromotionActive,
  deletePromotion
} from '../controllers/promotionController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getActivePromotions);

// Admin routes
router.get('/all', protect, admin, getAllPromotions);
router.post('/', protect, admin, uploadImages('image', 1), createPromotion);
router.put('/:id', protect, admin, uploadImages('image', 1), updatePromotion);
router.patch('/:id/toggle', protect, admin, togglePromotionActive);
router.delete('/:id', protect, admin, deletePromotion);

export default router;
