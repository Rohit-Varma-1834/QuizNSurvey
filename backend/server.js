// Starts the backend server and connects all API routes and middleware.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const normalizeOrigin = (origin = '') => origin.trim().replace(/\/$/, '');

const configuredOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean)
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = new Set(
  isProduction
    ? configuredOrigins
    : [...configuredOrigins, ...defaultDevOrigins]
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// ── 1. CORS first — must be before everything else ──────────────────────────
if (isProduction && allowedOrigins.size === 0) {
  console.warn('⚠️ No CORS origins configured for production. Set ALLOWED_ORIGINS or FRONTEND_URL.');
}
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// ── 2. Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/assets cross-origin
}));

// ── 3. Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased from 100 to avoid blocking during dev
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── 4. Body parser ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 5. Logging (dev only) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── 6. Static files ──────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── 7. Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/forms',     require('./routes/forms'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/public',    require('./routes/public'));

// ── 8. Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'QuiznSurvey API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── 9. 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── 10. Global error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── 11. Start server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 QuiznSurvey Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
