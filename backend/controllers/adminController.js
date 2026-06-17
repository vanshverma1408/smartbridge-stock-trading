'use strict';
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

exports.getDashboardStats = async function(req, res, next) {
  try {
    const totalUsers = await User.countDocuments({ role: 'USER' });
    const totalStocks = await Stock.countDocuments({ isActive: true });
    const totalTransactions = await Transaction.countDocuments();
    const recentTransactions = await Transaction.find().populate('user', 'name email').populate('stock', 'symbol name').sort({ createdAt: -1 }).limit(10);
    const topStocks = await Stock.find({ isActive: true }).sort({ volume: -1 }).limit(5).select('symbol name currentPrice volume');
    const totalVolume = await Transaction.aggregate([{ '$group': { _id: null, total: { '$sum': '$totalAmount' } } }]);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTransactions = await Transaction.countDocuments({ createdAt: { '$gte': todayStart } });
    res.json({ success: true, stats: { totalUsers, totalStocks, totalTransactions, totalVolume: totalVolume[0] ? totalVolume[0].total : 0, todayTransactions, recentTransactions, topStocks } });
  } catch (error) { next(error); }
};

exports.getAllUsers = async function(req, res, next) {
  try {
    const p = parseInt(req.query.page) || 1;
    const l = parseInt(req.query.limit) || 20;
    const query = {};
    if (req.query.search) query['$or'] = [{ name: { '$regex': req.query.search, '$options': 'i' } }, { email: { '$regex': req.query.search, '$options': 'i' } }];
    if (req.query.role) query.role = req.query.role.toUpperCase();
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((p-1)*l).limit(l).select('-password');
    res.json({ success: true, total, pages: Math.ceil(total/l), users });
  } catch (error) { next(error); }
};

exports.toggleUserStatus = async function(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'User ' + (user.isActive ? 'activated' : 'suspended') + '.', user });
  } catch (error) { next(error); }
};

exports.updateUserRole = async function(req, res, next) {
  try {
    const role = req.body.role;
    if (!['USER','ADMIN'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Role updated.', user });
  } catch (error) { next(error); }
};

exports.getAllTransactions = async function(req, res, next) {
  try {
    const p = parseInt(req.query.page) || 1;
    const l = parseInt(req.query.limit) || 20;
    const query = {};
    if (req.query.type) query.type = req.query.type.toUpperCase();
    if (req.query.symbol) query.stockSymbol = req.query.symbol.toUpperCase();
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query).populate('user', 'name email').populate('stock', 'symbol name').sort({ createdAt: -1 }).skip((p-1)*l).limit(l);
    res.json({ success: true, total, pages: Math.ceil(total/l), transactions });
  } catch (error) { next(error); }
};