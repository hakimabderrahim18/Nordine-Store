import fs from 'fs';
import xlsx from 'xlsx';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

// @desc    Get all products (with filters & search)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { keyword, model, brand, category, minPrice, maxPrice, inStock, sort, page = 1, limit = 12 } = req.query;

    const query = {};
    const andConditions = [];

    // Device / Model smart search query
    if (model && model.trim()) {
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cleanModel = model.trim();
      const tokens = cleanModel.split(/\s+/).filter(Boolean);

      const modelConditions = tokens.map((t) => {
        let regexPattern = escapeRegex(t);
        const upperT = t.toUpperCase();
        if (upperT === 'IPHONE') regexPattern = '(IPHONE|IPH)';
        else if (upperT === 'SAMSUNG') regexPattern = '(SAMSUNG|SAM)';
        else if (upperT === 'HUAWEI') regexPattern = '(HUAWEI|HW)';
        else if (upperT === 'REALME') regexPattern = '(REALME|REALM)';
        else if (upperT === 'CONDOR') regexPattern = '(CONDOR|CON)';
        
        const regex = new RegExp(regexPattern, 'i');
        return {
          $or: [
            { name: regex },
            { description: regex }
          ]
        };
      });

      andConditions.push(...modelConditions);
    }

    // Enhanced regex search for partial matching (supports multi-term out-of-order search & 2-letter tokens)
    if (keyword && keyword.trim()) {
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const terms = keyword.trim().split(/\s+/).filter(Boolean);

      if (terms.length === 1) {
        const regex = new RegExp(escapeRegex(terms[0]), 'i');
        andConditions.push({
          $or: [
            { name: regex },
            { sku: regex },
            { description: regex }
          ]
        });
      } else if (terms.length > 1) {
        terms.forEach((t) => {
          const regex = new RegExp(escapeRegex(t), 'i');
          andConditions.push({
            $or: [
              { name: regex },
              { sku: regex },
              { description: regex }
            ]
          });
        });
      }
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

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, price, discountPrice, demiGrosPrice, superGrosPrice, priceDetail, priceDetailReparation, priceReparation, priceDemiGros, priceSuperGros, pricePromo, description, longDescription, category, brand, stock, variants, specifications, isFeatured } = req.body;

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
        const Category = mongoose.model('Category');
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

    const { name, sku, price, discountPrice, demiGrosPrice, superGrosPrice, priceDetail, priceDetailReparation, priceReparation, priceDemiGros, priceSuperGros, pricePromo, description, longDescription, category, brand, stock, variants, specifications, isFeatured } = req.body;

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
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Veuillez télécharger un fichier Excel ou CSV');
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let createdCount = 0;
    let updatedCount = 0;

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

    for (const row of rows) {
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom', 'article', 'description', 'titre', 'produit']);
      if (!nameVal || !nameVal.toString().trim()) continue; // Skip rows without name
      const name = nameVal.toString().trim();

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

      // Auto-detect brand if missing
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

      // Auto-detect category if missing
      if (!famille || famille === 'PIECE') {
        const upperName = name.toUpperCase();
        if (upperName.includes('BUZZER')) {
          famille = 'BUZZER';
        } else if (upperName.includes('ECRAN') || upperName.includes('LCD') || upperName.includes('OLED') || upperName.includes('DISPLAY')) {
          famille = 'ECRAN';
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

      // Resolve category
      let categoryId = null;
      if (famille) {
        let cat = await Category.findOne({ name: { $regex: new RegExp(`^${famille}$`, 'i') } });
        if (!cat) {
          cat = await Category.create({ name: famille });
        }
        categoryId = cat._id;
      }

      // Resolve brand
      let brandId = null;
      if (marqueStr && marqueStr !== 'NaN' && marqueStr !== 'nan' && marqueStr.toLowerCase() !== 'generique') {
        let br = await Brand.findOne({ name: { $regex: new RegExp(`^${marqueStr}$`, 'i') } });
        if (!br) {
          br = await Brand.create({ name: marqueStr });
        }
        brandId = br._id;
      } else {
        let br = await Brand.findOne({ name: 'GENERIQUE' });
        if (!br) {
          br = await Brand.create({ name: 'GENERIQUE' });
        }
        brandId = br._id;
      }

      // Determine images
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

      // Check if product exists by SKU or by Name
      let product = null;
      if (sku) {
        product = await Product.findOne({ sku });
      }
      if (!product) {
        product = await Product.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }

      // If SKU was missing, generate or use existing
      if (!sku) {
        if (product && product.sku) {
          sku = product.sku;
        } else {
          const baseSlug = name.toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 35);
          
          let candidate = baseSlug || `PROD-${Date.now().toString(36).toUpperCase()}`;
          const exists = await Product.findOne({ sku: candidate });
          if (exists) {
            candidate = `${candidate}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          }
          sku = candidate;
        }
      }

      if (product) {
        // Update product
        product.name = name;
        if (parsedStock !== null) product.stock = parsedStock;
        product.priceDetail = priceDetail;
        product.priceDetailReparation = priceDetailReparation;
        product.priceReparation = priceReparation;
        product.priceDemiGros = priceDemiGros;
        product.priceSuperGros = priceSuperGros;
        product.pricePromo = pricePromo;
        product.famille = famille;
        product.sousFamille = sousFamille;
        product.marque = marqueStr;
        if (categoryId) product.category = categoryId;
        if (brandId) product.brand = brandId;
        
        // Update image if explicitly provided in excel, or if product has no images
        if (imageVal || !product.images || product.images.length === 0) {
          product.images = images;
        }

        await product.save();
        updatedCount++;
      } else {
        // Create product
        await Product.create({
          sku,
          name,
          description: `Composant ${name}`,
          stock: parsedStock !== null ? parsedStock : 100,
          priceDetail,
          priceDetailReparation,
          priceReparation,
          priceDemiGros,
          priceSuperGros,
          pricePromo,
          famille,
          sousFamille,
          marque: marqueStr,
          category: categoryId,
          brand: brandId,
          images
        });
        createdCount++;
      }
    }

    // Delete temp upload file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Import terminé. ${createdCount} produits créés, ${updatedCount} produits mis à jour.`,
      createdCount,
      updatedCount
    });
  } catch (error) {
    // Delete temp upload file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
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
          'S25 Ultra', 'S25 Plus', 'S25', 'S24 Ultra', 'S24 Plus', 'S24 FE', 'S24',
          'S23 Ultra', 'S23 Plus', 'S23 FE', 'S23', 'S22 Ultra', 'S22 Plus', 'S22',
          'S21 Ultra', 'S21 Plus', 'S21 FE', 'S21', 'S20 Ultra', 'S20 Plus', 'S20 FE', 'S20',
          'Note 20 Ultra', 'Note 20', 'Note 10 Plus', 'Note 10', 'Note 9', 'Note 8',
          'A55', 'A54', 'A53', 'A52', 'A51', 'A50', 'A35', 'A34', 'A33', 'A32', 'A31', 'A30',
          'A25', 'A24', 'A23', 'A22', 'A21S', 'A20S', 'A16', 'A15', 'A14', 'A13', 'A12',
          'A11', 'A10S', 'A10', 'A05S', 'A05', 'A04S', 'A04E', 'A04', 'A03S', 'A03 Core', 'A03', 'A02S', 'A02', 'A01'
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
          'Redmi Note 8 Pro', 'Redmi Note 8', 'Redmi 15C', 'Redmi 14C', 'Redmi 13C',
          'Redmi 12', 'Redmi 12C', 'Redmi 10', 'Redmi 10C', 'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 9T', 'Redmi 8', 'Redmi 8A', 'Redmi A1 Plus',
          'Poco X6 Pro', 'Poco X6', 'Poco X5 Pro', 'Poco X5', 'Poco X3 Pro', 'Poco X3',
          'Poco M6 Pro', 'Poco M5', 'Poco M4 Pro', 'Poco M3', 'Poco F5', 'Poco F4', 'Poco F3'
        ]
      },
      {
        name: 'Oppo',
        slug: 'oppo',
        models: [
          'Reno 12 Pro', 'Reno 12', 'Reno 11 Pro', 'Reno 11', 'Reno 10 Pro', 'Reno 10',
          'Reno 8', 'Reno 7', 'Reno 6', 'Reno 5',
          'A94', 'A78', 'A74', 'A60', 'A58', 'A57', 'A55', 'A54', 'A53', 'A52', 'A40', 'A3X', 'A31', 'A17', 'A16', 'A15', 'A12', 'A11K', 'A5S', 'A1K'
        ]
      },
      {
        name: 'Realme',
        slug: 'realme',
        models: [
          'Realme C85', 'Realme C75', 'Realme C67', 'Realme C65', 'Realme C63', 'Realme C61',
          'Realme C55', 'Realme C53', 'Realme C51', 'Realme C35', 'Realme C33', 'Realme C30S', 'Realme C30', 'Realme C21Y', 'Realme C11',
          'Realme 12 Pro', 'Realme 12', 'Realme 11 Pro', 'Realme 11', 'Realme 10', 'Realme 9', 'Realme 8'
        ]
      },
      {
        name: 'Infinix',
        slug: 'infinix',
        models: [
          'Smart 8', 'Smart 7', 'Hot 40 Pro', 'Hot 40', 'Hot 30', 'Hot 20', 'Hot 12 Play', 'Hot 11 Play', 'Note 40', 'Note 30', 'Note 12'
        ]
      },
      {
        name: 'Tecno',
        slug: 'tecno',
        models: [
          'Spark 20 Pro', 'Spark 20', 'Spark 10 Pro', 'Spark 10', 'Camon 30', 'Camon 20', 'Pouvoir 4', 'Pop 8', 'Pop 7'
        ]
      },
      {
        name: 'Huawei / Honor',
        slug: 'huawei',
        models: [
          'Honor X8', 'Honor X7', 'Honor 90', 'Honor 70', 'Honor 50', 'Honor 10 Lite', 'Honor 7X',
          'P50 Pro', 'P40 Lite', 'P40', 'P30 Pro', 'P30 Lite', 'P20 Pro', 'P20 Lite',
          'P Smart 2020', 'P Smart 2019', 'Y9A', 'Y9S', 'Y9', 'Y7 2020', 'Y7 2019', 'Mate 20 Pro', 'Mate 10 Pro'
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

    // Fetch all products to map product counts per model
    const allProds = await Product.find({}, 'name brand marque famille images').lean();

    const brandsData = [];
    const allPhonesWithCounts = [];

    for (const brand of BRANDS_CATALOG) {
      const modelsData = [];

      for (const model of brand.models) {
        const tokens = model.toUpperCase().split(/\s+/).filter(Boolean);
        
        // Find matching products
        const matchingProds = allProds.filter(p => {
          const name = p.name.toUpperCase();
          return tokens.every(t => {
            if (t === 'IPHONE') return name.includes('IPHONE') || name.includes('IPH');
            if (t === 'SAMSUNG') return name.includes('SAMSUNG') || name.includes('SAM');
            if (t === 'HUAWEI') return name.includes('HUAWEI') || name.includes('HW');
            if (t === 'REALME') return name.includes('REALME') || name.includes('REALM');
            if (t === 'CONDOR') return name.includes('CONDOR') || name.includes('CON');
            return name.includes(t);
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
