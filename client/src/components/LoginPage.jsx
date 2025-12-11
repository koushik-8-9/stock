

import React, { useEffect, useState } from "react";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const last = localStorage.getItem("sb_last_email");
    if (last) setEmail(last);
  }, []);

  function validateEmail(v) {
    return /\S+@\S+\.\S+/.test(String(v).trim());
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = String(email || "").trim();

    if (!validateEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("sb_last_email", trimmed);
    onLoginSuccess(trimmed);
  }

  function handleClear() {
    setEmail("");
    setError("");
    localStorage.removeItem("sb_last_email");
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* LEFT SIDE: IMAGE + TEXT */}
        <div className="login-left">
          <img
            src="/images/hero-dark.png"
            alt="Stock chart"
            className="login-hero-img"
          />

          <h3 className="login-left-title">Real-time market demo</h3>
          {/* <p className="muted">
            Simulated live prices — fast, simple and secure.  
            Log in with an email to continue.
          </p> */}
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="login-right">
          <h2>Welcome</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Enter your email to continue.
          </p>

          <form onSubmit={handleSubmit} className="form">
            <label className="form-label">
              Email
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {error && (
              <div style={{ color: "var(--danger)", fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div className="actions-row" style={{ marginTop: 12 }}>
              <button type="submit" className="btn primary">Login</button>
              <button type="button" className="btn ghost" onClick={handleClear}>
                Clear
              </button>
            </div>
          </form>

          <div style={{ marginTop: 18 }} className="small muted">
            Your subscriptions are saved locally by email for this demo.
          </div>
        </div>

      </div>
    </div>
  );
}
