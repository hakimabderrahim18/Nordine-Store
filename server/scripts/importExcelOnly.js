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

    for (const row of rows) {
      const skuVal = getVal(row, ['Réf produit', 'Rf produit', 'sku', 'ref']);
      if (!skuVal) continue;

      const sku = skuVal.toString().trim();
      const nameVal = getVal(row, ['Désignation', 'Designation', 'name', 'nom']);
      if (!nameVal) continue;
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
