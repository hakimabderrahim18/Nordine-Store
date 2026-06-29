import Cart from '../models/Cart.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price discountPrice demiGrosPrice superGrosPrice images stock sku brand',
        populate: { path: 'brand', select: 'name' }
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart / Update item if exists
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, variant } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with EXACT same variant configuration
    const itemIndex = cart.items.findIndex(item => {
      if (item.product.toString() !== productId) return false;
      
      // Compare variant maps
      if (!variant && !item.variant) return true;
      if (!variant || !item.variant) return false;

      // Both maps exist: convert to objects and compare
      const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
      const obj2 = variant;
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => obj1[key] === obj2[key]);
    });

    if (itemIndex > -1) {
      // Product and variant exists, update quantity
      cart.items[itemIndex].quantity += Number(quantity || 1);
    } else {
      // New item
      cart.items.push({
        product: productId,
        quantity: Number(quantity || 1),
        variant
      });
    }

    await cart.save();

    // Populate and return
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice demiGrosPrice superGrosPrice images stock sku brand'
    });

    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
export const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId, quantity, variant } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    // Find the item
    const itemIndex = cart.items.findIndex(item => {
      if (item.product.toString() !== productId) return false;
      if (!variant && !item.variant) return true;
      if (!variant || !item.variant) return false;

      const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
      const obj2 = variant;
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => obj1[key] === obj2[key]);
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Number(quantity);
      await cart.save();
    } else {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice demiGrosPrice superGrosPrice images stock sku brand'
    });

    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   POST /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, variant } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    // Filter out item matching product + variant
    cart.items = cart.items.filter(item => {
      const isSameProduct = item.product.toString() === productId;
      if (!isSameProduct) return true;

      // Same product, check if variants match to delete.
      // If we match variants exactly, filter it out. If variants differ, keep it.
      if (!variant && !item.variant) return false; // delete
      if (!variant || !item.variant) return true; // keep

      const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
      const obj2 = variant;
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return true; // keep
      const isMatch = keys1.every(key => obj1[key] === obj2[key]);
      return !isMatch; // false to delete, true to keep
    });

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice demiGrosPrice superGrosPrice images stock sku brand'
    });

    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
