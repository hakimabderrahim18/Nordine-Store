import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories (including inactive, for Admin)
// @route   GET /api/categories/admin
// @access  Private/Admin
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let image = req.body.image || '';
    if (!image) {
      const nameUpper = name.toUpperCase();
      image = '/uploads/spare_part.png';
      if (nameUpper === 'BAT') {
        image = '/uploads/battery.png';
      } else if (nameUpper === 'GLASS' || nameUpper === 'T GLASS') {
        image = '/uploads/glass.png';
      } else if (nameUpper === 'POCH') {
        image = '/uploads/pouch.png';
      } else if (nameUpper === 'MATERIEL') {
        image = '/uploads/connecteur.png';
      }
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400);
      throw new Error('Category already exists');
    }

    const category = await Category.create({
      name,
      description,
      image
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const { name, description, status } = req.body;
    const image = req.body.image || category.image;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name || category.name,
        description: description || category.description,
        image,
        status: status || category.status
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      res.status(400);
      throw new Error('Cannot delete category with associated products');
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
