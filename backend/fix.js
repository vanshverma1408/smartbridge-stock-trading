const fs = require('fs');

fs.writeFileSync('controllers/authController.js', `'use strict';
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const jwt = require('jsonwebtoken');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
}

exports.register = async function(req, res, next) {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    const user = await User.create({ name, email, password });
    await Portfolio.create({ user: user._id, holdings: [] });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Account created!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  } catch (error) {
    next(error);
  }
};

exports.login = async function(req, res, next) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance, watchlist: user.watchlist } });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async function(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async function(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async function(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.updateWatchlist = async function(req, res, next) {
  try {
    const symbol = req.body.symbol;
    const action = req.body.action;
    const user = await User.findById(req.user._id);
    if (action === 'add') {
      if (!user.watchlist.includes(symbol.toUpperCase())) user.watchlist.push(symbol.toUpperCase());
    } else {
      user.watchlist = user.watchlist.filter(function(s) { return s !== symbol.toUpperCase(); });
    }
    await user.save();
    res.json({ success: true, watchlist: user.watchlist });
  } catch (error) {
    next(error);
  }
};
`, 'utf8');

console.log('authController.js written!');