import express from 'express';
import {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, admin, uploadImages('image', 1), createCategory);

router.get('/admin', protect, admin, getAdminCategories);

router.route('/:id')
  .put(protect, admin, uploadImages('image', 1), updateCategory)
  .delete(protect, admin, deleteCategory);

export default router;
