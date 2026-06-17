'use strict';
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

exports.getPortfolio = async function(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id }).populate('holdings.stock', 'symbol name currentPrice sector previousClose');
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found.' });
    const user = await User.findById(req.user._id).select('balance name email');
    let totalCurrentValue = 0;
    let totalCostBasis = 0;
    const enrichedHoldings = portfolio.holdings.filter(function(h) { return h.quantity > 0; }).map(function(holding) {
      const stock = holding.stock;
      const currentPrice = stock ? stock.currentPrice : holding.averageBuyPrice;
      const currentValue = currentPrice * holding.quantity;
      const costBasis = holding.averageBuyPrice * holding.quantity;
      const unrealizedPnL = currentValue - costBasis;
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
      totalCurrentValue += currentValue;
      totalCostBasis += costBasis;
      return {
        _id: holding._id,
        stock,
        stockSymbol: holding.stockSymbol,
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        costBasis: parseFloat(costBasis.toFixed(2)),
        unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
        unrealizedPnLPercent: parseFloat(unrealizedPnLPercent.toFixed(2)),
        dayChange: stock ? (stock.currentPrice - stock.previousClose) : 0,
        dayChangePercent: stock && stock.previousClose > 0 ? ((stock.currentPrice - stock.previousClose) / stock.previousClose * 100) : 0
      };
    });
    const totalUnrealizedPnL = totalCurrentValue - totalCostBasis;
    const portfolioReturn = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
    res.json({
      success: true,
      portfolio: {
        holdings: enrichedHoldings,
        summary: {
          cashBalance: user.balance,
          totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
          totalCostBasis: parseFloat(totalCostBasis.toFixed(2)),
          totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
          portfolioReturn: parseFloat(portfolioReturn.toFixed(2)),
          realizedPnL: portfolio.realizedPnL,
          netWorth: parseFloat((user.balance + totalCurrentValue).toFixed(2)),
          totalPositions: enrichedHoldings.length
        }
      }
    });
  } catch (error) { next(error); }
};