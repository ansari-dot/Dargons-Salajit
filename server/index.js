const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const initDb = require('./config/initDb');
const { ensureLocalDatabase } = require('./config/ensureLocalDb');
const errorHandler = require('./middleware/errorHandler');
const safepayWebhook = require('./controllers/safepayWebhook');


const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));

// ── IMPORTANT: Safepay Webhook route MUST come BEFORE express.json() ─────────
// Safepay sends raw bytes; HMAC signature verification requires the raw body.
app.post(
  '/api/webhooks/safepay',
  express.raw({ type: 'application/json' }),
  safepayWebhook
);

// ── Standard JSON / Form middlewares ─────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// ── Static Assets ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Import Routes ─────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const productRoutes   = require('./routes/productRoutes');
const orderRoutes     = require('./routes/orderRoutes');
const blogRoutes      = require('./routes/blogRoutes');
const uploadRoutes    = require('./routes/uploadRoutes');
const couponRoutes    = require('./routes/couponRoutes');
const galleryRoutes   = require('./routes/galleryRoutes');
const cartRoutes      = require('./routes/cartRoutes');
const wishlistRoutes  = require('./routes/wishlistRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const dealRoutes      = require('./routes/dealRoutes');
const brandRoutes     = require('./routes/brandRoutes');
const adminRoutes     = require('./routes/admin.route');
const calculatorRoutes        = require('./routes/calculator.route');
const calculatorRequestRoutes = require('./routes/calculatorRequest.route');
const router = require('./routes/location.js')


// ── API Endpoints ─────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/blogs',     blogRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/coupons',   couponRoutes);
app.use('/api/gallery',   galleryRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/wishlist',  wishlistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/deals',     dealRoutes);
app.use('/api/brands',    brandRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/calculator/requests', calculatorRequestRoutes);
app.use('/api/location',router)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const db = require('./config/db');
  let database = 'connected';
  let hint;

  try {
    await db.query('SELECT 1');
  } catch (error) {
    database = 'disconnected';
    hint = 'Run `npm run db:start` inside the server folder to boot the portable database.';
  }

  res.status(200).json({
    status: 'OK',
    message: 'Palses API running',
    database,
    ...(hint && { hint }),
  });
});

// ── Main HTML view ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Initialize DB & Start Server ──────────────────────────────────────────────
// 1. Make sure a database is reachable (boots the portable local one if needed)
// 2. Create / upgrade the schema — but never keep the API from starting
const listen = () => {
  app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Server is running on port : http://localhost:${PORT}`)
    console.log(`🔔 Safepay webhook endpoint: POST /api/webhooks/safepay`);
  });
};

ensureLocalDatabase()
  .then(() => initDb())
  .then(() => console.log('✅ Database schema is ready'))
  .catch((error) => {
    console.error(`⚠️  Database not ready: ${error.message}`);
    console.error('    Fix it with:  npm run db:start        (portable project-local database)');
    console.error('    or install MySQL/MariaDB and match DB_USER / DB_PASSWORD in server/.env');
    console.error('    The API starts anyway — database endpoints reply with a clear error.');
  })
  .finally(listen);
