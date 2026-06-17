'use strict';
const Stock = require('../models/Stock');

const simulatePriceChange = (currentPrice) => {
  const changePercent = (Math.random() - 0.48) * 0.04;
  return Math.max(0.01, parseFloat((currentPrice * (1 + changePercent)).toFixed(2)));
};

exports.getStocks = async function(req, res, next) {
  try {
    const p = parseInt(req.query.page) || 1;
    const l = parseInt(req.query.limit) || 20;
    const query = { isActive: true };
    if (req.query.sector && req.query.sector !== 'all') query.sector = req.query.sector;
    if (req.query.search) {
      query['$or'] = [
        { symbol: { '$regex': req.query.search, '$options': 'i' } },
        { name: { '$regex': req.query.search, '$options': 'i' } }
      ];
    }
    const sortObj = {};
    if (req.query.sort === 'price') sortObj.currentPrice = -1;
    else if (req.query.sort === 'volume') sortObj.volume = -1;
    else sortObj.symbol = 1;
    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query).sort(sortObj).skip((p-1)*l).limit(l).select('-priceHistory');
    res.json({ success: true, count: stocks.length, total, pages: Math.ceil(total/l), stocks });
  } catch (error) { next(error); }
};

exports.getStock = async function(req, res, next) {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase(), isActive: true });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, stock });
  } catch (error) { next(error); }
};

exports.getLivePrices = async function(req, res, next) {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',').map(function(s) { return s.toUpperCase(); }) : [];
    const query = { isActive: true };
    if (symbols.length > 0) query.symbol = { '$in': symbols };
    const stocks = await Stock.find(query).select('symbol currentPrice previousClose');
    const updates = await Promise.all(stocks.map(async function(stock) {
      const newPrice = simulatePriceChange(stock.currentPrice);
      await Stock.findByIdAndUpdate(stock._id, {
        currentPrice: newPrice,
        '$push': { priceHistory: { '$each': [{ price: newPrice, timestamp: new Date() }], '$slice': -100 } },
        lastUpdated: new Date()
      });
      return {
        symbol: stock.symbol,
        currentPrice: newPrice,
        previousClose: stock.previousClose,
        change: parseFloat((newPrice - stock.previousClose).toFixed(2)),
        changePercent: parseFloat(((newPrice - stock.previousClose) / stock.previousClose * 100).toFixed(2))
      };
    }));
    res.json({ success: true, prices: updates, timestamp: new Date() });
  } catch (error) { next(error); }
};

exports.getStockHistory = async function(req, res, next) {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() }).select('symbol name priceHistory currentPrice previousClose');
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, symbol: stock.symbol, history: stock.priceHistory });
  } catch (error) { next(error); }
};

exports.createStock = async function(req, res, next) {
  try {
    const stock = await Stock.create({
      ...req.body,
      previousClose: req.body.currentPrice,
      openPrice: req.body.currentPrice,
      dayHigh: req.body.currentPrice,
      dayLow: req.body.currentPrice,
      priceHistory: [{ price: req.body.currentPrice }]
    });
    res.status(201).json({ success: true, message: 'Stock created.', stock });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Stock symbol already exists.' });
    next(error);
  }
};

exports.updateStock = async function(req, res, next) {
  try {
    const stock = await Stock.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, message: 'Stock updated.', stock });
  } catch (error) { next(error); }
};

exports.deleteStock = async function(req, res, next) {
  try {
    const stock = await Stock.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      { isActive: false },
      { new: true }
    );
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    res.json({ success: true, message: 'Stock deactivated.' });
  } catch (error) { next(error); }
};

exports.seedStocks = async function(req, res, next) {
  try {
    const sampleStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', currentPrice: 182.52, marketCap: 2850000000000, volume: 55234000, description: 'Apple designs iPhones, Macs, iPads and wearables.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', currentPrice: 415.26, marketCap: 3080000000000, volume: 21456000, description: 'Microsoft develops software and services worldwide.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', currentPrice: 166.41, marketCap: 2050000000000, volume: 18765000, description: 'Alphabet provides internet services through Google.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology', currentPrice: 185.07, marketCap: 1940000000000, volume: 31234000, description: 'Amazon provides consumer products through online stores.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', currentPrice: 875.39, marketCap: 2160000000000, volume: 42300000, description: 'NVIDIA designs graphics processors worldwide.' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology', currentPrice: 175.82, marketCap: 559000000000, volume: 98750000, description: 'Tesla designs and manufactures electric vehicles.' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', currentPrice: 504.22, marketCap: 1290000000000, volume: 15432000, description: 'Meta develops social networking products worldwide.' },
      { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', currentPrice: 198.45, marketCap: 572000000000, volume: 12300000, description: 'JPMorgan operates as a global financial services company.' },
      { symbol: 'JNJ', name: 'Johnson and Johnson', sector: 'Healthcare', currentPrice: 147.89, marketCap: 356000000000, volume: 8900000, description: 'JnJ manufactures healthcare products worldwide.' },
      { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', currentPrice: 68.73, marketCap: 552000000000, volume: 14500000, description: 'Walmart engages in retail and wholesale operations.' },
      { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', currentPrice: 112.34, marketCap: 448000000000, volume: 22100000, description: 'Exxon Mobil explores and produces crude oil.' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', currentPrice: 276.43, marketCap: 565000000000, volume: 7800000, description: 'Visa operates as a payment technology company.' },
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', currentPrice: 521.78, marketCap: 481000000000, volume: 2900000, description: 'UnitedHealth provides health care coverage services.' },
      { symbol: 'PG', name: 'Procter and Gamble', sector: 'Consumer', currentPrice: 163.22, marketCap: 384000000000, volume: 6100000, description: 'PG provides consumer packaged goods worldwide.' },
      { symbol: 'BRK', name: 'Berkshire Hathaway', sector: 'Finance', currentPrice: 395.20, marketCap: 865000000000, volume: 3400000, description: 'Berkshire Hathaway engages in diversified businesses.' }
    ];
    const stocksWithHistory = sampleStocks.map(function(stock) {
      return {
        ...stock,
        previousClose: parseFloat((stock.currentPrice * (1 - (Math.random() - 0.5) * 0.04)).toFixed(2)),
        openPrice: stock.currentPrice,
        dayHigh: parseFloat((stock.currentPrice * 1.02).toFixed(2)),
        dayLow: parseFloat((stock.currentPrice * 0.98).toFixed(2)),
        peRatio: parseFloat((Math.random() * 40 + 10).toFixed(2)),
        dividendYield: parseFloat((Math.random() * 3).toFixed(2)),
        priceHistory: Array.from({ length: 30 }, function(_, i) {
          return {
            price: parseFloat((stock.currentPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
            timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
          };
        })
      };
    });
    await Stock.deleteMany({});
    const created = await Stock.insertMany(stocksWithHistory);
    res.json({ success: true, message: created.length + ' stocks seeded!' });
  } catch (error) { next(error); }
};