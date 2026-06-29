import Wishlist from '../models/Wishlist.js';

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name price discountPrice images stock sku brand rating',
      populate: { path: 'brand', select: 'name' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.json({ success: true, wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item in wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.includes(productId);

    if (exists) {
      // Remove
      wishlist.products.pull(productId);
    } else {
      // Add
      wishlist.products.push(productId);
    }

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      select: 'name price discountPrice images stock sku brand rating'
    });

    res.json({ success: true, wishlist: updatedWishlist, toggled: !exists });
  } catch (error) {
    next(error);
  }
};
