import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Name is required.');
    setLoadingProfile(true);
    try {
      await axios.put('/auth/profile', { name });
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error('Please fill in all fields.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoadingPassword(true);
    try {
      await axios.put('/auth/password', { currentPassword, newPassword });
      toast.success('Password changed!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ marginBottom: '0.3rem' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <span className={`badge ${user?.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>{user?.role}</span>
          </div>
        </div>
        <div className="grid-3">
          {[
            { label: 'Cash Balance', value: `$${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'var(--success)' },
            { label: 'Account Status', value: 'Active', color: 'var(--success)' },
            { label: 'Member Since', value: new Date(user?.createdAt).toLocaleDateString() }
          ].map((item, i) => (
            <div key={i} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Update Profile</h3>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={user?.email} disabled style={{ opacity: 0.6 }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
            {loadingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loadingPassword}>
            {loadingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;