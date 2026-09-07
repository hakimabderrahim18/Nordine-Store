import express from 'express';
import {
  getCarouselImages,
  addCarouselImage,
  deleteCarouselImage
} from '../controllers/carouselController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCarouselImages)
  .post(protect, admin, uploadImages('image', 1), addCarouselImage);

router.route('/:id')
  .delete(protect, admin, deleteCarouselImage);

export default router;
