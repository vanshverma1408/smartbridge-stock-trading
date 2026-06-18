import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stocksAPI } from '../services/api';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import toast from 'react-hot-toast';

const MarketPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [sort, setSort] = useState('symbol');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStocks = useCallback(async () => {
    try {
      const { data } = await stocksAPI.getAll({ search, sector, sort });
      setStocks(data.stocks);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to load stocks.');
    } finally {
      setLoading(false);
    }
  }, [search, sector, sort]);

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 10000);
    return () => clearInterval(interval);
  }, [fetchStocks]);

  const sectors = ['all', 'Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy'];

  if (loading) return <LoadingSpinner message="Loading market data..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>📊 Stock Market</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Live prices · Auto-updates every 10 seconds
          {lastUpdated && <span> · Last updated: {lastUpdated.toLocaleTimeString()}</span>}
        </p>
      </div>

      <div className="search-bar">
        <input type="text" className="search-input" placeholder="Search stocks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-control" style={{ width: 'auto' }} value={sector} onChange={(e) => setSector(e.target.value)}>
          {sectors.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sectors' : s}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="symbol">Sort: Symbol</option>
          <option value="price">Sort: Price</option>
          <option value="volume">Sort: Volume</option>
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Stocks', value: stocks.length, icon: '📋' },
          { label: 'Gainers', value: stocks.filter(s => (s.currentPrice - s.previousClose) > 0).length, icon: '📈' },
          { label: 'Losers', value: stocks.filter(s => (s.currentPrice - s.previousClose) < 0).length, icon: '📉' },
          { label: 'Avg Change', value: stocks.length > 0 ? (stocks.reduce((acc, s) => acc + ((s.currentPrice - s.previousClose) / (s.previousClose || 1) * 100), 0) / stocks.length).toFixed(2) + '%' : '0%', icon: '⚡' }
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Price</th>
                <th>Change</th>
                <th>Change %</th>
                <th>Volume</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => {
                const change = stock.currentPrice - stock.previousClose;
                const changePercent = stock.previousClose > 0 ? (change / stock.previousClose * 100) : 0;
                const isPositive = change >= 0;
                return (
                  <tr key={stock.symbol}>
                    <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{stock.symbol}</span></td>
                    <td>{stock.name}</td>
                    <td><span className="badge badge-info">{stock.sector}</span></td>
                    <td style={{ fontWeight: 600 }}>${stock.currentPrice?.toFixed(2)}</td>
                    <td className={isPositive ? 'text-success' : 'text-danger'}>{isPositive ? '+' : ''}{change?.toFixed(2)}</td>
                    <td><span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`}>{isPositive ? '▲' : '▼'} {Math.abs(changePercent)?.toFixed(2)}%</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{stock.volume?.toLocaleString()}</td>
                    <td><Link to={`/stocks/${stock.symbol}`} className="btn btn-primary btn-sm">Trade</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {stocks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No stocks found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPage;