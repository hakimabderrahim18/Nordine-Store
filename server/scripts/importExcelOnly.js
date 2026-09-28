import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nordinestore';
const excelFilePath = path.join(__dirname, '..', '..', 'NOUNOUTELECOM27-06-2026-à12h39.xls');

console.log('Connecting to database...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    
    // 1. Clear existing products, categories, and brands to eliminate any seeds!
    console.log('Clearing existing products, categories, and brands...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    console.log('Cleaned up product database successfully.');

    // 2. Read Excel file
    if (!fs.existsSync(excelFilePath)) {
      console.error(`Excel file not found at: ${excelFilePath}`);
      process.exit(1);
    }

    console.log(`Reading Excel file: ${excelFilePath}...`);
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${rows.length} rows to process.`);

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

    let importedCount = 0;
    const bulkOps = [];

    // Helper for category and brand cache to avoid queries in the loop
    const categoryCache = {};
    const brandCache = {};

    const parsePrice = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleanStr = val.toString().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? 0 : parsed;
    };

    const KNOWN_BRANDS = [
      'SAMSUNG', 'IPHONE', 'APPLE', 'OPPO', 'REALME', 'XIAOMI', 'REDMI', 'POCO',
      'INFINIX', 'TECNO', 'ITEL', 'HUAWEI', 'HONOR', 'VIVO', 'ONEPLUS', 'NOKIA',
      'CONDOR', 'LENOVO', 'MOTOROLA', 'LG', 'SONY', 'ASUS', 'ZTE', 'GOOGLE'
    ];

    const normalizeAfficheurName = (name) => {
      if (!name || typeof name !== 'string') return name;
      let s = name;
      s = s.replace(/\b(AFFICHEUR\s+LCD|ECRAN\s+LCD|LCD|ECRAN)\b/gi, 'AFFICHEUR');
      s = s.replace(/\b(AFFICHEUR\s+)+AFFICHEUR\b/gi, 'AFFICHEUR');
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    for (const row of rows) {
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom', 'article', 'description', 'titre', 'produit']);
      if (!nameVal || !nameVal.toString().trim()) continue;
      const name = normalizeAfficheurName(nameVal.toString().trim());

      const skuVal = getVal(row, ['Réf produit', 'Rf produit', 'sku', 'ref', 'reference', 'code', 'ref produit']);
      let sku = skuVal ? skuVal.toString().trim() : '';

      const priceDetail = parsePrice(getVal(row, ['Prix 1 TTC', 'Prix 1', 'Prix1 TTC', 'Prix1', 'detail', 'prix detail', 'price', 'priceDetail', 'prix']));
      const priceDetailReparation = parsePrice(getVal(row, ['REPARATION TTC', 'REPARATION', 'Prix 2 TTC', 'Prix 2', 'Prix2 TTC', 'Prix2', 'detail reparation', 'priceDetailReparation', 'prix reparation']));
      const priceReparation = parsePrice(getVal(row, ['Prix 5 TTC', 'Prix 5', 'Prix5 TTC', 'Prix5', 'reparation', 'priceReparation', 'reparateur']));
      const priceDemiGros = parsePrice(getVal(row, ['DEMI GROS TTC', 'DEMI GROS', 'DEMIGROS TTC', 'demi gros', 'demigros', 'priceDemiGros', 'prix demi gros']));
      const priceSuperGros = parsePrice(getVal(row, ['SUPER GROS TTC', 'SUPER GROS', 'SUPERGROS TTC', 'super gros', 'supergros', 'priceSuperGros', 'prix super gros']));
      const pricePromo = parsePrice(getVal(row, ['Prix Promo TTC', 'Prix Promo', 'promo', 'prix promo', 'pricePromo', 'discountPrice']));
      
      let famille = getVal(row, ['Famille', 'category', 'famille', 'categorie'], '').toString().trim();
      let sousFamille = getVal(row, ['Sous famille', 'sous-famille', 'subcategory', 'sousFamille'], '').toString().trim();
      let marqueStr = getVal(row, ['Marque', 'brand', 'marque'], '').toString().trim();
      const imageVal = getVal(row, ['Image', 'image', 'images', 'photo', 'lien image'], '').toString().trim();

      if (famille.toUpperCase() === 'ECRAN' || famille.toUpperCase() === 'LCD') {
        famille = 'AFFICHEUR';
      }

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

      if (!sku) {
        const baseSlug = name.toUpperCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 35);
        sku = baseSlug || `PROD-${Date.now().toString(36).toUpperCase()}`;
      }

      // Resolve category
      let categoryId = null;
      if (famille) {
        const cacheKey = famille.toLowerCase();
        if (categoryCache[cacheKey]) {
          categoryId = categoryCache[cacheKey];
        } else {
          let cat = await Category.findOne({ name: { $regex: new RegExp(`^${famille}$`, 'i') } });
          if (!cat) {
            cat = await Category.create({ name: famille });
          }
          categoryCache[cacheKey] = cat._id;
          categoryId = cat._id;
        }
      }

      // Resolve brand
      let brandId = null;
      const cleanBrandStr = marqueStr && marqueStr !== 'NaN' && marqueStr !== 'nan' && marqueStr.toLowerCase() !== 'generique' 
        ? marqueStr 
        : 'GENERIQUE';
      const bCacheKey = cleanBrandStr.toLowerCase();
      if (brandCache[bCacheKey]) {
        brandId = brandCache[bCacheKey];
      } else {
        let br = await Brand.findOne({ name: { $regex: new RegExp(`^${cleanBrandStr}$`, 'i') } });
        if (!br) {
          br = await Brand.create({ name: cleanBrandStr });
        }
        brandCache[bCacheKey] = br._id;
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
          imagePath = '/uploads/spare_part.png'; // Map accessories to spare parts (correct fallback)
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

      bulkOps.push({
        insertOne: {
          document: {
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
            marque: cleanBrandStr,
            category: categoryId,
            brand: brandId,
            images,
            stock: 100
          }
        }
      });

      importedCount++;

      if (bulkOps.length === 500) {
        await Product.bulkWrite(bulkOps);
        console.log(`Imported ${importedCount} products...`);
        bulkOps.length = 0;
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      console.log(`Finished importing. Total products: ${importedCount}`);
    }

    // Double check database size
    const finalCount = await Product.countDocuments({});
    console.log(`Verification: Database contains ${finalCount} products.`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database seeding error:', err);
    process.exit(1);
  });
