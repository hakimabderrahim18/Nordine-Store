import fs from 'fs';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import SyncHistory from '../models/SyncHistory.js';

// @desc    Get all products (with filters & search)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { keyword, model, brand, category, minPrice, maxPrice, inStock, sort, page = 1, limit = 12 } = req.query;

    const query = {};
    const andConditions = [];

    // Helper to build flexible alias patterns for brand, spare part synonyms, and model terms
    const buildSearchPattern = (token) => {
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const upper = token.toUpperCase().trim();

      // Common Spare Part Synonyms (French, English, Arabic)
      // Screens / Displays / Afficheurs / Dalles
      if (/^(LCD|ECRANS?|AFFICHEURS?|SCREENS?|DISPLAYS?|DALLES?|شاشة|شاشات)$/i.test(upper)) {
        return '(?:AFFICHEUR|ECRAN|LCD|SCREEN|DALLE|DISPLAY|شاشة|شاشات)';
      }

      // Batteries / Accus
      if (/^(BATTERIES?|BAT|BATTERYS?|ACCUS?|PILES?|بطارية|بطاريات)$/i.test(upper)) {
        return '(?:BATTERIE|BATTERY|BAT\\b|ACCU|بطارية|بطاريات)';
      }

      // Flex / Ribbon / Nappes
      if (/^(NAPPES?|NAP|FLEX|RIBBONS?)$/i.test(upper)) {
        return '(?:NAPPE|NAP\\b|FLEX)';
      }

      // Glass / Vitre / Tactile / Touch
      if (/^(VITRES?|GLASS|VERRES?|TACTILES?|TOUCH|TGLASS|T-GLASS)$/i.test(upper)) {
        return '(?:VITRE|GLASS|VERRE|TACTILE|TOUCH|T[\\s\\-_]*GLASS)';
      }

      // Connectors / Charging port / Sub-board
      if (/^(CONNECTEURS?|CONNECTORS?|CON|SUB|SUB-?BOARD|PORTS?|CHARGES?|CHARGEURS?|CHARGERS?)$/i.test(upper)) {
        return '(?:CONNECTEUR|CONNECTOR|CON\\b|SUB|CHARGE|CHARGEUR|CHARGER)';
      }

      // Buzzer / Speaker / Loudspeaker / Earphone
      if (/^(BUZZERS?|SPEAKERS?|HAUT-?PARLEURS?|HP|ECOUTEURS?|BAFLES?|بوزر)$/i.test(upper)) {
        return '(?:BUZZER|SPEAKER|HAUT[\\s\\-_]*PARLEUR|HP\\b|ECOUTEUR|BAFLE|بوزر)';
      }

      // SIM Tray / Tiroir SIM
      if (/^(TIROIRS?|TRAYS?|SIM)$/i.test(upper)) {
        return '(?:TIROIR|TRAY|SIM)';
      }

      // Chassis / Frame / Middle / Back cover / Cache / Coque
      if (/^(CHASSIS|FRAMES?|MIDDLES?|CACHES?|COQUES?|HOUSINGS?|ARRIERE)$/i.test(upper)) {
        return '(?:CHASSIS|FRAME|MIDDLE|CACHE|COQUE|HOUSING)';
      }

      // Camera / Lentille / Lens
      if (/^(CAMERAS?|CAM|LENTILLES?|LENS)$/i.test(upper)) {
        return '(?:CAMERA|CAM\\b|LENTILLE|LENS)';
      }

      // Brands and common brand abbreviations
      if (upper === 'IPHONE' || upper === 'IPH' || upper === 'APPLE') return '(?:APPLE|IPHONE|IPH)';
      if (upper === 'SAMSUNG' || upper === 'SAM') return '(?:SAMSUNG|SAM)';
      if (upper === 'HUAWEI' || upper === 'HW' || upper === 'HONOR') return '(?:HUAWEI|HW|HONOR)';
      if (upper === 'REALME' || upper === 'REALM' || upper === 'RLM' || upper === 'NARZO') return '(?:REALME|REALM|RLM|NARZO)';
      if (upper === 'CONDOR') return '(?:CONDOR)';
      if (upper === 'REDMI' || upper === 'REDM' || upper === 'RED' || upper === 'XIAOMI' || upper === 'MI' || upper === 'POCO') return '(?:XIAOMI|MI\\b|REDMI|REDM|RED\\b|POCO)';
      if (upper === 'INFINIX' || upper === 'INF') return '(?:INFINIX|INF)';
      if (upper === 'OPPO' || upper === 'OPP' || upper === 'RENO') return '(?:OPPO|OPP|RENO)';
      if (upper === 'MOTOROLA' || upper === 'MOTO') return '(?:MOTOROLA|MOTO)';
      if (upper === 'TECNO') return '(?:TECNO)';
      if (upper === 'SONY') return '(?:SONY)';
      if (upper === 'VIVO') return '(?:VIVO)';
      if (upper === 'ONEPLUS' || upper === '1+') return '(?:ONEPLUS|ONE\\s*PLUS|1\\+)';

      // Models with letters and numbers (e.g. A5S, S25, NOTE9, A05S, M14, P40, A12, etc.)
      const modelMatch = upper.match(/^([A-Z]+)[\s\-_/]*(\d+)[\s\-_/]*([A-Z]*)$/i);
      if (modelMatch) {
        const [, prefix, num, suffix] = modelMatch;
        return `${escapeRegex(prefix)}[\\s\\-_/]*${escapeRegex(num)}${suffix ? '[\\s\\-_/]*' + escapeRegex(suffix) : ''}`;
      }

      // Handle digit models with optional 'G' suffix (e.g., iPhone 8 / 8G, 7 / 7G, 6 / 6G)
      if (/^[4-9]$/.test(upper)) return `(?:${upper}|${upper}G)`;
      if (/^[4-9]G$/.test(upper)) return `(?:${upper}|${upper.slice(0, -1)})`;

      return escapeRegex(token);
    };

    // Device / Model smart search query (handles brand names, model numbers, and multi-word models like "S25 Ultra", "Samsung S25", "Oppo A77", "A12")
    if (model && model.trim()) {
      const cleanModel = model.replace(/[/,\-_]+/g, ' ').trim();
      const tokens = cleanModel.split(/\s+/).filter(Boolean);

      const uniquePatterns = [...new Set(tokens.map(t => buildSearchPattern(t)))];

      const modelConditions = uniquePatterns.map((pattern) => {
        const regex = new RegExp(pattern, 'i');
        return {
          $or: [
            { name: regex },
            { description: regex },
            { sku: regex }
          ]
        };
      });

      andConditions.push(...modelConditions);
    }

    // Enhanced regex search for partial matching (supports multi-term out-of-order search, phone models & category/brand resolution)
    if (keyword && keyword.trim()) {
      const terms = keyword.trim().split(/\s+/).filter(Boolean);

      // Pre-fetch matching categories and brands for the search terms
      const catPromises = terms.map(t => {
        const p = buildSearchPattern(t);
        return Category.find({ name: new RegExp(p, 'i') }).select('_id');
      });
      const brandPromises = terms.map(t => {
        const p = buildSearchPattern(t);
        return Brand.find({ name: new RegExp(p, 'i') }).select('_id');
      });

      const [catResults, brandResults] = await Promise.all([
        Promise.all(catPromises),
        Promise.all(brandPromises)
      ]);

      terms.forEach((t, idx) => {
        const regexPattern = buildSearchPattern(t);
        const regex = new RegExp(regexPattern, 'i');
        const orConditions = [
          { name: regex },
          { sku: regex },
          { description: regex }
        ];

        const matchingCatIds = (catResults[idx] || []).map(c => c._id);
        if (matchingCatIds.length > 0) {
          orConditions.push({ category: { $in: matchingCatIds } });
        }

        const matchingBrandIds = (brandResults[idx] || []).map(b => b._id);
        if (matchingBrandIds.length > 0) {
          orConditions.push({ brand: { $in: matchingBrandIds } });
        }

        andConditions.push({
          $or: orConditions
        });
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Filters
    if (brand) {
      query.brand = brand; // ObjectId
    }

    if (category) {
      query.category = category; // ObjectId
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Setup sorting
    let sortOptions = {};
    if (sort === 'priceAsc') {
      sortOptions = { price: 1 };
    } else if (sort === 'priceDesc') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else {
      // Default sort (newest)
      sortOptions = { createdAt: -1 };
    }

    const skipCount = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skipCount)
      .limit(Number(limit))
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo');

    const totalCount = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      page: Number(page),
      pages: Math.ceil(totalCount / Number(limit)),
      totalProducts: totalCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo');

    if (product) {
      res.json({ success: true, product });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

export const normalizeAfficheurName = (name) => {
  if (!name || typeof name !== 'string') return name;
  let s = name;
  // Replace 'AFFICHEUR LCD', 'ECRAN LCD', 'LCD', 'ECRAN' with 'AFFICHEUR'
  s = s.replace(/\b(AFFICHEUR\s+LCD|ECRAN\s+LCD|LCD|ECRAN)\b/gi, 'AFFICHEUR');
  // Clean multiple consecutive duplicated words
  s = s.replace(/\b(AFFICHEUR\s+)+AFFICHEUR\b/gi, 'AFFICHEUR');
  // Clean whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { name: rawName, sku, price, discountPrice, demiGrosPrice, superGrosPrice, priceDetail, priceDetailReparation, priceReparation, priceDemiGros, priceSuperGros, pricePromo, description, longDescription, category, brand, stock, variants, specifications, isFeatured } = req.body;
    const name = normalizeAfficheurName(rawName);

    const productExists = await Product.findOne({ sku });
    if (productExists) {
      res.status(400);
      throw new Error('Product with this SKU already exists');
    }

    // Images from upload middleware
    let resolvedImages = req.body.images;
    if (typeof resolvedImages === 'string') {
      resolvedImages = [resolvedImages];
    } else if (!Array.isArray(resolvedImages)) {
      resolvedImages = [];
    }

    if (resolvedImages.length === 0) {
      let categoryName = '';
      if (category) {
        const catDoc = await Category.findById(category);
        if (catDoc) categoryName = catDoc.name.toUpperCase();
      }
      
      let imagePath = '/uploads/spare_part.png';
      if (categoryName === 'BAT') {
        imagePath = '/uploads/battery.png';
      } else if (categoryName === 'GLASS' || categoryName === 'T GLASS') {
        imagePath = '/uploads/glass.png';
      } else if (categoryName === 'POCH') {
        imagePath = '/uploads/pouch.png';
      } else if (categoryName === 'MATERIEL') {
        imagePath = '/uploads/connecteur.png';
      }
      resolvedImages = [imagePath];
    }

    const product = await Product.create({
      name,
      sku,
      price: price !== undefined ? Number(price) : (priceDetail !== undefined ? Number(priceDetail) : 0),
      discountPrice: discountPrice !== undefined ? Number(discountPrice) : (pricePromo !== undefined ? Number(pricePromo) : 0),
      demiGrosPrice: demiGrosPrice !== undefined ? Number(demiGrosPrice) : (priceDemiGros !== undefined ? Number(priceDemiGros) : 0),
      superGrosPrice: superGrosPrice !== undefined ? Number(superGrosPrice) : (priceSuperGros !== undefined ? Number(priceSuperGros) : 0),
      priceDetail: priceDetail !== undefined ? Number(priceDetail) : (price !== undefined ? Number(price) : 0),
      priceDetailReparation: priceDetailReparation !== undefined ? Number(priceDetailReparation) : 0,
      priceReparation: priceReparation !== undefined ? Number(priceReparation) : 0,
      priceDemiGros: priceDemiGros !== undefined ? Number(priceDemiGros) : (demiGrosPrice !== undefined ? Number(demiGrosPrice) : 0),
      priceSuperGros: priceSuperGros !== undefined ? Number(priceSuperGros) : (superGrosPrice !== undefined ? Number(superGrosPrice) : 0),
      pricePromo: pricePromo !== undefined ? Number(pricePromo) : (discountPrice !== undefined ? Number(discountPrice) : 0),
      description,
      longDescription,
      category: category || null,
      brand: brand || null,
      stock,
      images: resolvedImages,
      variants: typeof variants === 'string' ? JSON.parse(variants) : variants,
      specifications: typeof specifications === 'string' ? JSON.parse(specifications) : specifications,
      isFeatured: isFeatured === 'true' || isFeatured === true
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const { name: rawName, sku, price, discountPrice, demiGrosPrice, superGrosPrice, priceDetail, priceDetailReparation, priceReparation, priceDemiGros, priceSuperGros, pricePromo, description, longDescription, category, brand, stock, variants, specifications, isFeatured } = req.body;
    const name = rawName !== undefined ? normalizeAfficheurName(rawName) : undefined;

    // Handle image lists. If new images are uploaded, append or replace them
    let imageList = product.images || [];

    // If existingImages list is sent, respect it as the baseline (handles deletions)
    if (req.body.existingImages) {
      try {
        imageList = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch (err) {
        if (Array.isArray(req.body.existingImages)) {
          imageList = req.body.existingImages;
        } else if (typeof req.body.existingImages === 'string') {
          imageList = [req.body.existingImages];
        }
      }
    }

    // If new images are uploaded, append them
    if (req.body.images) {
      const newImages = typeof req.body.images === 'string' ? [req.body.images] : req.body.images;
      imageList = [...imageList, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || product.name,
        sku: sku || product.sku,
        price: price !== undefined ? Number(price) : (priceDetail !== undefined ? Number(priceDetail) : product.price),
        discountPrice: discountPrice !== undefined ? Number(discountPrice) : (pricePromo !== undefined ? Number(pricePromo) : product.discountPrice),
        demiGrosPrice: demiGrosPrice !== undefined ? Number(demiGrosPrice) : (priceDemiGros !== undefined ? Number(priceDemiGros) : product.demiGrosPrice),
        superGrosPrice: superGrosPrice !== undefined ? Number(superGrosPrice) : (priceSuperGros !== undefined ? Number(priceSuperGros) : product.superGrosPrice),
        priceDetail: priceDetail !== undefined ? Number(priceDetail) : (price !== undefined ? Number(price) : product.priceDetail),
        priceDetailReparation: priceDetailReparation !== undefined ? Number(priceDetailReparation) : product.priceDetailReparation,
        priceReparation: priceReparation !== undefined ? Number(priceReparation) : product.priceReparation,
        priceDemiGros: priceDemiGros !== undefined ? Number(priceDemiGros) : (demiGrosPrice !== undefined ? Number(demiGrosPrice) : product.priceDemiGros),
        priceSuperGros: priceSuperGros !== undefined ? Number(priceSuperGros) : (superGrosPrice !== undefined ? Number(superGrosPrice) : product.priceSuperGros),
        pricePromo: pricePromo !== undefined ? Number(pricePromo) : (discountPrice !== undefined ? Number(discountPrice) : product.pricePromo),
        description: description || product.description,
        longDescription: longDescription || product.longDescription,
        category: category || product.category,
        brand: brand || product.brand,
        stock: stock !== undefined ? stock : product.stock,
        images: imageList,
        variants: variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : product.variants,
        specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : product.specifications,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await Product.findByIdAndDelete(req.params.id);
    // Delete reviews associated with product
    await Review.deleteMany({ product: req.params.id });

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
export const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400);
      throw new Error('Veuillez fournir une liste d\'identifiants de produits valides');
    }

    await Product.deleteMany({ _id: { $in: ids } });
    await Review.deleteMany({ product: { $in: ids } });

    res.json({ success: true, message: `${ids.length} produits supprimés avec succès` });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const alreadyReviewed = await Review.findOne({ user: req.user._id, product: productId });
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed by you');
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      comment
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to review
// @route   PUT /api/products/reviews/:reviewId/respond
// @access  Private/Admin
export const respondToReview = async (req, res, next) => {
  try {
    const { response } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.response = response;
    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Import products from Excel/CSV
// @route   POST /api/products/import
// @access  Private/Admin
export const importProducts = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez sélectionner un fichier Excel (.xls, .xlsx) ou CSV valide'
      });
    }

    filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Le fichier est vide ou ne contient aucune ligne valide'
      });
    }

    const parsePrice = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleanStr = val.toString().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    const getVal = (row, possibleKeys, defaultVal = '') => {
      for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
        const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const rowKey of Object.keys(row)) {
          const normalizedRowKey = rowKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
          if (normalizedRowKey === normalizedKey) {
            return row[rowKey];
          }
        }
      }
      return defaultVal;
    };

    const KNOWN_BRANDS = [
      'SAMSUNG', 'IPHONE', 'APPLE', 'OPPO', 'REALME', 'XIAOMI', 'REDMI', 'POCO',
      'INFINIX', 'TECNO', 'ITEL', 'HUAWEI', 'HONOR', 'VIVO', 'ONEPLUS', 'NOKIA',
      'CONDOR', 'LENOVO', 'MOTOROLA', 'LG', 'SONY', 'ASUS', 'ZTE', 'GOOGLE'
    ];

    // 1. Preload all categories & brands in memory
    const [allCategories, allBrands, existingProducts] = await Promise.all([
      Category.find({}),
      Brand.find({}),
      Product.find({}, '_id sku name images stock')
    ]);

    const categoryMap = new Map();
    allCategories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c._id));

    const brandMap = new Map();
    allBrands.forEach(b => brandMap.set(b.name.trim().toLowerCase(), b._id));

    const skuMap = new Map();
    const nameMap = new Map();
    existingProducts.forEach(p => {
      if (p.sku) skuMap.set(p.sku.trim().toLowerCase(), p);
      if (p.name) nameMap.set(p.name.trim().toLowerCase(), p);
    });

    // Helper to get or create category ID
    const getCategoryId = async (catName) => {
      if (!catName) return null;
      const lower = catName.trim().toLowerCase();
      if (categoryMap.has(lower)) return categoryMap.get(lower);
      try {
        const newCat = await Category.create({ name: catName.trim() });
        categoryMap.set(lower, newCat._id);
        return newCat._id;
      } catch (err) {
        const found = await Category.findOne({ name: { $regex: new RegExp(`^${catName.trim()}$`, 'i') } });
        if (found) {
          categoryMap.set(lower, found._id);
          return found._id;
        }
        return null;
      }
    };

    // Helper to get or create brand ID
    const getBrandId = async (bName) => {
      const brandToUse = bName && bName.toLowerCase() !== 'generique' ? bName.trim() : 'GENERIQUE';
      const lower = brandToUse.toLowerCase();
      if (brandMap.has(lower)) return brandMap.get(lower);
      try {
        const newBrand = await Brand.create({ name: brandToUse });
        brandMap.set(lower, newBrand._id);
        return newBrand._id;
      } catch (err) {
        const found = await Brand.findOne({ name: { $regex: new RegExp(`^${brandToUse}$`, 'i') } });
        if (found) {
          brandMap.set(lower, found._id);
          return found._id;
        }
        return null;
      }
    };

    const bulkOps = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom', 'article', 'description', 'titre', 'produit']);
      if (!nameVal || !nameVal.toString().trim()) continue;
      const name = normalizeAfficheurName(nameVal.toString().trim());

      const skuVal = getVal(row, ['Réf produit', 'Rf produit', 'sku', 'ref', 'reference', 'code', 'ref produit', 'référence']);
      let sku = skuVal ? skuVal.toString().trim() : '';

      const stockRaw = getVal(row, ['Stock ( Unité )', 'Stock (Unité)', 'Stock (Unite)', 'Stock ( unite )', 'Stock', 'stock', 'qte', 'quantite', 'quantité', 'unite', 'unités']);
      let parsedStock = null;
      if (stockRaw !== '' && stockRaw !== undefined && stockRaw !== null) {
        const val = parseInt(parsePrice(stockRaw), 10);
        if (!isNaN(val)) {
          parsedStock = val;
        }
      }

      const priceDetail = parsePrice(getVal(row, ['Prix 1 TTC', 'Prix 1', 'Prix1 TTC', 'Prix1', 'detail', 'prix detail', 'price', 'priceDetail', 'prix']));
      const priceDetailReparation = parsePrice(getVal(row, ['REPARATION TTC', 'REPARATION', 'Prix 2 TTC', 'Prix 2', 'Prix2 TTC', 'Prix2', 'detail reparation', 'priceDetailReparation', 'prix reparation']));
      const priceReparation = parsePrice(getVal(row, ['Prix 5 TTC', 'Prix 5', 'Prix5 TTC', 'Prix5', 'reparation', 'priceReparation', 'reparateur', 'prix 5']));
      const priceDemiGros = parsePrice(getVal(row, ['DEMI GROS TTC', 'DEMI GROS', 'DEMIGROS TTC', 'demi gros', 'demigros', 'priceDemiGros', 'prix demi gros']));
      const priceSuperGros = parsePrice(getVal(row, ['SUPER GROS TTC', 'SUPER GROS', 'SUPERGROS TTC', 'super gros', 'supergros', 'priceSuperGros', 'prix super gros']));
      const pricePromo = parsePrice(getVal(row, ['Prix Promo TTC', 'Prix Promo', 'promo', 'prix promo', 'pricePromo', 'discountPrice', 'prix promo ttc']));
      
      let famille = getVal(row, ['Famille', 'category', 'famille', 'categorie', 'catégorie'], '').toString().trim();
      let sousFamille = getVal(row, ['Sous famille', 'sous-famille', 'subcategory', 'sousFamille', 'sous categorie', 'sous-catégorie'], '').toString().trim();
      let marqueStr = getVal(row, ['Marque', 'brand', 'marque'], '').toString().trim();
      const imageVal = getVal(row, ['Image', 'image', 'images', 'photo', 'lien image', 'photos'], '').toString().trim();

      if (famille.toUpperCase() === 'ECRAN' || famille.toUpperCase() === 'LCD') {
        famille = 'AFFICHEUR';
      }

      if (!marqueStr || marqueStr === 'NaN' || marqueStr === 'nan' || marqueStr.toLowerCase() === 'generique') {
        const upperName = name.toUpperCase();
        for (const b of KNOWN_BRANDS) {
          const regex = new RegExp(`\\b${b}\\b`, 'i');
          if (regex.test(upperName)) {
            marqueStr = b;
            break;
          }
        }
      }

      if (!famille || famille === 'PIECE') {
        const upperName = name.toUpperCase();
        if (upperName.includes('BUZZER')) {
          famille = 'BUZZER';
        } else if (upperName.includes('AFFICHEUR') || upperName.includes('ECRAN') || upperName.includes('LCD') || upperName.includes('OLED') || upperName.includes('DISPLAY')) {
          famille = 'AFFICHEUR';
        } else if (upperName.includes('BATTERIE') || upperName.includes('BAT ')) {
          famille = 'BATTERIE';
        } else if (upperName.includes('CONNECTEUR') || upperName.includes('CHARGE') || upperName.includes('NAPPE')) {
          famille = 'CONNECTEUR';
        } else if (upperName.includes('VITRE') || upperName.includes('TACTILE') || upperName.includes('GLASS')) {
          famille = 'GLASS';
        } else if (upperName.includes('POCHETTE') || upperName.includes('COQUE') || upperName.includes('ETUI')) {
          famille = 'POCHETTE';
        } else if (upperName.includes('CAM') || upperName.includes('CAMERA')) {
          famille = 'CAMERA';
        } else if (upperName.includes('ECOUTEUR') || upperName.includes('HAUT-PARLEUR') || upperName.includes('HP')) {
          famille = 'AUDIO';
        } else {
          famille = 'PIECE';
        }
      }

      const categoryId = await getCategoryId(famille);
      const brandId = await getBrandId(marqueStr);

      let images = [];
      if (imageVal) {
        images = [imageVal];
      } else {
        const lowerName = name.toLowerCase();
        const upperFamille = famille.toUpperCase();
        let imagePath = '/uploads/spare_part.png';

        if (upperFamille === 'BAT' || upperFamille === 'BATTERIE') {
          imagePath = '/uploads/battery.png';
        } else if (upperFamille === 'GLASS' || upperFamille === 'T GLASS') {
          imagePath = '/uploads/glass.png';
        } else if (upperFamille === 'POCH' || upperFamille === 'POCHETTE') {
          imagePath = '/uploads/pouch.png';
        } else if (upperFamille === 'ACC') {
          imagePath = '/uploads/spare_part.png';
        } else if (upperFamille === 'MATERIEL') {
          imagePath = '/uploads/connecteur.png';
        } else {
          if (lowerName.includes('ecran') || lowerName.includes('oled') || lowerName.includes('lcd') || lowerName.includes('display') || lowerName.includes('vitre tactile')) {
            imagePath = '/uploads/screen.png';
          } else if (lowerName.includes('batterie') || lowerName.includes('bat ')) {
            imagePath = '/uploads/battery.png';
          } else if (lowerName.includes('connecteur') || lowerName.includes('charge') || lowerName.includes('con only') || lowerName.includes('charging') || lowerName.includes('nappe')) {
            imagePath = '/uploads/connecteur.png';
          } else if (lowerName.includes('vitre') || lowerName.includes('glass') || lowerName.includes('verre')) {
            imagePath = '/uploads/glass.png';
          } else if (lowerName.includes('pochette') || lowerName.includes('coque') || lowerName.includes('poch') || lowerName.includes('pouch') || lowerName.includes('etui')) {
            imagePath = '/uploads/pouch.png';
          } else if (lowerName.includes('outil') || lowerName.includes('tournevis') || lowerName.includes('separatrice') || lowerName.includes('machine') || lowerName.includes('souder') || lowerName.includes('station') || lowerName.includes('falcon') || lowerName.includes('mechanic') || lowerName.includes('ds01')) {
            imagePath = '/uploads/repair_tool.png';
          }
        }
        images = [imagePath];
      }

      // Check existing product
      const lowerSku = sku ? sku.toLowerCase() : '';
      const lowerName = name.toLowerCase();
      let existing = (lowerSku && skuMap.get(lowerSku)) || nameMap.get(lowerName);

      if (!sku) {
        if (existing && existing.sku) {
          sku = existing.sku;
        } else {
          const baseSlug = name.toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 35);
          sku = baseSlug || `PROD-${Date.now().toString(36).toUpperCase()}`;
        }
      }

      const effectivePrice = priceDetail || 0;
      const effectiveDemiGros = priceDemiGros || 0;
      const effectiveSuperGros = priceSuperGros || 0;
      const effectiveDiscount = pricePromo || 0;

      if (existing) {
        const updateDoc = {
          name,
          sku,
          price: effectivePrice,
          priceDetail: effectivePrice,
          priceDetailReparation,
          priceReparation,
          demiGrosPrice: effectiveDemiGros,
          priceDemiGros: effectiveDemiGros,
          superGrosPrice: effectiveSuperGros,
          priceSuperGros: effectiveSuperGros,
          discountPrice: effectiveDiscount,
          pricePromo: effectiveDiscount,
          famille,
          sousFamille,
          marque: marqueStr,
          category: categoryId,
          brand: brandId,
          isAvailable: true
        };
        if (parsedStock !== null) {
          updateDoc.stock = parsedStock;
        }
        if (imageVal || !existing.images || existing.images.length === 0) {
          updateDoc.images = images;
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: updateDoc }
          }
        });
        updatedCount++;
      } else {
        const newProduct = {
          sku,
          name,
          description: `Composant ${name}`,
          stock: parsedStock !== null ? parsedStock : 100,
          price: effectivePrice,
          priceDetail: effectivePrice,
          priceDetailReparation,
          priceReparation,
          demiGrosPrice: effectiveDemiGros,
          priceDemiGros: effectiveDemiGros,
          superGrosPrice: effectiveSuperGros,
          priceSuperGros: effectiveSuperGros,
          discountPrice: effectiveDiscount,
          pricePromo: effectiveDiscount,
          famille,
          sousFamille,
          marque: marqueStr,
          category: categoryId,
          brand: brandId,
          images,
          isAvailable: true
        };

        bulkOps.push({
          insertOne: {
            document: newProduct
          }
        });

        // Register in maps so duplicate rows in same file are handled gracefully
        const simulatedObj = { _id: new mongoose.Types.ObjectId(), sku, name, images, stock: newProduct.stock };
        if (sku) skuMap.set(sku.toLowerCase(), simulatedObj);
        nameMap.set(lowerName, simulatedObj);
        createdCount++;
      }
    }

    // Execute bulkWrite in chunks
    const BATCH_SIZE = 1000;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await Product.bulkWrite(batch, { ordered: false });
      }
    }

    // Clean temp file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      message: `Import terminé avec succès ! ${createdCount} nouveaux produits créés, ${updatedCount} produits mis à jour.`,
      createdCount,
      updatedCount
    });
  } catch (error) {
    console.error('Import Products Controller Error:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du fichier : ' + (error.message || 'Erreur serveur')
    });
  }
};

// @desc    Synchronize database with management software Excel file (verifies prices and availability)
// @route   POST /api/products/sync
// @access  Private/Admin
export const syncProducts = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez sélectionner un fichier Excel (.xls, .xlsx) ou CSV valide pour la synchronisation'
      });
    }

    filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Le fichier Excel est vide ou ne contient aucun produit'
      });
    }

    // Helper functions
    const parsePrice = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleanStr = val.toString().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    const normalizeKey = (k) => (k || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const getVal = (row, possibleKeys, defaultVal = '') => {
      for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
        const targetNorm = normalizeKey(key);
        for (const rowKey of Object.keys(row)) {
          if (normalizeKey(rowKey) === targetNorm) {
            return row[rowKey];
          }
        }
      }
      return defaultVal;
    };

    const normalizeAfficheurName = (name) => {
      if (!name || typeof name !== 'string') return name;
      let s = name;
      s = s.replace(/\b(AFFICHEUR\s+LCD|ECRAN\s+LCD|LCD|ECRAN)\b/gi, 'AFFICHEUR');
      s = s.replace(/\b(AFFICHEUR\s+)+AFFICHEUR\b/gi, 'AFFICHEUR');
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    const normalizeLookup = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

    const KNOWN_BRANDS = [
      'SAMSUNG', 'IPHONE', 'APPLE', 'OPPO', 'REALME', 'XIAOMI', 'REDMI', 'POCO',
      'INFINIX', 'TECNO', 'ITEL', 'HUAWEI', 'HONOR', 'VIVO', 'ONEPLUS', 'NOKIA',
      'CONDOR', 'LENOVO', 'MOTOROLA', 'LG', 'SONY', 'ASUS', 'ZTE', 'GOOGLE'
    ];

    // 1. Preload categories, brands, and all existing products
    const [allCategories, allBrands, allProducts] = await Promise.all([
      Category.find({}),
      Brand.find({}),
      Product.find({})
    ]);

    const categoryMap = new Map();
    allCategories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c._id));

    const brandMap = new Map();
    allBrands.forEach(b => brandMap.set(b.name.trim().toLowerCase(), b._id));

    const skuMap = new Map();
    const nameMap = new Map();
    const usedSkus = new Set();

    allProducts.forEach(p => {
      if (p.sku) {
        const normSku = normalizeLookup(p.sku);
        skuMap.set(normSku, p);
        usedSkus.add(normSku);
        usedSkus.add(p.sku.toUpperCase());
      }
      if (p.name) {
        nameMap.set(normalizeLookup(p.name), p);
        nameMap.set(normalizeLookup(normalizeAfficheurName(p.name)), p);
      }
    });

    const ensureUniqueSku = (baseCandidate, currentProductId = null) => {
      let base = (baseCandidate || 'PROD')
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (base.length > 60) {
        base = base.substring(0, 60).replace(/-+$/, '');
      }
      if (!base) base = 'PROD';

      let candidate = base;
      let counter = 1;

      while (usedSkus.has(normalizeLookup(candidate))) {
        const existingHolder = skuMap.get(normalizeLookup(candidate));
        if (currentProductId && existingHolder && existingHolder._id.toString() === currentProductId.toString()) {
          break;
        }
        candidate = `${base}-${counter}`;
        counter++;
      }

      usedSkus.add(normalizeLookup(candidate));
      usedSkus.add(candidate.toUpperCase());
      return candidate;
    };

    const getCategoryId = async (catName) => {
      if (!catName) return null;
      const lower = catName.trim().toLowerCase();
      if (categoryMap.has(lower)) return categoryMap.get(lower);
      try {
        const newCat = await Category.create({ name: catName.trim() });
        categoryMap.set(lower, newCat._id);
        return newCat._id;
      } catch (err) {
        const found = await Category.findOne({ name: { $regex: new RegExp(`^${catName.trim()}$`, 'i') } });
        if (found) {
          categoryMap.set(lower, found._id);
          return found._id;
        }
        return null;
      }
    };

    const getBrandId = async (bName) => {
      const brandToUse = bName && bName.toLowerCase() !== 'generique' ? bName.trim() : 'GENERIQUE';
      const lower = brandToUse.toLowerCase();
      if (brandMap.has(lower)) return brandMap.get(lower);
      try {
        const newBrand = await Brand.create({ name: brandToUse });
        brandMap.set(lower, newBrand._id);
        return newBrand._id;
      } catch (err) {
        const found = await Brand.findOne({ name: { $regex: new RegExp(`^${brandToUse}$`, 'i') } });
        if (found) {
          brandMap.set(lower, found._id);
          return found._id;
        }
        return null;
      }
    };

    const bulkOps = [];
    const matchedProductIds = new Set();
    const priceChangedItems = [];
    const stockChangedItems = [];
    const createdItems = [];
    const outOfStockItems = [];
    const snapshot = [];
    let priceUpdatedCount = 0;
    let inStockConfirmedCount = 0;
    let restoredStockCount = 0;
    let createdCount = 0;

    // Process each Excel row
    for (const row of rows) {
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom', 'article', 'description', 'titre', 'produit']);
      if (!nameVal || !nameVal.toString().trim()) continue;
      const rawName = nameVal.toString().trim();
      const name = normalizeAfficheurName(rawName);

      const skuVal = getVal(row, ['Réf produit', 'Rf produit', 'sku', 'ref', 'reference', 'code', 'ref produit', 'référence']);
      let sku = skuVal ? skuVal.toString().trim() : '';

      const stockRaw = getVal(row, ['Stock ( Unité )', 'Stock (Unité)', 'Stock (Unite)', 'Stock ( unite )', 'Stock', 'stock', 'qte', 'quantite', 'quantité', 'unite', 'unités']);
      let parsedStock = null;
      if (stockRaw !== '' && stockRaw !== undefined && stockRaw !== null) {
        const val = parseInt(parsePrice(stockRaw), 10);
        if (!isNaN(val)) parsedStock = val;
      }

      const priceDetail = parsePrice(getVal(row, ['Prix 1 TTC', 'Prix 1', 'Prix1 TTC', 'Prix1', 'detail', 'prix detail', 'price', 'priceDetail', 'prix']));
      const priceDetailReparation = parsePrice(getVal(row, ['REPARATION TTC', 'REPARATION', 'Prix 2 TTC', 'Prix 2', 'Prix2 TTC', 'Prix2', 'detail reparation', 'priceDetailReparation', 'prix reparation']));
      const priceReparation = parsePrice(getVal(row, ['Prix 5 TTC', 'Prix 5', 'Prix5 TTC', 'Prix5', 'reparation', 'priceReparation', 'reparateur', 'prix 5']));
      const priceDemiGros = parsePrice(getVal(row, ['DEMI GROS TTC', 'DEMI GROS', 'DEMIGROS TTC', 'demi gros', 'demigros', 'priceDemiGros', 'prix demi gros']));
      const priceSuperGros = parsePrice(getVal(row, ['SUPER GROS TTC', 'SUPER GROS', 'SUPERGROS TTC', 'super gros', 'supergros', 'priceSuperGros', 'prix super gros']));
      const pricePromo = parsePrice(getVal(row, ['Prix Promo TTC', 'Prix Promo', 'promo', 'prix promo', 'pricePromo', 'discountPrice', 'prix promo ttc']));

      let famille = getVal(row, ['Famille', 'category', 'famille', 'categorie', 'catégorie'], '').toString().trim();
      let sousFamille = getVal(row, ['Sous famille', 'sous-famille', 'subcategory', 'sousFamille', 'sous categorie', 'sous-catégorie'], '').toString().trim();
      let marqueStr = getVal(row, ['Marque', 'brand', 'marque'], '').toString().trim();
      const imageVal = getVal(row, ['Image', 'image', 'images', 'photo', 'lien image', 'photos'], '').toString().trim();

      if (famille.toUpperCase() === 'ECRAN' || famille.toUpperCase() === 'LCD') {
        famille = 'AFFICHEUR';
      }

      if (!marqueStr || marqueStr === 'NaN' || marqueStr === 'nan' || marqueStr.toLowerCase() === 'generique') {
        const upperName = name.toUpperCase();
        for (const b of KNOWN_BRANDS) {
          if (new RegExp(`\\b${b}\\b`, 'i').test(upperName)) {
            marqueStr = b;
            break;
          }
        }
      }

      if (!famille || famille === 'PIECE') {
        const upperName = name.toUpperCase();
        if (upperName.includes('BUZZER')) {
          famille = 'BUZZER';
        } else if (upperName.includes('AFFICHEUR') || upperName.includes('ECRAN') || upperName.includes('LCD') || upperName.includes('OLED') || upperName.includes('DISPLAY')) {
          famille = 'AFFICHEUR';
        } else if (upperName.includes('BATTERIE') || upperName.includes('BAT ')) {
          famille = 'BATTERIE';
        } else if (upperName.includes('CONNECTEUR') || upperName.includes('CHARGE') || upperName.includes('NAPPE')) {
          famille = 'CONNECTEUR';
        } else if (upperName.includes('VITRE') || upperName.includes('TACTILE') || upperName.includes('GLASS')) {
          famille = 'GLASS';
        } else if (upperName.includes('POCHETTE') || upperName.includes('COQUE') || upperName.includes('ETUI')) {
          famille = 'POCHETTE';
        } else if (upperName.includes('CAM') || upperName.includes('CAMERA')) {
          famille = 'CAMERA';
        } else if (upperName.includes('ECOUTEUR') || upperName.includes('HAUT-PARLEUR') || upperName.includes('HP')) {
          famille = 'AUDIO';
        } else {
          famille = 'PIECE';
        }
      }

      const categoryId = await getCategoryId(famille);
      const brandId = await getBrandId(marqueStr);

      const lowerSku = sku ? normalizeLookup(sku) : '';
      const lowerName = normalizeLookup(name);
      const lowerRawName = normalizeLookup(rawName);
      const existing = (lowerSku && skuMap.get(lowerSku)) || nameMap.get(lowerName) || nameMap.get(lowerRawName);

      if (existing) {
        matchedProductIds.add(existing._id.toString());

        const finalSku = sku 
          ? ensureUniqueSku(sku, existing._id) 
          : (existing.sku ? ensureUniqueSku(existing.sku, existing._id) : ensureUniqueSku(name, existing._id));

        const dp1 = existing.priceDetail || existing.price || 0;
        const dp2 = existing.priceDetailReparation || 0;
        const dp5 = existing.priceReparation || 0;
        const dpDemi = existing.priceDemiGros || existing.demiGrosPrice || 0;
        const dpSuper = existing.priceSuperGros || existing.superGrosPrice || 0;
        const dpPromo = existing.pricePromo || existing.discountPrice || 0;

        // Check price differences
        const diffs = [];
        if (priceDetail !== dp1) diffs.push({ label: 'Prix Détail', oldVal: dp1, newVal: priceDetail });
        if (priceDetailReparation !== dp2) diffs.push({ label: 'Prix Réparation', oldVal: dp2, newVal: priceDetailReparation });
        if (priceReparation !== dp5) diffs.push({ label: 'Prix 5', oldVal: dp5, newVal: priceReparation });
        if (priceDemiGros !== dpDemi) diffs.push({ label: 'Demi-gros', oldVal: dpDemi, newVal: priceDemiGros });
        if (priceSuperGros !== dpSuper) diffs.push({ label: 'Super-gros', oldVal: dpSuper, newVal: priceSuperGros });
        if (pricePromo !== dpPromo) diffs.push({ label: 'Promo', oldVal: dpPromo, newVal: pricePromo });

        if (diffs.length > 0) {
          priceUpdatedCount++;
          priceChangedItems.push({
            id: existing._id,
            name: existing.name,
            sku: existing.sku || finalSku,
            diffs
          });
        }

        // Record snapshot for rollback
        snapshot.push({
          productId: existing._id,
          name: existing.name,
          sku: existing.sku || finalSku,
          isNewlyCreated: false,
          previousState: {
            stock: existing.stock !== undefined ? existing.stock : 0,
            isAvailable: existing.isAvailable !== undefined ? existing.isAvailable : false,
            price: existing.price !== undefined ? existing.price : 0,
            priceDetail: existing.priceDetail !== undefined ? existing.priceDetail : 0,
            priceDetailReparation: existing.priceDetailReparation !== undefined ? existing.priceDetailReparation : 0,
            priceReparation: existing.priceReparation !== undefined ? existing.priceReparation : 0,
            demiGrosPrice: existing.demiGrosPrice !== undefined ? existing.demiGrosPrice : 0,
            priceDemiGros: existing.priceDemiGros !== undefined ? existing.priceDemiGros : 0,
            superGrosPrice: existing.superGrosPrice !== undefined ? existing.superGrosPrice : 0,
            priceSuperGros: existing.priceSuperGros !== undefined ? existing.priceSuperGros : 0,
            discountPrice: existing.discountPrice !== undefined ? existing.discountPrice : 0,
            pricePromo: existing.pricePromo !== undefined ? existing.pricePromo : 0
          }
        });

        const updateDoc = {
          name,
          sku: finalSku,
          price: priceDetail,
          priceDetail,
          priceDetailReparation,
          priceReparation,
          demiGrosPrice: priceDemiGros,
          priceDemiGros,
          superGrosPrice: priceSuperGros,
          priceSuperGros,
          discountPrice: pricePromo,
          pricePromo,
          famille,
          sousFamille,
          marque: marqueStr,
          category: categoryId,
          brand: brandId,
          isAvailable: parsedStock !== null && parsedStock > 0
        };

        // Determine stock to apply: if no value, 0 or negative -> out of stock (rupture)
        const prevStock = existing.stock !== undefined ? Number(existing.stock) : 0;
        const prevAvailable = Boolean(existing.isAvailable !== false && prevStock > 0);
        const nextStock = parsedStock !== null && parsedStock > 0 ? parsedStock : 0;
        const nextAvailable = Boolean(nextStock > 0);

        if (parsedStock !== null && parsedStock > 0) {
          updateDoc.stock = parsedStock;
          updateDoc.isAvailable = true;
          if (!prevAvailable || prevStock === 0) restoredStockCount++;
        } else {
          updateDoc.stock = 0;
          updateDoc.isAvailable = false;
        }

        if (prevStock !== nextStock || prevAvailable !== nextAvailable) {
          stockChangedItems.push({
            id: existing._id,
            name: existing.name,
            sku: existing.sku || finalSku,
            oldStock: prevStock,
            newStock: nextStock,
            isRestored: (!prevAvailable || prevStock === 0) && nextStock > 0,
            isOutOfStock: prevAvailable && nextStock === 0
          });
        }

        // Strictly preserve images unless non-empty valid image URL is passed in Excel
        if (imageVal && imageVal.trim() && !['nan', 'null', 'undefined', ''].includes(imageVal.trim().toLowerCase())) {
          updateDoc.images = [imageVal.trim()];
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: updateDoc }
          }
        });
        inStockConfirmedCount++;
      } else {
        // New product found in Excel
        const finalSku = sku 
          ? ensureUniqueSku(sku, null) 
          : ensureUniqueSku(name, null);

        let images = [];
        if (imageVal && imageVal.trim() && !['nan', 'null', 'undefined', ''].includes(imageVal.trim().toLowerCase())) {
          images = [imageVal.trim()];
        } else {
          const lowerNameStr = name.toLowerCase();
          const upperFamille = famille.toUpperCase();
          let imagePath = '/uploads/spare_part.png';

          if (upperFamille === 'BAT' || upperFamille === 'BATTERIE') {
            imagePath = '/uploads/battery.png';
          } else if (upperFamille === 'GLASS' || upperFamille === 'T GLASS') {
            imagePath = '/uploads/glass.png';
          } else if (upperFamille === 'POCH' || upperFamille === 'POCHETTE') {
            imagePath = '/uploads/pouch.png';
          } else if (upperFamille === 'ACC') {
            imagePath = '/uploads/spare_part.png';
          } else if (upperFamille === 'MATERIEL' || upperFamille.includes('OUTIL')) {
            imagePath = '/uploads/connecteur.png';
          } else {
            if (lowerNameStr.includes('ecran') || lowerNameStr.includes('oled') || lowerNameStr.includes('lcd') || lowerNameStr.includes('display') || lowerNameStr.includes('vitre tactile')) {
              imagePath = '/uploads/screen.png';
            } else if (lowerNameStr.includes('batterie') || lowerNameStr.includes('bat ')) {
              imagePath = '/uploads/battery.png';
            } else if (lowerNameStr.includes('connecteur') || lowerNameStr.includes('charge') || lowerNameStr.includes('con only') || lowerNameStr.includes('charging') || lowerNameStr.includes('nappe')) {
              imagePath = '/uploads/connecteur.png';
            } else if (lowerNameStr.includes('vitre') || lowerNameStr.includes('glass') || lowerNameStr.includes('verre')) {
              imagePath = '/uploads/glass.png';
            } else if (lowerNameStr.includes('pochette') || lowerNameStr.includes('coque') || lowerNameStr.includes('poch') || lowerNameStr.includes('pouch') || lowerNameStr.includes('etui')) {
              imagePath = '/uploads/pouch.png';
            } else if (lowerNameStr.includes('outil') || lowerNameStr.includes('tournevis') || lowerNameStr.includes('separatrice') || lowerNameStr.includes('machine') || lowerNameStr.includes('souder') || lowerNameStr.includes('station') || lowerNameStr.includes('falcon') || lowerNameStr.includes('mechanic') || lowerNameStr.includes('ds01')) {
              imagePath = '/uploads/repair_tool.png';
            }
          }
          images = [imagePath];
        }

        const newStock = (parsedStock !== null && parsedStock > 0) ? parsedStock : 0;
        const newProductId = new mongoose.Types.ObjectId();
        const newProduct = {
          _id: newProductId,
          sku: finalSku,
          name,
          description: `Composant ${name}`,
          stock: newStock,
          price: priceDetail,
          priceDetail,
          priceDetailReparation,
          priceReparation,
          demiGrosPrice: priceDemiGros,
          priceDemiGros,
          superGrosPrice: priceSuperGros,
          priceSuperGros,
          discountPrice: pricePromo,
          pricePromo,
          famille,
          sousFamille,
          marque: marqueStr,
          category: categoryId,
          brand: brandId,
          images,
          isAvailable: newStock > 0
        };

        // Record snapshot for rollback (as newly created)
        snapshot.push({
          productId: newProductId,
          name,
          sku: finalSku,
          isNewlyCreated: true,
          previousState: {
            stock: 0,
            isAvailable: false,
            price: 0,
            priceDetail: 0,
            priceDetailReparation: 0,
            priceReparation: 0,
            demiGrosPrice: 0,
            priceDemiGros: 0,
            superGrosPrice: 0,
            priceSuperGros: 0,
            discountPrice: 0,
            pricePromo: 0
          }
        });

        bulkOps.push({
          insertOne: {
            document: newProduct
          }
        });

        const simObj = { _id: newProductId, sku: finalSku, name, images, stock: newStock };
        skuMap.set(normalizeLookup(finalSku), simObj);
        nameMap.set(lowerName, simObj);
        nameMap.set(lowerRawName, simObj);
        matchedProductIds.add(newProductId.toString());
        createdCount++;

        createdItems.push({
          id: newProductId,
          name,
          sku: finalSku,
          price: priceDetail,
          stock: newStock,
          category: famille,
          brand: marqueStr
        });
      }
    }

    // 2. Identify products in DB that are MISSING from this Excel file
    let markedOutOfStockCount = 0;

    for (const prod of allProducts) {
      if (!matchedProductIds.has(prod._id.toString())) {
        const wasInStock = Boolean(prod.stock && Number(prod.stock) > 0 && prod.isAvailable !== false);
        if (wasInStock) {
          markedOutOfStockCount++;
        }
        outOfStockItems.push({
          id: prod._id,
          name: prod.name,
          sku: prod.sku || '',
          previousStock: prod.stock !== undefined ? prod.stock : 0,
          wasInStock
        });
        snapshot.push({
          productId: prod._id,
          name: prod.name,
          sku: prod.sku || '',
          isNewlyCreated: false,
          previousState: {
            stock: prod.stock !== undefined ? prod.stock : 0,
            isAvailable: prod.isAvailable !== undefined ? prod.isAvailable : false,
            price: prod.price !== undefined ? prod.price : 0,
            priceDetail: prod.priceDetail !== undefined ? prod.priceDetail : 0,
            priceDetailReparation: prod.priceDetailReparation !== undefined ? prod.priceDetailReparation : 0,
            priceReparation: prod.priceReparation !== undefined ? prod.priceReparation : 0,
            demiGrosPrice: prod.demiGrosPrice !== undefined ? prod.demiGrosPrice : 0,
            priceDemiGros: prod.priceDemiGros !== undefined ? prod.priceDemiGros : 0,
            superGrosPrice: prod.superGrosPrice !== undefined ? prod.superGrosPrice : 0,
            priceSuperGros: prod.priceSuperGros !== undefined ? prod.priceSuperGros : 0,
            discountPrice: prod.discountPrice !== undefined ? prod.discountPrice : 0,
            pricePromo: prod.pricePromo !== undefined ? prod.pricePromo : 0
          }
        });
        bulkOps.push({
          updateOne: {
            filter: { _id: prod._id },
            update: { $set: { stock: 0, isAvailable: false } }
          }
        });
      }
    }

    // Execute bulkWrite in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await Product.bulkWrite(batch, { ordered: false });
      }
    }

    // Save synchronization record in SyncHistory
    let savedHistory = null;
    try {
      savedHistory = await SyncHistory.create({
        filename: req.file?.originalname || 'synchronisation.xlsx',
        stats: {
          totalExcelRows: rows.length,
          matchedInDb: matchedProductIds.size,
          priceUpdatedCount,
          restoredStockCount,
          createdCount,
          markedOutOfStockCount,
          totalDbProducts: allProducts.length + createdCount
        },
        priceChangedItems,
        outOfStockItems,
        outOfStockSamples: outOfStockItems,
        stockChangedItems,
        createdItems,
        status: 'completed',
        syncedBy: req.user?._id,
        snapshot
      });
    } catch (histErr) {
      console.error('Error saving SyncHistory:', histErr);
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      message: 'Synchronisation terminée avec succès !',
      syncHistoryId: savedHistory?._id,
      stats: {
        totalExcelRows: rows.length,
        matchedInDb: matchedProductIds.size,
        priceUpdatedCount,
        restoredStockCount,
        createdCount,
        markedOutOfStockCount,
        totalDbProducts: allProducts.length + createdCount
      },
      priceChangedItems,
      outOfStockItems,
      outOfStockSamples: outOfStockItems,
      stockChangedItems,
      createdItems
    });
  } catch (error) {
    console.error('Sync Products Controller Error:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation : ' + (error.message || 'Erreur serveur')
    });
  }
};

// @desc    Get synchronization history
// @route   GET /api/products/sync-history
// @access  Private/Admin
export const getSyncHistory = async (req, res, next) => {
  try {
    const history = await SyncHistory.find({})
      .select('-snapshot')
      .populate('syncedBy', 'name email')
      .populate('revertedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get Sync History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique : ' + error.message
    });
  }
};

// @desc    Get synchronization details by ID
// @route   GET /api/products/sync-history/:id
// @access  Private/Admin
export const getSyncHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await SyncHistory.findById(id)
      .select('-snapshot')
      .populate('syncedBy', 'name email')
      .populate('revertedBy', 'name email');

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Historique de synchronisation introuvable'
      });
    }

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get Sync History Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails : ' + error.message
    });
  }
};

// @desc    Rollback / revert a synchronization
// @route   POST /api/products/sync-history/:id/rollback
// @access  Private/Admin
export const rollbackSync = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await SyncHistory.findById(id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Historique de synchronisation introuvable'
      });
    }

    if (history.status === 'reverted') {
      return res.status(400).json({
        success: false,
        message: 'Cette synchronisation a déjà été annulée.'
      });
    }

    if (!history.snapshot || history.snapshot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée de restauration disponible pour cette synchronisation'
      });
    }

    const bulkOps = [];
    let restoredCount = 0;
    let deletedCount = 0;

    for (const item of history.snapshot) {
      if (item.isNewlyCreated) {
        bulkOps.push({
          deleteOne: {
            filter: { _id: item.productId }
          }
        });
        deletedCount++;
      } else {
        const prev = item.previousState || {};
        bulkOps.push({
          updateOne: {
            filter: { _id: item.productId },
            update: {
              $set: {
                stock: prev.stock !== undefined ? prev.stock : 0,
                isAvailable: prev.isAvailable !== undefined ? prev.isAvailable : false,
                price: prev.price !== undefined ? prev.price : 0,
                priceDetail: prev.priceDetail !== undefined ? prev.priceDetail : 0,
                priceDetailReparation: prev.priceDetailReparation !== undefined ? prev.priceDetailReparation : 0,
                priceReparation: prev.priceReparation !== undefined ? prev.priceReparation : 0,
                demiGrosPrice: prev.demiGrosPrice !== undefined ? prev.demiGrosPrice : 0,
                priceDemiGros: prev.priceDemiGros !== undefined ? prev.priceDemiGros : 0,
                superGrosPrice: prev.superGrosPrice !== undefined ? prev.superGrosPrice : 0,
                priceSuperGros: prev.priceSuperGros !== undefined ? prev.priceSuperGros : 0,
                discountPrice: prev.discountPrice !== undefined ? prev.discountPrice : 0,
                pricePromo: prev.pricePromo !== undefined ? prev.pricePromo : 0
              }
            }
          }
        });
        restoredCount++;
      }
    }

    // Execute bulk write in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await Product.bulkWrite(batch, { ordered: false });
      }
    }

    history.status = 'reverted';
    history.revertedAt = new Date();
    if (req.user) history.revertedBy = req.user._id;
    await history.save();

    return res.json({
      success: true,
      message: 'La synchronisation a été annulée avec succès et les stocks/prix précédents ont été restaurés.',
      restoredCount,
      deletedCount
    });
  } catch (error) {
    console.error('Rollback Sync Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la synchronisation : ' + error.message
    });
  }
};

// @desc    Export products as Excel file
// @route   GET /api/products/export
// @access  Private/Admin
export const exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).populate('category', 'name').populate('brand', 'name').sort({ createdAt: -1 });

    // Build format matching the standard Excel layout
    const data = products.map(p => ({
      'Désignation': p.name || '',
      'Stock ( Unité )': p.stock !== undefined ? p.stock : 0,
      'Prix 1 TTC': p.priceDetail || p.price || 0,
      'REPARATION TTC': p.priceDetailReparation || 0,
      'SUPER GROS TTC': p.priceSuperGros || p.superGrosPrice || 0,
      'DEMI GROS TTC': p.priceDemiGros || p.demiGrosPrice || 0,
      'Prix 5 TTC': p.priceReparation || 0,
      'Prix Promo TTC': p.pricePromo || p.discountPrice || 0,
      'Famille': p.famille || (p.category ? p.category.name : 'PIECE'),
      'Sous famille': p.sousFamille || '',
      'Marque': p.marque || (p.brand ? p.brand.name : ''),
      'Réf produit': p.sku || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Produits');

    // Generate buffer in XLSX format
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=produits_export.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Get structured devices/models catalog with counts & popular suggestions
// @route   GET /api/products/devices
// @access  Public
export const getDevices = async (req, res, next) => {
  try {
    const BRANDS_CATALOG = [
      {
        name: 'Samsung',
        slug: 'samsung',
        logo: '/uploads/samsung-logo.png',
        models: [
          'S25 Ultra', 'S25 Plus', 'S25 FE', 'S25', 'S24 Ultra', 'S24 Plus', 'S24 FE', 'S24',
          'S23 Ultra', 'S23 Plus', 'S23 FE', 'S23', 'S22 Ultra', 'S22 Plus', 'S22',
          'S21 Ultra', 'S21 Plus', 'S21 FE', 'S21', 'S20 Ultra', 'S20 Plus', 'S20 FE', 'S20',
          'Note 20 Ultra', 'Note 20', 'Note 10 Plus', 'Note 10', 'Note 9', 'Note 8',
          'S10 Plus', 'S10E', 'S10', 'S9 Plus', 'S9', 'S8 Plus', 'S8',
          'A55', 'A54', 'A53', 'A52', 'A51', 'A50', 'A35', 'A34', 'A33', 'A32', 'A31', 'A30',
          'A25', 'A24', 'A23', 'A22', 'A21S', 'A21', 'A20S', 'A20', 'A17', 'A16', 'A15', 'A14', 'A13', 'A12',
          'A11', 'A10S', 'A10', 'A05S', 'A05', 'A04S', 'A04E', 'A04', 'A03S', 'A03 Core', 'A03', 'A02S', 'A02', 'A01',
          'M53', 'M35', 'M33', 'M31', 'M23', 'M14', 'M13', 'M12', 'M11', 'M10', 'A750'
        ]
      },
      {
        name: 'Apple',
        slug: 'apple',
        logo: '/uploads/apple-logo.png',
        models: [
          'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
          'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
          'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
          'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 Mini', 'iPhone 13',
          'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 Mini', 'iPhone 12',
          'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
          'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
          'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7', 'iPhone 6S Plus', 'iPhone 6S', 'iPhone 6 Plus', 'iPhone 6'
        ]
      },
      {
        name: 'Xiaomi / Redmi',
        slug: 'xiaomi',
        models: [
          'Redmi Note 14 Pro', 'Redmi Note 14', 'Redmi Note 13 Pro', 'Redmi Note 13',
          'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 11 Pro', 'Redmi Note 11',
          'Redmi Note 10 Pro', 'Redmi Note 10', 'Redmi Note 9 Pro', 'Redmi Note 9',
          'Redmi Note 8 Pro', 'Redmi Note 8', 'Redmi Note 7', 'Redmi Note 6 Pro', 'Redmi Note 5',
          'Redmi 15C', 'Redmi 14C', 'Redmi 13C',
          'Redmi 12', 'Redmi 12C', 'Redmi 10', 'Redmi 10C', 'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 9T', 'Redmi 8', 'Redmi 8A', 'Redmi 7', 'Redmi 7A', 'Redmi 6', 'Redmi 6A', 'Redmi A3', 'Redmi A2', 'Redmi A1 Plus',
          'Poco X6 Pro', 'Poco X6', 'Poco X5 Pro', 'Poco X5', 'Poco X3 Pro', 'Poco X3',
          'Poco M6 Pro', 'Poco M6', 'Poco M5', 'Poco M4 Pro', 'Poco M3', 'Poco C75', 'Poco C65', 'Poco C40', 'Poco F5', 'Poco F4', 'Poco F3'
        ]
      },
      {
        name: 'Oppo',
        slug: 'oppo',
        models: [
          'Reno 12 Pro', 'Reno 12', 'Reno 11 Pro', 'Reno 11', 'Reno 10 Pro', 'Reno 10',
          'Reno 8', 'Reno 7', 'Reno 6', 'Reno 5', 'Reno 4', 'Reno 3', 'Reno 2', 'Reno 2F', 'Reno 2Z',
          'A97', 'A94', 'A79', 'A78', 'A77', 'A77S', 'A74', 'A60', 'A59', 'A58', 'A58X', 'A57', 'A55', 'A54', 'A53', 'A52', 'A40', 'A38', 'A3X', 'A31', 'A18', 'A17', 'A17K', 'A16', 'A16K', 'A15', 'A15S', 'A12', 'A11K', 'A9 2020', 'A5 2020', 'A5S', 'A1K'
        ]
      },
      {
        name: 'Realme',
        slug: 'realme',
        models: [
          'Realme C85', 'Realme C75', 'Realme C67', 'Realme C65', 'Realme C63', 'Realme C61',
          'Realme C55', 'Realme C53', 'Realme C51', 'Realme C35', 'Realme C33', 'Realme C31', 'Realme C30S', 'Realme C30', 'Realme C25', 'Realme C21Y', 'Realme C15', 'Realme C12', 'Realme C11', 'Realme C3', 'Realme C2',
          'Realme 12 Pro', 'Realme 12', 'Realme 11 Pro', 'Realme 11', 'Realme 10', 'Realme 9', 'Realme 8 Pro', 'Realme 8I', 'Realme 8', 'Realme 7', 'Narzo 50'
        ]
      },
      {
        name: 'Infinix',
        slug: 'infinix',
        models: [
          'Smart 9', 'Smart 8', 'Smart 7', 'Smart 6 Plus', 'Smart 6', 'Smart 5',
          'Hot 50 Pro', 'Hot 50', 'Hot 50I', 'Hot 40 Pro', 'Hot 40', 'Hot 30', 'Hot 20', 'Hot 12 Play', 'Hot 12I', 'Hot 11 Play', 'Hot 11', 'Hot 10 Play', 'Hot 10S', 'Hot 10T', 'Hot 10', 'Hot 9',
          'Note 40', 'Note 30', 'Note 12', 'Note 11', 'Note 10', 'Note 8', 'Note 7', 'S5', 'S4'
        ]
      },
      {
        name: 'Tecno',
        slug: 'tecno',
        models: [
          'Spark 20 Pro', 'Spark 20', 'Spark 10 Pro', 'Spark 10', 'Spark 9 Pro', 'Spark 8C', 'Spark 8T', 'Spark 7', 'Camon 30', 'Camon 20', 'Pouvoir 4', 'Pop 8', 'Pop 7'
        ]
      },
      {
        name: 'Huawei / Honor',
        slug: 'huawei',
        models: [
          'Honor Magic 5 Lite', 'Honor X9A', 'Honor X8', 'Honor X7', 'Honor 90', 'Honor 70', 'Honor 50', 'Honor 10 Lite', 'Honor 8X', 'Honor 7X', 'Honor 7C',
          'P50 Pro', 'P40 Lite E', 'P40 Lite', 'P40', 'P30 Pro', 'P30 Lite', 'P20 Pro', 'P20 Lite', 'P10 Lite',
          'P Smart 2020', 'P Smart 2019', 'P Smart Z', 'Nova 3I', 'Y9A', 'Y9S', 'Y9 Prime 2019', 'Y9 2019', 'Y8S', 'Y7P', 'Y7 2019', 'Y7 2018', 'Mate 20 Pro', 'Mate 20 Lite', 'Mate 10 Pro', 'Mate 10'
        ]
      },
      {
        name: 'Condor',
        slug: 'condor',
        models: [
          'Griffe T8', 'Griffe T6', 'Griffe T2', 'Plume P8', 'Plume P6', 'Plume L3', 'Plume L2', 'Plume L1',
          'Allure M3', 'Allure M2', 'Allure M1', 'A55', 'C8', 'F1', 'F3', 'G4 Plus', '710'
        ]
      }
    ];

    const BRAND_KEYWORDS = {
      samsung: ['SAMSUNG', 'SAM'],
      apple: ['APPLE', 'IPHONE', 'IPH'],
      xiaomi: ['XIAOMI', 'REDMI', 'REDM', 'POCO', 'MI '],
      oppo: ['OPPO', 'OPP', 'RENO'],
      realme: ['REALME', 'REALM', 'RLM', 'NARZO'],
      infinix: ['INFINIX', 'INF', 'HOT ', 'SMART '],
      tecno: ['TECNO', 'SPARK', 'CAMON', 'POUVOIR', 'POP '],
      huawei: ['HUAWEI', 'HW', 'HONOR', 'NOVA', 'MATE'],
      condor: ['CONDOR', 'CON', 'PLUME', 'GRIFFE', 'ALLURE']
    };

    // Fetch all products to map product counts per model
    const allProds = await Product.find({}, 'name brand marque famille images').lean();

    const brandsData = [];
    const allPhonesWithCounts = [];

    for (const brand of BRANDS_CATALOG) {
      const modelsData = [];
      const brandKeys = BRAND_KEYWORDS[brand.slug] || [];

      for (const model of brand.models) {
        const tokens = model.toUpperCase().split(/\s+/).filter(Boolean);
        
        // Find matching products
        const matchingProds = allProds.filter(p => {
          const name = p.name.toUpperCase();
          const marque = (p.marque || '').toUpperCase();
          
          // Must match brand identifier if present
          const brandMatch = brandKeys.length === 0 || brandKeys.some(k => name.includes(k) || marque.includes(k));
          if (!brandMatch) return false;

          return tokens.every(t => {
            if (['IPHONE', 'SAMSUNG', 'HUAWEI', 'REALME', 'CONDOR', 'OPPO', 'INFINIX', 'TECNO', 'XIAOMI'].includes(t)) return true;
            if (/^[4-9]$/.test(t)) return new RegExp(`\\b(?:${t}|${t}G)\\b`, 'i').test(name);
            // Match token bounded or slash-separated (e.g. A77 matches /A77/, /A77 4G/, etc.)
            return new RegExp(`(?:^|[\\s/,\\-])${t}(?:$|[\\s/,\\-])`, 'i').test(name);
          });
        });

        const count = matchingProds.length;
        if (count > 0) {
          const sampleProd = matchingProds.find(p => p.images && p.images[0] && !p.images[0].includes('spare_part.png')) || matchingProds[0];
          const modelObj = {
            name: model,
            brand: brand.name,
            count,
            sampleImage: sampleProd?.images?.[0] || '/uploads/screen.png'
          };
          modelsData.push(modelObj);
          allPhonesWithCounts.push(modelObj);
        }
      }

      // Sort models by product count desc
      modelsData.sort((a, b) => b.count - a.count);

      if (modelsData.length > 0) {
        brandsData.push({
          name: brand.name,
          slug: brand.slug,
          totalProducts: modelsData.reduce((acc, m) => acc + m.count, 0),
          models: modelsData
        });
      }
    }

    // Top suggested popular phones for the carousel (sorted by popularity and diversity of brands)
    const popularPhones = allPhonesWithCounts
      .filter(p => p.count >= 4)
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);

    res.json({
      success: true,
      brands: brandsData,
      popularPhones
    });
  } catch (error) {
    next(error);
  }
};
