import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

// @desc    Get all active brands
// @route   GET /api/brands
// @access  Public
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all brands (including inactive, for Admin)
// @route   GET /api/brands/admin
// @access  Private/Admin
export const getAdminBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let logo = req.body.logo || '';
    if (!logo) {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('samsung')) {
        logo = '/uploads/samsung_logo.png';
      } else if (nameLower.includes('apple') || nameLower.includes('iphone')) {
        logo = '/uploads/apple_logo.png';
      } else if (nameLower.includes('xiaomi')) {
        logo = '/uploads/xiaomi_logo.png';
      } else if (nameLower.includes('redmi')) {
        logo = '/uploads/redmi_logo.png';
      } else if (nameLower.includes('oneplus')) {
        logo = '/uploads/oneplus_logo.png';
      } else if (nameLower.includes('sony')) {
        logo = '/uploads/sony_logo.png';
      } else if (nameLower.includes('oppo')) {
        logo = '/uploads/oppo_logo.png';
      } else if (nameLower.includes('huawei')) {
        logo = '/uploads/huawei_logo.png';
      } else {
        logo = '/uploads/samsung_logo.png';
      }
    }

    const brandExists = await Brand.findOne({ name });
    if (brandExists) {
      res.status(400);
      throw new Error('Brand already exists');
    }

    const brand = await Brand.create({
      name,
      description,
      logo
    });

    res.status(201).json({ success: true, brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    const { name, description, status } = req.body;
    const logo = req.body.logo || brand.logo;

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name: name || brand.name,
        description: description || brand.description,
        logo,
        status: status || brand.status
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, brand: updatedBrand });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    // Check if brand has products
    const productsCount = await Product.countDocuments({ brand: req.params.id });
    if (productsCount > 0) {
      res.status(400);
      throw new Error('Cannot delete brand with associated products');
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};
