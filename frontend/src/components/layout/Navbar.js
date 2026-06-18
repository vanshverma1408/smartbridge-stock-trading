import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        📈 SmartBridge
      </Link>

      <div className="navbar-links">
        <Link to="/market" className={isActive('/market')}>Market</Link>

        {isAuthenticated && (
          <>
            <Link to="/portfolio" className={isActive('/portfolio')}>Portfolio</Link>
            <Link to="/transactions" className={isActive('/transactions')}>Transactions</Link>
          </>
        )}

        {isAdmin && (
          <Link to="/admin" className={isActive('/admin')}>Admin</Link>
        )}

        {isAuthenticated ? (
          <>
            <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
              ${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <Link to="/profile" className={isActive('/profile')}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem'
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;