'use strict';
const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  stockSymbol: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  averageBuyPrice: { type: Number, required: true },
  totalInvested: { type: Number, required: true }
});

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [holdingSchema],
  totalInvested: { type: Number, default: 0 },
  realizedPnL: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);