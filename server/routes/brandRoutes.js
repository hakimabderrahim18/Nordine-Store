import express from 'express';
import {
  getBrands,
  getAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brandController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getBrands)
  .post(protect, admin, uploadImages('logo', 1), createBrand);

router.get('/admin', protect, admin, getAdminBrands);

router.route('/:id')
  .put(protect, admin, uploadImages('logo', 1), updateBrand)
  .delete(protect, admin, deleteBrand);

export default router;
