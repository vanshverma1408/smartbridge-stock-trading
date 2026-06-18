import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, stocksAPI } from '../services/api';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, txRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 20 }),
        adminAPI.getTransactions({ limit: 15 })
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setTransactions(txRes.data.transactions);
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      toast.success(data.message);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch { toast.error('Failed to update user.'); }
  };

  const handleSeedStocks = async () => {
    try {
      await stocksAPI.seed();
      toast.success('Stocks seeded!');
      fetchData();
    } catch { toast.error('Failed to seed stocks.'); }
  };

  const handleSearchUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ search: userSearch, limit: 20 });
      setUsers(data.users);
    } catch { toast.error('Search failed.'); }
  };

  if (loading) return <LoadingSpinner message="Loading admin data..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage users, stocks and monitor activity</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {['overview', 'users', 'transactions', 'stocks'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', textTransform: 'capitalize', transition: 'all 0.2s' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            {[
              { label: 'Total Users', value: stats?.totalUsers, icon: '👥' },
              { label: 'Total Stocks', value: stats?.totalStocks, icon: '📈' },
              { label: 'Total Transactions', value: stats?.totalTransactions, icon: '💱' },
              { label: "Today's Trades", value: stats?.todayTransactions, icon: '⚡' }
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value || 0}</div>
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}><h3>Recent Transactions</h3></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>User</th><th>Type</th><th>Symbol</th><th>Amount</th></tr></thead>
                  <tbody>
                    {stats?.recentTransactions?.slice(0, 8).map(tx => (
                      <tr key={tx._id}>
                        <td style={{ fontSize: '0.85rem' }}>{tx.user?.name}</td>
                        <td><span className={`badge ${tx.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>{tx.type}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{tx.stockSymbol}</td>
                        <td>${tx.totalAmount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}><h3>Top Stocks by Volume</h3></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Symbol</th><th>Price</th><th>Volume</th></tr></thead>
                  <tbody>
                    {stats?.topStocks?.map(stock => (
                      <tr key={stock.symbol}>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{stock.symbol}</td>
                        <td>${stock.currentPrice?.toFixed(2)}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{stock.volume?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input type="text" className="search-input" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUsers()} />
            <button className="btn btn-primary" onClick={handleSearchUsers}>Search</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Balance</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.email}</td>
                      <td><span className={`badge ${user.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>{user.role}</span></td>
                      <td style={{ color: 'var(--success)' }}>${user.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{user.role !== 'ADMIN' && <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleUser(user._id)}>{user.isActive ? 'Suspend' : 'Activate'}</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>User</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{tx.user?.name}</td>
                    <td><span className={`badge ${tx.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>{tx.type}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{tx.stockSymbol}</td>
                    <td>{tx.quantity}</td>
                    <td>${tx.priceAtTransaction?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${tx.totalAmount?.toFixed(2)}</td>
                    <td><span className="badge badge-success">{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stocks' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleSeedStocks}>🌱 Re-seed All Stocks</button>
          </div>
          <div className="card">
            <p style={{ color: 'var(--text-secondary)' }}>Use Re-seed to reset all stock data with fresh prices and history.</p>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active stocks: <strong style={{ color: 'var(--text-primary)' }}>{stats?.totalStocks}</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>Total volume: <strong style={{ color: 'var(--success)' }}>${stats?.totalVolume?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;