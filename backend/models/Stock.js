const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  sector: {
    type: String,
    enum: ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial', 'Materials', 'Utilities', 'Real Estate', 'Communication'],
    default: 'Technology'
  },
  currentPrice: { type: Number, required: true, min: 0.01 },
  previousClose: { type: Number, default: 0 },
  openPrice: { type: Number, default: 0 },
  dayHigh: { type: Number, default: 0 },
  dayLow: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  peRatio: { type: Number, default: null },
  dividendYield: { type: Number, default: 0 },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  priceHistory: [{ price: Number, timestamp: { type: Date, default: Date.now } }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true } });

stockSchema.virtual('priceChange').get(function() {
  return this.previousClose ? this.currentPrice - this.previousClose : 0;
});

stockSchema.virtual('priceChangePercent').get(function() {
  if (!this.previousClose || this.previousClose === 0) return 0;
  return ((this.currentPrice - this.previousClose) / this.previousClose) * 100;
});


stockSchema.index({ name: 'text', symbol: 'text' });

module.exports = mongoose.model('Stock', stockSchema);