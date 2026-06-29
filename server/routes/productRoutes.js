import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  respondToReview,
  importProducts,
  exportProducts,
  bulkDeleteProducts
} from '../controllers/productController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { uploadImages, uploadExcel } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/import', protect, admin, uploadExcel, importProducts);
router.get('/export', protect, admin, exportProducts);
router.post('/bulk-delete', protect, admin, bulkDeleteProducts);

router.route('/')
  .get(getProducts)
  .post(protect, admin, uploadImages('images', 5), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, uploadImages('images', 5), updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

router.put('/reviews/:reviewId/respond', protect, admin, respondToReview);

export default router;
