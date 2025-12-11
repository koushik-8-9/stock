import React, { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Dashboard from "./components/Dashboard.jsx";

/**
 * App.jsx
 * Root application. Shows a branded header and either the LoginPage or Dashboard.
 * - Keeps currentUserEmail in state (simple mock login).
 */

const SUPPORTED_TICKERS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  return (
    <div className="app-container">
      {/* Top header / brand */}
      <div
        className={`app-title ${!currentUserEmail ? "center-header" : ""}`}
        role="banner"
      >
        <div className="brand">
          <div className="logo" aria-hidden>
            SB
          </div>
          <div>
            <h1>Stock Broker Dashboard</h1>
            <p className="small muted">Real-time demo — simulated prices</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Show user pill ONLY when logged in */}
          {currentUserEmail && (
            <div className="user-pill">{currentUserEmail}</div>
          )}
        </div>
      </div>

      {/* Main content */}
      {!currentUserEmail ? (
        <div className="card center">
          <LoginPage onLoginSuccess={(email) => setCurrentUserEmail(email)} />
        </div>
      ) : (
        <Dashboard
          email={currentUserEmail}
          supportedTickers={SUPPORTED_TICKERS}
          onLogout={() => setCurrentUserEmail(null)}
        />
      )}
    </div>
  );
}

