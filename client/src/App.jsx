// App.jsx
import React, { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Dashboard from "./components/Dashboard.jsx";

/**
 * App.jsx
 * - Acts ONLY as a switch between Login and Dashboard.
 * - Removed all HTML wrappers (divs/headers) to prevent layout conflicts.
 */

const SUPPORTED_TICKERS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // 1. If NOT logged in, show the Login Page directly.
  // We removed the <div className="card center"> wrapper so the login page
  // can expand to fill the screen as designed.
  if (!currentUserEmail) {
    return (
      <LoginPage onLoginSuccess={(email) => setCurrentUserEmail(email)} />
    );
  }

  // 2. If logged in, show the Dashboard directly.
  // We removed the header/pill here because Dashboard.jsx now has its own header.
  return (
    <Dashboard
      email={currentUserEmail}
      supportedTickers={SUPPORTED_TICKERS}
      onLogout={() => setCurrentUserEmail(null)}
    />
  );
}
