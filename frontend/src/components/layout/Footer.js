import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
          📈 SmartBridge
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <Link to="/market" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Market</Link>
        <Link to="/portfolio" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Portfolio</Link>
      </div>
      <p>© 2024 SmartBridge Stock Trading Platform. Built with MERN Stack.</p>
      <p style={{ marginTop: '0.3rem', fontSize: '0.75rem' }}>
        ⚠️ This is a simulated trading platform for educational purposes only.
      </p>
    </footer>
  );
};

export default Footer;