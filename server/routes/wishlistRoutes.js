import express from 'express';
import {
  getWishlist,
  toggleWishlistItem
} from '../controllers/wishlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getWishlist);

router.post('/:productId', protect, toggleWishlistItem);

export default router;
