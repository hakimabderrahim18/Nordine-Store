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
    const { keyword, brand, category, minPrice, maxPrice, inStock, sort, page = 1, limit = 12 } = req.query;

    const query = {};

    // Regex search for partial matching
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
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

    const getVal = (row, possibleKeys, defaultVal = '') => {
      for (const key of possibleKeys) {
        if (row[key] !== undefined) return row[key];
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

    for (const row of rows) {
      const skuVal = getVal(row, ['Réf produit', 'Rf produit', 'sku', 'ref']);
      if (!skuVal) continue; // Skip rows without SKU

      const sku = skuVal.toString().trim();
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom']);
      if (!nameVal) continue; // Skip rows without name
      const name = nameVal.toString().trim();

      const priceDetail = Number(getVal(row, ['Prix 1 TTC', 'Prix 1', 'detail', 'price', 'priceDetail'], 0));
      const priceDetailReparation = Number(getVal(row, ['Prix 2 TTC', 'Prix 2', 'detail reparation', 'priceDetailReparation'], 0));
      const priceReparation = Number(getVal(row, ['Prix 5 TTC', 'Prix 5', 'reparation', 'priceReparation'], 0));
      const priceDemiGros = Number(getVal(row, ['DEMI GROS TTC', 'DEMI GROS', 'demi gros', 'priceDemiGros'], 0));
      const priceSuperGros = Number(getVal(row, ['SUPER GROS TTC', 'SUPER GROS', 'super gros', 'priceSuperGros'], 0));
      const pricePromo = Number(getVal(row, ['Prix Promo TTC', 'promo', 'pricePromo'], 0));
      const famille = getVal(row, ['Famille', 'category', 'famille'], 'PIECE').toString().trim();
      const sousFamille = getVal(row, ['Sous famille', 'sous-famille', 'subcategory', 'sousFamille'], '').toString().trim();
      const marqueStr = getVal(row, ['Marque', 'brand', 'marque'], '').toString().trim();
      const imageVal = getVal(row, ['Image', 'image', 'images', 'photo', 'lien image'], '').toString().trim();

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

        if (upperFamille === 'BAT') {
          imagePath = '/uploads/battery.png';
        } else if (upperFamille === 'GLASS' || upperFamille === 'T GLASS') {
          imagePath = '/uploads/glass.png';
        } else if (upperFamille === 'POCH') {
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

      // Check if product exists
      let product = await Product.findOne({ sku });

      if (product) {
        // Update product
        product.name = name;
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
          images,
          stock: 100 // default stock
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
    const products = await Product.find({}).populate('category', 'name').populate('brand', 'name');

    // Build format matching the import xls layout
    const data = products.map(p => ({
      'Réf produit': p.sku,
      'Désignation': p.name,
      'Prix 1 TTC': p.priceDetail || p.price || 0,
      'Prix 2 TTC': p.priceDetailReparation || 0,
      'Prix 5 TTC': p.priceReparation || 0,
      'DEMI GROS TTC': p.priceDemiGros || p.demiGrosPrice || 0,
      'SUPER GROS TTC': p.priceSuperGros || p.superGrosPrice || 0,
      'Prix Promo TTC': p.pricePromo || p.discountPrice || 0,
      'Famille': p.famille || (p.category ? p.category.name : 'PIECE'),
      'Sous famille': p.sousFamille || '',
      'Marque': p.marque || (p.brand ? p.brand.name : '')
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Produits');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xls' });

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=produits_export.xls');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
