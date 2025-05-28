import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const foundUser = JSON.parse(loggedInUser);
      setUser(foundUser);
      
      // Fetch user settings including 2FA status
      fetchUserSettings(foundUser._id);
    } else {
      // Redirect to login if not logged in
      navigate('/SignIn');
    }
  }, [navigate]);

  const fetchUserSettings = async (userId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const response = await axios.get(`http://localhost:5002/api/users/settings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFAEnabled(response.data.twoFAEnabled);
    } catch (error) {
      setError('Failed to fetch user settings');
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5002/api/users/enable-2fa', {
        userId: user._id,
        password
      });
      
      if (response.data.requireOTP) {
        setShowOTPInput(true);
        setMessage('OTP sent to your email. Please verify to enable 2FA.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5002/api/users/confirm-enable-2fa', {
        userId: user._id,
        otp
      });
      
      setShowOTPInput(false);
      setTwoFAEnabled(true);
      setMessage('Two-factor authentication enabled successfully');
      setPassword('');
      setOtp('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify OTP');
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5002/api/users/disable-2fa', {
        userId: user._id,
        password
      });
      
      setTwoFAEnabled(false);
      setMessage('Two-factor authentication disabled successfully');
      setPassword('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  return (
    <div className='container'>
      <div className='settings-box'>
        <h1>Account Settings</h1>
        
        {message && <div style={{color: 'green', marginBottom: '10px'}}>{message}</div>}
        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
        
        <div className='settings-section'>
          <h2>Two-Factor Authentication</h2>
          <p>Current status: <strong>{twoFAEnabled ? 'Enabled' : 'Disabled'}</strong></p>
          
          {showOTPInput ? (
            <form onSubmit={handleVerifyOTP}>
              <div className='form-group'>
                <label>Enter OTP sent to your email</label>
                <input
                  type='text'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <button type='submit'>Verify OTP</button>
            </form>
          ) : (
            <form onSubmit={twoFAEnabled ? handleDisable2FA : handleEnable2FA}>
              <div className='form-group'>
                <label>Confirm your password</label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type='submit'>
                {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </form>
          )}
        </div>
        
        <button onClick={() => navigate('/welcome')} className='back-button'>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserSettings;