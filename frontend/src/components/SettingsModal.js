/*
 * Calily - Settings Modal Component
 * Handles user settings including password change
 * 
 * Author: Ava Raper
 * Version: 1.0
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
  const [passwordStrength, setPasswordStrength] = useState('');

  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  if (!isOpen) return null;

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'fair';
    
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    
    const strength = [hasNumber, hasSpecial, hasUpper, hasLower].filter(Boolean).length;
    
    if (strength >= 3 && password.length >= 10) return 'strong';
    if (strength >= 2 && password.length >= 8) return 'good';
    return 'fair';
  };

  const handleNewPasswordChange = (e) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    if (pwd) {
      setPasswordStrength(checkPasswordStrength(pwd));
    } else {
      setPasswordStrength('');
    }
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
        setPasswordStrength('');
        
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

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#dc3545';
      case 'fair': return '#ffc107';
      case 'good': return '#17a2b8';
      case 'strong': return '#28a745';
      default: return '#ccc';
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
              <form onSubmit={handleChangePassword}>
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
                    onChange={handleNewPasswordChange}
                    required
                    minLength="6"
                    className="settings-input"
                  />
                  {passwordStrength && (
                    <div className="password-strength">
                      <div className="strength-bar-container">
                        <div 
                          className="strength-bar"
                          style={{ 
                            width: passwordStrength === 'weak' ? '25%' 
                              : passwordStrength === 'fair' ? '50%'
                              : passwordStrength === 'good' ? '75%'
                              : '100%',
                            backgroundColor: getPasswordStrengthColor()
                          }}
                        />
                      </div>
                      <span style={{ color: getPasswordStrengthColor(), fontSize: '0.85rem' }}>
                        Strength: {passwordStrength}
                      </span>
                    </div>
                  )}
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
                  type="submit" 
                  className="settings-button"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>

              <div className="security-info">
                <h4>Password Requirements:</h4>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>Recommended: Include numbers and special characters</li>
                  <li>Recommended: Mix of uppercase and lowercase letters</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;