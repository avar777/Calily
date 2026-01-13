/*
 * Calily - Settings Modal Component
 * Handles user settings including password change and theme selection
 * 
 * Author: Ava Raper
 * Version: 2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const themes = [
    {
      name: 'Default',
      primary: '#7a9b7f',
      background: '#f5f1e8',
      cardBg: '#ffffff',
      text: '#2c3e3f',
      navtext: '#2c3e3f',
      border: '#d4c5b0',
      inputBorder: '#d4c5b0',
      buttonText: '#ffffff',
      deleteBtn: '#d98572',
      deleteBtnText: '#ffffff',
      chartBar: '#7a9b7f',
      entryBorder: '#d98572',
      setting: '#d4c5b0'
    },
    {
      name: 'Light',
      primary: '#83bdf3ff',
      background: '#ffffffff',
      cardBg: '#a1a1a1ff',
      text: '#ffffffff',
      navtext: '#000000',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#d98572',
      setting: '#a1a1a1ff'
    },
    {
      name: 'Dark',
      primary: '#83bdf3ff',
      background: '#474747ff',
      cardBg: '#919191ff',
      text: '#ffffffff',
      navtext: '#ffffffff',
      border: '#000000',
      inputBorder: '#000000',
      buttonText: '#ffffffff',
      deleteBtn: '#83bdf3ff',
      deleteBtnText: '#ffffff',
      chartBar: '#83bdf3ff',
      entryBorder: '#d98572',
      setting: '#474747ff'
    }
  ];

  if (!isOpen) return null;

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--title-color', theme.primary);
    root.style.setProperty('--nav-color', theme.navtext);
    root.style.setProperty('--bg-color', theme.background);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--input-border', theme.inputBorder);
    root.style.setProperty('--button-text', theme.buttonText);
    root.style.setProperty('--delete-btn', theme.deleteBtn);
    root.style.setProperty('--delete-btn-text', theme.deleteBtnText);
    root.style.setProperty('--chart-bar', theme.chartBar);
    root.style.setProperty('--entry-border', theme.entryBorder);
    root.style.setProperty('--setting-button-color', theme.setting);
    
    // Let other components know
    window.dispatchEvent(new CustomEvent('themeChanged'));
    localStorage.setItem('calily-theme', JSON.stringify(theme));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear success message after a bit
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            Theme
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Information</h3>
              <div className="info-item">
                <label>Name:</label>
                <span>{user?.name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-item">
                <label>Last Login:</label>
                <span>
                  {user?.lastLogin 
                    ? new Date(user.lastLogin).toLocaleString() 
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Change Password</h3>
              <div className="password-change-section">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="settings-input"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="6"
                    className="settings-input"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength="6"
                    className="settings-input"
                  />
                </div>

                {error && <div className="settings-error">{error}</div>}
                {success && <div className="settings-success">{success}</div>}

                <button 
                  onClick={handleChangePassword}
                  className="settings-button"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="settings-section">
              <h3>Choose Theme</h3>
              <div className="theme-options-list">
                {themes.map((theme) => (
                  <div
                    key={theme.name}
                    className="theme-option-card"
                    onClick={() => applyTheme(theme)}
                  >
                    <div className="theme-swatches">
                      <div className="color-swatch" style={{ backgroundColor: theme.entryBorder }}></div>
                      <div className="color-swatch" style={{ backgroundColor: theme.background }}></div>
                      <div className="color-swatch" style={{ backgroundColor: theme.cardBg }}></div>
                      <div className="color-swatch" style={{ backgroundColor: theme.deleteBtn }}></div>
                    </div>
                    <span>{theme.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;