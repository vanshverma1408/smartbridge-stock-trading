const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);
app.use(express.json());
app.use(function(req, res, next) {
  console.log('REQUEST:', req.method, req.path);
  next();
});
app.use(morgan('dev'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected!'))
  .catch(err => { console.error('❌ MongoDB Error:', err); process.exit(1); });

// Load routes safely
const loadRoute = (path) => {
  try {
    const route = require(path);
    if (typeof route === 'function' || (route && typeof route.handle === 'function')) return route;
    throw new Error(`Invalid route module: ${path}`);
  } catch (err) {
    console.error(`❌ Error loading route ${path}:`, err.message);
    process.exit(1);
  }
};

app.use('/api/auth',         loadRoute('./routes/auth'));
app.use('/api/stocks',       loadRoute('./routes/stocks'));
app.use('/api/transactions', loadRoute('./routes/transactions'));
app.use('/api/portfolio',    loadRoute('./routes/portfolio'));
app.use('/api/admin',        loadRoute('./routes/admin'));
app.use('/api/users',        loadRoute('./routes/users'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server running!' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));