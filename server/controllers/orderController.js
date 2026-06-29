import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import XLSX from 'xlsx';

// Helper to notify via socket.io
const emitToAdmins = (req, event, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.emit(event, data);
  }
};

const emitToUser = (req, userId, event, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    let itemsPrice = 0;
    const verifiedItems = [];

    // Verify products & price in Database to avoid client tampering
    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        res.status(404);
        throw new Error(`Product not found: ${item.name}`);
      }

      if (dbProduct.stock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for product: ${dbProduct.name}`);
      }

      let activePrice = dbProduct.discountPrice || dbProduct.price;
      if (req.user) {
        if (req.user.clientType === 'demi-gros' && dbProduct.demiGrosPrice) {
          activePrice = dbProduct.demiGrosPrice;
        } else if (req.user.clientType === 'super-gros' && dbProduct.superGrosPrice) {
          activePrice = dbProduct.superGrosPrice;
        }
      }
      itemsPrice += activePrice * item.quantity;

      verifiedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        quantity: item.quantity,
        price: activePrice,
        image: dbProduct.images[0],
        variant: item.variant
      });
    }

    // Coupon calculation
    let discountPrice = 0;
    let couponUsed = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid(itemsPrice)) {
        couponUsed = coupon._id;
        if (coupon.discountType === 'percentage') {
          discountPrice = (itemsPrice * coupon.discountValue) / 100;
        } else {
          discountPrice = coupon.discountValue;
        }
        // Deduct/Apply safety limit
        discountPrice = Math.min(discountPrice, itemsPrice);
        
        // Increment coupon use
        coupon.usageCount += 1;
        await coupon.save();
      }
    }

    // Shipping calculation
    const clientShippingPrice = Number(req.body.shippingPrice);
    const shippingPrice = !isNaN(clientShippingPrice) ? clientShippingPrice : (itemsPrice > 15000 ? 0 : 800);
    const totalPrice = itemsPrice + shippingPrice - discountPrice;

    // Check if authenticated user or guest visitor
    const isGuest = !req.user;
    let guestInfo = null;

    if (isGuest) {
      const { name, phone, wilaya } = req.body.guestInfo || {};
      if (!name || !phone || !wilaya) {
        res.status(400);
        throw new Error('Guest checkout requires Name, Phone number, and Wilaya.');
      }
      guestInfo = { name, phone, wilaya };
    }

    // Create order structure
    const orderData = {
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      couponUsed,
      isPaid: paymentMethod === 'COD' ? false : true,
      paidAt: paymentMethod === 'COD' ? undefined : new Date(),
      isGuest,
      deliveryType: req.body.deliveryType || 'À Domicile'
    };

    if (!isGuest) {
      orderData.user = req.user._id;
    } else {
      orderData.guestInfo = guestInfo;
    }

    const order = await Order.create(orderData);

    // Decrement stock levels
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Empty User's Cart (only if logged in)
    if (!isGuest) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    const customerName = isGuest ? guestInfo.name : req.user.name;

    // Create DB Notifications
    await Notification.create({
      title: 'New Order Placed',
      message: `Order #${order._id.toString().substring(18).toUpperCase()} has been placed by ${customerName} (${totalPrice.toLocaleString()} DA)`,
      type: 'order'
    });

    if (!isGuest) {
      await Notification.create({
        user: req.user._id,
        title: 'Order Confirmation',
        message: `Your order #${order._id.toString().substring(18).toUpperCase()} has been received.`,
        type: 'order'
      });
    }

    // Realtime Notifications via Socket.io
    emitToAdmins(req, 'newOrder', {
      orderId: order._id,
      customerName: customerName,
      totalPrice: order.totalPrice
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('orderItems.product');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isAdmin = req.user && req.user.role === 'admin';

    if (order.isGuest) {
      const checkPhone = req.query.phone || req.headers['x-guest-phone'];
      const orderPhone = order.guestInfo?.phone;

      if (!isAdmin && (!checkPhone || checkPhone !== orderPhone)) {
        res.status(403);
        throw new Error('Not authorized to view this guest order. Please verify order ID and phone number.');
      }
    } else {
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized to view this order. Please sign in.');
      }
      if (!isAdmin && (!order.user || order.user._id.toString() !== req.user._id.toString())) {
        res.status(403);
        throw new Error('Not authorized to view this order');
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to Paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address
    };

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order delivery status
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderDeliveryStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.deliveryStatus = status || order.deliveryStatus;
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid) {
        order.paidAt = Date.now();
      } else {
        order.paidAt = undefined;
      }
    }

    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      // If COD, mark as paid when delivered
      if (order.paymentMethod === 'COD') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    const updatedOrder = await order.save();

    // Create notification for client
    await Notification.create({
      user: order.user,
      title: `Order Status: ${status}`,
      message: `Your order #${order._id.toString().substring(18).toUpperCase()} status has been updated to ${status}.`,
      type: 'order'
    });

    emitToUser(req, order.user, 'orderUpdate', {
      orderId: order._id,
      status: order.deliveryStatus
    });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales & Business Analytics Stats
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getSalesStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Revenue sum (excluding cancelled orders)
    const matchStage = { deliveryStatus: { $ne: 'cancelled' } };
    if (dateFilter.createdAt) {
      matchStage.createdAt = dateFilter.createdAt;
    }

    const revenueObj = await Order.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalSales: { $sum: { $subtract: ['$totalPrice', '$shippingPrice'] } } } }
    ]);
    const totalRevenue = revenueObj.length > 0 ? revenueObj[0].totalSales : 0;

    // Monthly aggregation
    const monthlyStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: '$createdAt' },
          sales: { $sum: { $subtract: ['$totalPrice', '$shippingPrice'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map month integers to month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthlyStats.map(item => ({
      month: monthNames[item._id - 1],
      sales: Math.round(item.sales),
      orders: item.orders
    }));

    // Status breakup
    const statusMatchStage = {};
    if (dateFilter.createdAt) {
      statusMatchStage.createdAt = dateFilter.createdAt;
    }
    const statusCounts = await Order.aggregate([
      { $match: statusMatchStage },
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        statusBreakup: statusCounts,
        chartData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Invoice PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
export const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isAdmin = req.user && req.user.role === 'admin';

    if (order.isGuest) {
      const checkPhone = req.query.phone || req.headers['x-guest-phone'];
      const orderPhone = order.guestInfo?.phone;

      if (!isAdmin && (!checkPhone || checkPhone !== orderPhone)) {
        res.status(403);
        throw new Error('Not authorized to view this invoice. Please verify order ID and phone number.');
      }
    } else {
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized to view this invoice. Please sign in.');
      }
      if (!isAdmin && (!order.user || order.user._id.toString() !== req.user._id.toString())) {
        res.status(403);
        throw new Error('Not authorized to view this invoice');
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order._id.toString().substring(18).toUpperCase()}.pdf`
    );

    generateInvoicePDF(order, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order items prices
// @route   PUT /api/orders/:id/update-prices
// @access  Private/Admin
export const updateOrderItemsPrices = async (req, res, next) => {
  try {
    const { updatedItems } = req.body; // e.g. [ { itemId: '...', price: 1200 }, ... ]
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    let newItemsPrice = 0;
    for (const item of order.orderItems) {
      const match = updatedItems.find(u => u.itemId === item._id.toString());
      if (match) {
        item.price = match.price;
      }
      newItemsPrice += item.price * item.quantity;
    }

    order.itemsPrice = newItemsPrice;
    order.totalPrice = newItemsPrice + order.shippingPrice - order.discountPrice;

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Export orders to Excel file
// @route   GET /api/orders/export
// @access  Private/Admin
export const exportOrdersToExcel = async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    const data = orders.map(order => {
      // Create a summary of ordered items
      const itemsSummary = order.orderItems.map(item => {
        const variantInfo = item.variant 
          ? ` (${Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')})`
          : '';
        return `${item.quantity}x ${item.name}${variantInfo}`;
      }).join(' | ');

      return {
        "Numéro de Commande": order._id.toString(),
        "Date": order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : 'N/A',
        "Nom Client": order.shippingAddress?.name || order.guestInfo?.name || 'N/A',
        "Téléphone": order.shippingAddress?.phone || order.guestInfo?.phone || 'N/A',
        "Wilaya": order.guestInfo?.wilaya || order.shippingAddress?.state || 'N/A',
        "Adresse / Commune": order.shippingAddress?.street || 'N/A',
        "Type de Livraison": order.deliveryType || 'N/A',
        "Articles": itemsSummary,
        "Prix Articles (DA)": order.itemsPrice || 0,
        "Frais de Livraison (DA)": order.shippingPrice || 0,
        "Réduction (DA)": order.discountPrice || 0,
        "Total Commande (DA)": order.totalPrice || 0,
        "Statut de Paiement": order.isPaid ? "Payé" : "Non Payé",
        "Statut de Livraison": order.status || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=commandes_nordinestore.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
