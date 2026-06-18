import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { portfolioAPI } from '../services/api';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const { data } = await portfolioAPI.get();
        setPortfolio(data.portfolio);
      } catch {
        toast.error('Failed to load portfolio.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner message="Loading portfolio..." />;
  if (!portfolio) return null;

  const { summary, holdings } = portfolio;
  const pieData = holdings.map(h => ({ name: h.stockSymbol, value: h.currentValue }));

  return (
    <div className="container">
      <div className="page-header">
        <h1>💼 My Portfolio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your investments and performance</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Net Worth', value: `$${summary.netWorth?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '💰', color: 'var(--accent)' },
          { label: 'Cash Balance', value: `$${summary.cashBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '💵', color: 'var(--text-primary)' },
          { label: 'Portfolio Value', value: `$${summary.totalCurrentValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '📊', color: 'var(--text-primary)' },
          { label: 'Unrealized P&L', value: `${summary.totalUnrealizedPnL >= 0 ? '+' : ''}$${summary.totalUnrealizedPnL?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: summary.totalUnrealizedPnL >= 0 ? '📈' : '📉', color: summary.totalUnrealizedPnL >= 0 ? 'var(--success)' : 'var(--danger)' }
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ fontSize: '1.3rem', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Performance Summary</h3>
          {[
            { label: 'Total Cost Basis', value: `$${summary.totalCostBasis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
            { label: 'Portfolio Return', value: `${summary.portfolioReturn >= 0 ? '+' : ''}${summary.portfolioReturn?.toFixed(2)}%`, color: summary.portfolioReturn >= 0 ? 'var(--success)' : 'var(--danger)' },
            { label: 'Realized P&L', value: `${summary.realizedPnL >= 0 ? '+' : ''}$${summary.realizedPnL?.toFixed(2)}`, color: summary.realizedPnL >= 0 ? 'var(--success)' : 'var(--danger)' },
            { label: 'Total Positions', value: summary.totalPositions }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: item.color || 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {pieData.length > 0 ? (
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value) => [`$${value?.toFixed(2)}`, 'Value']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>📭</div>
            <p style={{ color: 'var(--text-secondary)' }}>No holdings yet</p>
            <Link to="/market" className="btn btn-primary">Browse Stocks</Link>
          </div>
        )}
      </div>

      {holdings.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}><h3>Current Holdings</h3></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th><th>Shares</th><th>Avg Buy</th><th>Current Price</th><th>Value</th><th>P&L</th><th>Return</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.stockSymbol}>
                    <td><div style={{ fontWeight: 700, color: 'var(--accent)' }}>{h.stockSymbol}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h.stock?.name}</div></td>
                    <td>{h.quantity}</td>
                    <td>${h.averageBuyPrice?.toFixed(2)}</td>
                    <td>${h.currentPrice?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${h.currentValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className={h.unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}>{h.unrealizedPnL >= 0 ? '+' : ''}${h.unrealizedPnL?.toFixed(2)}</td>
                    <td><span className={`badge ${h.unrealizedPnLPercent >= 0 ? 'badge-success' : 'badge-danger'}`}>{h.unrealizedPnLPercent >= 0 ? '▲' : '▼'} {Math.abs(h.unrealizedPnLPercent)?.toFixed(2)}%</span></td>
                    <td><Link to={`/stocks/${h.stockSymbol}`} className="btn btn-primary btn-sm">Trade</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;