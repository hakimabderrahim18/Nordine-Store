import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import yalidineRoutes from './routes/yalidineRoutes.js';
import carouselRoutes from './routes/carouselRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ES Modules directory helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB Connection
connectDB();

// Setup socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Expose Socket.io to express routes
app.set('socketio', io);

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows serving local files statically without blocking headers
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

import Product from './models/Product.js';

// Serve local upload fallbacks statically
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)){
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/yalidine', yalidineRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/contact', contactRoutes);

// Google SEO: Dynamic XML Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({}).select('_id name images updatedAt').lean();
    const baseUrl = 'https://nounoutelecom.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static page URLs
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/about</loc><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/contact</loc><priority>0.5</priority></url>\n`;

    // Product URLs & Google Image entries
    products.forEach((prod) => {
      const prodUrl = `${baseUrl}/products/${prod._id}`;
      const lastMod = prod.updatedAt ? new Date(prod.updatedAt).toISOString() : new Date().toISOString();
      const escapedName = prod.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      xml += `  <url>\n`;
      xml += `    <loc>${prodUrl}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;

      if (prod.images && prod.images.length > 0) {
        prod.images.forEach((img) => {
          let imgUrl = img;
          if (!imgUrl.startsWith('http')) {
            imgUrl = `${baseUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          }
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${imgUrl}</image:loc>\n`;
          xml += `      <image:title>${escapedName}</image:title>\n`;
          xml += `    </image:image>\n`;
        });
      }
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).end();
  }
});

// Google SEO: Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  let robots = `User-agent: *\n`;
  robots += `Allow: /\n`;
  robots += `Allow: /uploads/\n`;
  robots += `Allow: /products/\n`;
  robots += `Sitemap: https://nounoutelecom.com/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Nordine Store Premium API is running...' });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // User joins their own private room for order updates
  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Admin joins general administration room
  socket.on('joinAdminRoom', () => {
    socket.join('admins');
    console.log(`Admin joined room admins`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
