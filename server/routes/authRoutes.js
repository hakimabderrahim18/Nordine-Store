import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  importUsersFromExcel,
  exportUsersToExcel
} from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword', resetPassword);
router.get('/verifyemail', verifyEmail);

router.post('/address', protect, addUserAddress);
router.put('/address/:addressId', protect, updateUserAddress);
router.delete('/address/:addressId', protect, deleteUserAddress);

// Admin User Management Routes
router.get('/users/export', protect, admin, exportUsersToExcel);

router.route('/users')
  .get(protect, admin, getAllUsers)
  .post(protect, admin, createUser);

router.route('/users/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.post('/users/import', protect, admin, upload.single('file'), importUsersFromExcel);

export default router;
