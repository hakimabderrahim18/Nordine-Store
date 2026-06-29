import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderDeliveryStatus,
  getMyOrders,
  getOrders,
  getSalesStats,
  downloadInvoice,
  deleteOrder,
  updateOrderItemsPrices,
  exportOrdersToExcel
} from '../controllers/orderController.js';
import { protect, admin, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(optionalProtect, addOrderItems)
  .get(protect, admin, getOrders);

router.get('/export', protect, admin, exportOrdersToExcel);
router.get('/myorders', protect, getMyOrders);
router.get('/stats', protect, admin, getSalesStats);

router.route('/:id')
  .get(optionalProtect, getOrderById)
  .delete(protect, admin, deleteOrder);

router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/deliver', protect, admin, updateOrderDeliveryStatus);
router.put('/:id/update-prices', protect, admin, updateOrderItemsPrices);
router.get('/:id/invoice', optionalProtect, downloadInvoice);

export default router;
