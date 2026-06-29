# NordineStore - Premium MERN Spare Parts Marketplace

NordineStore is a complete, production-ready full-stack MERN (MongoDB, Express, React, Node.js) web application designed for a luxury, mobile spare parts and accessories marketplace. 

It features interactive 3D visualizations (Three.js + React Three Fiber), Lenis smooth scrolling, GSAP cinematic loader intros, Framer Motion card tilts, a full customer ordering/payment flow, automatic PDF invoice generators, and a comprehensive real-time admin controller panel.

---

## Folder Architecture

```
NordineStore/
├── server/                    # Node.js + Express Backend API
│   ├── config/                # Database and Cloudinary SDK setups
│   ├── controllers/           # MVC Logic controllers (auth, products, orders, etc.)
│   ├── middlewares/           # Authentication guards, file uploads, error handlers
│   ├── models/                # MongoDB Mongoose database schemas
│   ├── routes/                # REST API Endpoint routers
│   ├── scripts/               # Seeder scripts
│   ├── utils/                 # PDF invoice builders and mail dispatch utilities
│   ├── uploads/               # Local temp storage folder for images
│   ├── .env                   # Server environment variables config
│   ├── index.js               # Express server and Socket.io entry point
│   └── package.json
│
└── client/                    # Vite + React Frontend
    ├── src/
    │   ├── assets/
    │   ├── components/        # Cinematic loaders, 3D Canvas, Navbars, Footers
    │   ├── hooks/
    │   ├── pages/             # Catalog Shop, Details, Profiles, Checkout, Admins
    │   ├── services/          # Axios api Client
    │   ├── store/             # Redux Toolkit global state slices
    │   ├── App.jsx            # Main app router and Lenis scroll hook
    │   ├── index.css          # CSS theme variables and custom animations
    │   └── main.jsx           # React app renderer
    ├── vite.config.js
    └── package.json
```

---

## Environmental Variables Setup

Create a `.env` file under the `/server` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nordinestore
JWT_SECRET=supersecretkeynordinestore12345
JWT_EXPIRES_IN=7d

# Optional Cloudinary (Falls back to local /uploads/ statically served if blank)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional Nodemailer SMTP (Falls back to console logs if blank)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=noreply@nordinestore.com

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Local Development Execution

### 1. Database Seeding & Setup
Make sure MongoDB is running locally, then seed the database with categories, brands, products, coupons, and default administrator/customer test profiles:

```bash
cd server
npm install
npm run seed
```

### 2. Launch Backend API
Start the Node.js Express server on `http://localhost:5000`:

```bash
npm run dev
```

### 3. Launch Frontend Client
Open a separate terminal window and launch the Vite + React dev server on `http://localhost:5173`:

```bash
cd client
npm install
npm run dev
```

### 4. Default Login Profiles (Seeded)
- **Admin**: `admin@nordinestore.com` / `admin123`
- **Customer Client**: `client@nordinestore.com` / `client123`

---

## Production Deployment Guides

### 1. Backend → Railway
1. Sign up on [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Choose the `server/` subdirectory or set the root path accordingly.
4. Set the environmental variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`) in Railway's **Variables** tab.
5. Railway will automatically deploy the Express server and expose a public URL (e.g. `https://nordinestore-production.up.railway.app`).

### 2. Frontend → Vercel
1. Sign up on [Vercel.com](https://vercel.com/).
2. Click **Add New** -> **Project** -> Import your GitHub repository.
3. Configure the build parameters:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = (Your Railway backend URL plus `/api`, e.g. `https://nordinestore-production.up.railway.app/api`)
5. Click **Deploy**. Vercel will bundle the application and issue a public URL.
6. Make sure to update the backend's `CLIENT_URL` env variable on Railway with your Vercel frontend URL, then restart the server to allow proper CORS handshakes.
