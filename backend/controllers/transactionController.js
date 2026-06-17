'use strict';
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

exports.executeTrade = async function(req, res, next) {
  try {
    const symbol = req.body.symbol;
    const type = req.body.type;
    const quantity = req.body.quantity;
    if (!symbol || !type || !quantity)
      return res.status(400).json({ success: false, message: 'Symbol, type and quantity are required.' });
    if (!['BUY','SELL'].includes(type.toUpperCase()))
      return res.status(400).json({ success: false, message: 'Type must be BUY or SELL.' });
    if (quantity < 1 || !Number.isInteger(Number(quantity)))
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase(), isActive: true });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    const user = await User.findById(req.user._id);
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    const totalAmount = parseFloat((stock.currentPrice * quantity).toFixed(2));
    const tradeType = type.toUpperCase();
    if (tradeType === 'BUY') {
      if (user.balance < totalAmount)
        return res.status(400).json({ success: false, message: 'Insufficient balance. Required: $' + totalAmount + ', Available: $' + user.balance });
      const balanceBefore = user.balance;
      user.balance = parseFloat((user.balance - totalAmount).toFixed(2));
      await user.save({ validateBeforeSave: false });
      const existingHolding = portfolio.holdings.find(function(h) { return h.stockSymbol === stock.symbol; });
      if (existingHolding) {
        const newQty = existingHolding.quantity + parseInt(quantity);
        const newTotal = existingHolding.totalInvested + totalAmount;
        existingHolding.averageBuyPrice = parseFloat((newTotal / newQty).toFixed(2));
        existingHolding.quantity = newQty;
        existingHolding.totalInvested = parseFloat(newTotal.toFixed(2));
      } else {
        portfolio.holdings.push({ stock: stock._id, stockSymbol: stock.symbol, quantity: parseInt(quantity), averageBuyPrice: stock.currentPrice, totalInvested: totalAmount });
      }
      portfolio.totalInvested = parseFloat((portfolio.totalInvested + totalAmount).toFixed(2));
      await portfolio.save();
      const transaction = await Transaction.create({ user: req.user._id, stock: stock._id, stockSymbol: stock.symbol, type: 'BUY', quantity: parseInt(quantity), priceAtTransaction: stock.currentPrice, totalAmount, status: 'COMPLETED', balanceBefore, balanceAfter: user.balance });
      return res.status(201).json({ success: true, message: 'Successfully bought ' + quantity + ' shares of ' + stock.symbol + '!', transaction, newBalance: user.balance });
    } else {
      const holding = portfolio.holdings.find(function(h) { return h.stockSymbol === stock.symbol; });
      if (!holding) return res.status(400).json({ success: false, message: 'You do not own any shares of ' + stock.symbol });
      if (holding.quantity < parseInt(quantity)) return res.status(400).json({ success: false, message: 'Insufficient shares. You own ' + holding.quantity + ' shares.' });
      const balanceBefore = user.balance;
      user.balance = parseFloat((user.balance + totalAmount).toFixed(2));
      await user.save({ validateBeforeSave: false });
      const costBasis = holding.averageBuyPrice * parseInt(quantity);
      const realizedPnL = totalAmount - costBasis;
      portfolio.realizedPnL = parseFloat((portfolio.realizedPnL + realizedPnL).toFixed(2));
      holding.quantity -= parseInt(quantity);
      holding.totalInvested = parseFloat((holding.quantity * holding.averageBuyPrice).toFixed(2));
      if (holding.quantity === 0) portfolio.holdings = portfolio.holdings.filter(function(h) { return h.stockSymbol !== stock.symbol; });
      portfolio.totalInvested = Math.max(0, parseFloat((portfolio.totalInvested - costBasis).toFixed(2)));
      await portfolio.save();
      const transaction = await Transaction.create({ user: req.user._id, stock: stock._id, stockSymbol: stock.symbol, type: 'SELL', quantity: parseInt(quantity), priceAtTransaction: stock.currentPrice, totalAmount, status: 'COMPLETED', balanceBefore, balanceAfter: user.balance });
      return res.status(201).json({ success: true, message: 'Successfully sold ' + quantity + ' shares of ' + stock.symbol + '!', transaction, newBalance: user.balance, realizedPnL: parseFloat(realizedPnL.toFixed(2)) });
    }
  } catch (error) { next(error); }
};

exports.getTransactions = async function(req, res, next) {
  try {
    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type.toUpperCase();
    if (req.query.symbol) query.stockSymbol = req.query.symbol.toUpperCase();
    const p = parseInt(req.query.page) || 1;
    const l = parseInt(req.query.limit) || 20;
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query).populate('stock', 'symbol name sector').sort({ createdAt: -1 }).skip((p-1)*l).limit(l);
    res.json({ success: true, count: transactions.length, total, pages: Math.ceil(total/l), transactions });
  } catch (error) { next(error); }
};

exports.getTransaction = async function(req, res, next) {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate('stock', 'symbol name currentPrice');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.json({ success: true, transaction });
  } catch (error) { next(error); }
};