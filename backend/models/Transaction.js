const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  stockSymbol: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtTransaction: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'COMPLETED' },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true }
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ stockSymbol: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);