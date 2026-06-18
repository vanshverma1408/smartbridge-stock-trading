import React, { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../services/api';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import toast from 'react-hot-toast';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = { page, limit: 15 };
      if (filter !== 'all') params.type = filter;
      const { data } = await transactionsAPI.getAll(params);
      setTransactions(data.transactions);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  if (loading) return <LoadingSpinner message="Loading transactions..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>📋 Transaction History</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{total} total transactions</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Transactions', value: total, icon: '📊' },
          { label: 'Total Bought', value: `$${transactions.filter(t => t.type === 'BUY').reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '🟢' },
          { label: 'Total Sold', value: `$${transactions.filter(t => t.type === 'SELL').reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '🔴' }
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'BUY', 'SELL'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilter(f); setPage(1); }}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Symbol</th><th>Shares</th><th>Price</th><th>Total</th><th>Balance After</th><th>Status</th></tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx._id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(tx.createdAt).toLocaleDateString()}<br />{new Date(tx.createdAt).toLocaleTimeString()}</td>
                  <td><span className={`badge ${tx.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>{tx.type}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{tx.stockSymbol}</td>
                  <td>{tx.quantity}</td>
                  <td>${tx.priceAtTransaction?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>${tx.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--success)' }}>${tx.balanceAfter?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td><span className="badge badge-success">{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No transactions yet. Start trading!</div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span style={{ padding: '0.3rem 0.8rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;