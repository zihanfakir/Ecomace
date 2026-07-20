const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not defined in environment variables. Using a fallback secret. THIS IS INSECURE FOR PRODUCTION!");
  process.env.JWT_SECRET = "fallback_secret_please_change_me_in_production_ecomace_2026";
}


// Middleware
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'https://ecomace-9ntk.vercel.app', 'https://ecomace.vercel.app'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use('/api', globalLimiter);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ecomace API' });
});

// Serve uploaded files statically
app.use('/downloads', express.static(__dirname + '/uploads'));

// Serverless Database Connection Middleware
const { connectDB } = require('./data/db');
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler — must be registered AFTER all routes
// Catches any errors passed via next(err) or thrown in async routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB
connectDB().then(() => {
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}).catch(console.error);

module.exports = app;
