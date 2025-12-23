

import React, { useState } from 'react';
import './LoginPage.css'; // Importing the standard CSS file

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required to access the dashboard.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Simulate API delay for dramatic effect
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(email);
      } else {
        alert(`Logged in as: ${email}`);
      }
    }, 1500);
  };

  return (
    <div className="lp-container">
      {/* Background Decorative Elements */}
      <div className="lp-bg-orb lp-orb-1"></div>
      <div className="lp-bg-orb lp-orb-2"></div>

      <div className="lp-card">
        {/* LEFT SIDE: Visuals */}
        <div className="lp-visual-side">
          <div className="lp-visual-content">
            <h2 className="lp-visual-title">Good Stocks</h2>
            <p className="lp-visual-subtitle">
              Real-time analytics for the modern trader.
            </p>
            
            {/* Abstract Finance/Stock Chart SVG */}
            <div className="lp-chart-container">
              <svg viewBox="0 0 200 100" className="lp-chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,80 C20,70 40,90 60,60 C80,30 100,50 120,40 C140,30 160,10 200,20 V100 H0 Z" 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d="M0,80 C20,70 40,90 60,60 C80,30 100,50 120,40 C140,30 160,10 200,20" 
                  fill="none" 
                  stroke="#818cf8" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                {/* Glowing Dots on peaks */}
                <circle cx="60" cy="60" r="3" fill="#fff" className="lp-chart-dot" />
                <circle cx="120" cy="40" r="3" fill="#fff" className="lp-chart-dot" style={{ animationDelay: '0.5s'}} />
                <circle cx="200" cy="20" r="3" fill="#fff" className="lp-chart-dot" style={{ animationDelay: '1s'}} />
              </svg>
            </div>
          </div>
          
          {/* Glass overlay on the image side */}
          <div className="lp-visual-overlay"></div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="lp-form-side">
          <div className="lp-logo-area">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#4f46e5"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#818cf8"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#6366f1"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#4338ca"/>
            </svg>
            {/* <span className="lp-logo-text">NEXUS</span> */}
          </div>

          <div className="lp-form-content">
            <h1 className="lp-title">Welcome To Good Stocks</h1>
            <p className="lp-subtitle">Enter your credentials to access your portfolio.</p>

            <form onSubmit={handleSubmit} className="lp-form">
              <div className="lp-input-group">
                <label htmlFor="email" className="lp-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className={`lp-input ${error ? 'lp-input-error' : ''}`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />
                {error && <span className="lp-error-msg">{error}</span>}
              </div>

              <button type="submit" className="lp-button" disabled={isLoading}>
                {isLoading ? <span className="lp-loader"></span> : 'Access Dashboard'}
              </button>
            </form>

            <div className="lp-footer">
              {/* <p>Protected </p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
