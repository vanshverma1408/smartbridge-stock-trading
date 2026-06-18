import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { stocksAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import toast from 'react-hot-toast';

const StockDetailPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateBalance } = useAuth();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [trading, setTrading] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      const { data } = await stocksAPI.getOne(symbol);
      setStock(data.stock);
    } catch {
      toast.error('Stock not found.');
      navigate('/market');
    } finally {
      setLoading(false);
    }
  }, [symbol, navigate]);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await stocksAPI.getHistory(symbol);
      const formatted = data.history.map((h, i) => ({
        name: i + 1,
        price: h.price,
        date: new Date(h.timestamp).toLocaleDateString()
      }));
      setHistory(formatted);
    } catch {}
  }, [symbol]);

  useEffect(() => {
    fetchStock();
    if (isAuthenticated) fetchHistory();
    const interval = setInterval(fetchStock, 10000);
    return () => clearInterval(interval);
  }, [fetchStock, fetchHistory, isAuthenticated]);

  const handleTrade = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade.');
      navigate('/login');
      return;
    }
    if (quantity < 1) return toast.error('Quantity must be at least 1.');
    setTrading(true);
    try {
      const { data } = await transactionsAPI.trade({ symbol, type: tradeType, quantity: parseInt(quantity) });
      toast.success(data.message);
      updateBalance(data.newBalance);
      fetchStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Trade failed.');
    } finally {
      setTrading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading stock data..." />;
  if (!stock) return null;

  const change = stock.currentPrice - stock.previousClose;
  const changePercent = stock.previousClose > 0 ? (change / stock.previousClose * 100) : 0;
  const isPositive = change >= 0;
  const totalCost = (stock.currentPrice * quantity).toFixed(2);

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stock.symbol}</h1>
            <span className="badge badge-info">{stock.sector}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{stock.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>${stock.currentPrice?.toFixed(2)}</div>
          <div className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '1.1rem' }}>
            {isPositive ? '▲' : '▼'} {Math.abs(change)?.toFixed(2)} ({Math.abs(changePercent)?.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Left Column */}
        <div>
          {/* Stats */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Stock Details</h3>
            <div className="grid-2" style={{ gap: '1rem' }}>
              {[
                { label: 'Open', value: `$${stock.openPrice?.toFixed(2)}` },
                { label: 'Prev Close', value: `$${stock.previousClose?.toFixed(2)}` },
                { label: 'Day High', value: `$${stock.dayHigh?.toFixed(2)}` },
                { label: 'Day Low', value: `$${stock.dayLow?.toFixed(2)}` },
                { label: 'Volume', value: stock.volume?.toLocaleString() },
                { label: 'Market Cap', value: stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(1)}B` : 'N/A' },
                { label: 'P/E Ratio', value: stock.peRatio?.toFixed(2) || 'N/A' },
                { label: 'Dividend Yield', value: stock.dividendYield ? `${stock.dividendYield?.toFixed(2)}%` : 'N/A' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {stock.description && (
            <div className="card">
              <h3 style={{ marginBottom: '0.8rem' }}>About {stock.name}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{stock.description}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Chart */}
          {history.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>30-Day Price History</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value) => [`$${value?.toFixed(2)}`, 'Price']}
                  />
                  <Line type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trade Panel */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Execute Trade</h3>
            {isAuthenticated ? (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <button
                    className={`btn ${tradeType === 'BUY' ? 'btn-success' : 'btn-outline'}`}
                    style={{ flex: 1, padding: '0.75rem' }}
                    onClick={() => setTradeType('BUY')}
                  >
                    BUY
                  </button>
                  <button
                    className={`btn ${tradeType === 'SELL' ? 'btn-danger' : 'btn-outline'}`}
                    style={{ flex: 1, padding: '0.75rem' }}
                    onClick={() => setTradeType('SELL')}
                  >
                    SELL
                  </button>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Price per share</span>
                    <span>${stock.currentPrice?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontWeight: 700 }}>
                    <span>Total</span>
                    <span>${totalCost}</span>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Available Balance: <span style={{ color: 'var(--success)', fontWeight: 600 }}>${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <button
                  className={`btn ${tradeType === 'BUY' ? 'btn-success' : 'btn-danger'}`}
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
                  onClick={handleTrade}
                  disabled={trading}
                >
                  {trading ? 'Processing...' : `${tradeType} ${quantity} Share${quantity > 1 ? 's' : ''} for $${totalCost}`}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Login to start trading</p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                  Login to Trade
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;