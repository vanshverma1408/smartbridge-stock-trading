import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <div className="hero">
        <h1>Trade Smarter with SmartBridge</h1>
        <p>Experience real-time stock trading with virtual money. Build your portfolio, track performance, and master the markets.</p>
        <div className="hero-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/market" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>Browse Market</Link>
              <Link to="/portfolio" className="btn btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>My Portfolio</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>Start Trading Free</Link>
              <Link to="/market" className="btn btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>View Market</Link>
            </>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>Everything You Need to Trade</h2>
        <div className="grid-3">
          {[
            { icon: '📊', title: 'Real-Time Market Data', desc: 'Live price updates with simulated market fluctuations across 15+ major stocks.' },
            { icon: '💼', title: 'Portfolio Tracking', desc: 'Track your holdings, monitor profit/loss, and visualize your investment performance.' },
            { icon: '🔒', title: 'Secure Authentication', desc: 'JWT-based authentication with bcrypt password encryption keeps your account safe.' },
            { icon: '⚡', title: 'Instant Trade Execution', desc: 'Buy and sell stocks instantly with real-time balance updates and transaction history.' },
            { icon: '📈', title: 'Price Charts', desc: 'Interactive charts showing 30-day price history for every stock on the platform.' },
            { icon: '🛡️', title: 'Admin Controls', desc: 'Full admin panel to manage users, stocks, and monitor all platform activity.' }
          ].map((feature, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3rem 2rem' }}>
        <div className="container">
          <div className="grid-4">
            {[
              { value: '15+', label: 'Stocks Available' },
              { value: '$100K', label: 'Starting Balance' },
              { value: '100%', label: 'Free to Use' },
              { value: '24/7', label: 'Platform Access' }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>{stat.value}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Start Trading?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join SmartBridge today and get $100,000 in virtual money to start your trading journey.</p>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }}>Create Free Account</Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;