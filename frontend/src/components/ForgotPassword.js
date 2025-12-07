/*
 * Calily - Forgot Password Component
 * Handles password reset request flow
 * 
 * Author: Ava Raper
 * Version: 1.0
 */

import React, { useState } from 'react';
import './AuthPage.css';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: email, 2: token, 3: new password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState(''); // For development only

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Reset code sent! Check your email or console.');
        // In development, the token is returned
        if (data.resetToken) {
          setDevToken(data.resetToken);
          console.log('Reset Token:', data.resetToken);
        }
        setStep(2);
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

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
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful! You can now login.');
        setStep(3);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">CALILY</h1>
        <p className="auth-subtitle">Reset Your Password</p>

        {step === 1 && (
          <form onSubmit={handleRequestReset} className="auth-form">
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-color)' }}>
              Enter your email to receive a password reset code
            </p>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <button 
              type="button"
              onClick={onBack}
              className="auth-link-button"
            >
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-color)' }}>
              Enter the 6-digit code sent to your email
            </p>

            {devToken && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <strong>DEV MODE:</strong> Your reset code is: <strong>{devToken}</strong>
              </div>
            )}
            
            <input
              type="text"
              placeholder="6-Digit Reset Code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              maxLength="6"
              className="auth-input"
            />

            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
              className="auth-input"
            />

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button"
              onClick={() => setStep(1)}
              className="auth-link-button"
            >
              Resend Code
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="auth-form">
            <div className="auth-success" style={{ fontSize: '1.1rem', padding: '1.5rem' }}>
              ✓ Password reset successful!<br />
              Redirecting to login...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;