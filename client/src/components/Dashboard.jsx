


// client/src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Dashboard.jsx
 * - Portfolio Summary (totals + allocation chart + legend)
 * - Supported Stocks (left)
 * - My Subscribed Stocks (right)
 * - No Quick Actions (removed)
 * - Defensive rendering
 */

export default function Dashboard({ email, supportedTickers, onLogout }) {
  // socket & states
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [prices, setPrices] = useState({}); // ticker -> price (number)

  // Initialize socket & handlers
  useEffect(() => {
    const s = io("https://stock-g0zg.onrender.com", { transports: ["websocket"] });
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("Socket connected:", s.id);
      s.emit("registerUser", email);
    });

    s.on("init", ({ subscriptions: serverSubs = [], prices: initialPrices = {} }) => {
      setSubscriptions(Array.isArray(serverSubs) ? serverSubs : []);
      setPrices((prev) => ({ ...prev, ...initialPrices }));
    });

    s.on("priceUpdate", ({ prices: updatedPrices }) => {
      if (!updatedPrices || typeof updatedPrices !== "object") return;
      setPrices((prev) => ({ ...prev, ...updatedPrices }));
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    s.on("connect_error", (err) => console.error("Socket connect_error:", err));
    s.on("error", (err) => console.error("Socket error:", err));

    return () => {
      try { s.disconnect(); } catch (e) {}
      socketRef.current = null;
    };
  }, [email]);

  // helpers
  const isSubscribed = (ticker) => subscriptions.includes(ticker);

  const handleToggleSubscription = (ticker) => {
    const s = socketRef.current;
    if (!s) return;

    if (isSubscribed(ticker)) {
      s.emit("unsubscribe", { ticker });
      setSubscriptions((prev) => prev.filter((t) => t !== ticker));
    } else {
      s.emit("subscribe", { ticker });
      setSubscriptions((prev) => [...prev, ticker]);
    }
  };

  const handleSubscribeAll = () => {
    const s = socketRef.current;
    if (!s) return;
    supportedTickers.forEach((t) => s.emit("subscribe", { ticker: t }));
    setSubscriptions((prev) => Array.from(new Set([...prev, ...supportedTickers])));
  };

  const handleUnsubscribeAll = () => {
    const s = socketRef.current;
    if (!s) return;
    supportedTickers.forEach((t) => s.emit("unsubscribe", { ticker: t }));
    setSubscriptions([]);
  };

  const handleExportCSV = () => {
    const rows = [["Ticker", "Price"]];
    subscriptions.forEach((t) => rows.push([t, (prices[t] || "").toString()]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    onLogout();
  };

  // Portfolio calculations
  const totalValue = subscriptions.reduce((sum, t) => sum + (Number(prices[t]) || 0), 0);
  const sortedByPrice = [...subscriptions].sort((a, b) => (Number(prices[b]) || 0) - (Number(prices[a]) || 0));
  const topStock = sortedByPrice[0] || null;
  const lowestStock = sortedByPrice[sortedByPrice.length - 1] || null;
  const avgPrice = subscriptions.length ? (totalValue / subscriptions.length) : 0;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {email}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Subscribe to the stocks you want — prices update in real time.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Portfolio Summary (with AllocationChart inside) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Portfolio Summary</h3>
        <p className="muted small">Live overview of your subscribed stocks</p>

        {subscriptions.length === 0 ? (
          <p className="muted" style={{ marginTop: 10 }}>
            No subscribed stocks. Subscribe to any stock to build your portfolio.
          </p>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
            {/* LEFT: Totals & details */}
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 10 }}>
                ${totalValue.toFixed(2)}
              </div>

              <div className="divider" style={{ margin: "10px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div>
                  <div className="small muted">Subscribed Stocks</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>{subscriptions.length}</div>
                </div>

                <div>
                  <div className="small muted">Average Price</div>
                  <div style={{ fontWeight: 600 }}>${avgPrice.toFixed(2)}</div>
                </div>

                <div>
                  <div className="small muted">Highest Price</div>
                  <div style={{ fontWeight: 600 }}>
                    {topStock ? `${topStock} ($${(prices[topStock] || 0).toFixed(2)})` : "—"}
                  </div>
                </div>

                <div>
                  <div className="small muted">Lowest Price</div>
                  <div style={{ fontWeight: 600 }}>
                    {lowestStock ? `${lowestStock} ($${(prices[lowestStock] || 0).toFixed(2)})` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Allocation chart + legend */}
            <div style={{ paddingLeft: 8 }}>
              <AllocationChart subscriptions={subscriptions} prices={prices} />
            </div>
          </div>
        )}
      </div>

      {/* Main grid (Supported LEFT | Subscribed RIGHT) */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Supported Stocks (LEFT) */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Supported Stocks</h3>
          <p className="muted">Click subscribe/unsubscribe. Subscriptions persist by email.</p>

          <table className="table" aria-label="Supported stocks">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Ticker</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {supportedTickers.map((ticker) => (
                <tr key={ticker}>
                  <td>
                    <div className="ticker-cell">
                      <div>
                        <div className="ticker-symbol">{ticker}</div>
                        <div className="ticker-desc small muted">Symbol</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isSubscribed(ticker) ? (
                      <span className="tag tag-subscribed">Subscribed</span>
                    ) : (
                      <span className="tag tag-not-subscribed">Not Subscribed</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`btn small ${isSubscribed(ticker) ? "danger-btn" : "primary-btn"}`}
                      onClick={() => handleToggleSubscription(ticker)}
                    >
                      {isSubscribed(ticker) ? "Unsubscribe" : "Subscribe"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* My Subscribed Stocks (RIGHT) */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My Subscribed Stocks</h3>
          <p className="muted small">Only the stocks you subscribed to appear here with live prices.</p>

          {subscriptions.length === 0 ? (
            <div style={{ marginTop: 18 }}>
              <p className="muted">You are not subscribed to any stocks yet.</p>
              <p className="small muted">Subscribe from the left to see live pricing.</p>
            </div>
          ) : (
            <table className="table" aria-label="Subscribed stocks">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Ticker</th>
                  <th>Current Price (USD)</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((ticker) => (
                  <PriceRow key={ticker} ticker={ticker} price={prices[ticker]} />
                ))}
              </tbody>
            </table>
          )}

          <div className="divider" />
          <p className="small muted" style={{ margin: 0 }}>
            Prices are simulated on the server and update every second.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PriceRow (shows price with flash & up/down color) ---------------- */
function PriceRow({ ticker, price }) {
  const prevRef = useRef();
  const [flashKey, setFlashKey] = useState(0);
  const [dir, setDir] = useState(null);

  useEffect(() => {
    const prev = prevRef.current;

    if (prev === undefined && price !== undefined) {
      setDir(null);
    } else if (prev !== undefined && price !== undefined && prev !== price) {
      setDir(price > prev ? "up" : "down");
      setFlashKey((k) => k + 1);
      const t = setTimeout(() => setDir(null), 900);
      return () => clearTimeout(t);
    }

    prevRef.current = price;
  }, [price]);

  const flashClass = prevRef.current !== undefined && prevRef.current !== price ? "price-flash" : "";
  const dirClass = dir === "up" ? "price-up" : dir === "down" ? "price-down" : "";

  return (
    <tr>
      <td>
        <div className="ticker-cell">
          <div>
            <div className="ticker-symbol">{ticker}</div>
            <div className="ticker-desc small muted">Subscribed</div>
          </div>
        </div>
      </td>
      <td className="price-cell">
        {price !== undefined ? (
          <span key={flashKey} className={`price-value ${flashClass} ${dirClass}`}>
            ${Number(price).toFixed(2)}
          </span>
        ) : (
          <span className="muted">Waiting for update...</span>
        )}
      </td>
    </tr>
  );
}

function AllocationChart({ subscriptions = [], prices = {} }) {
  const data = subscriptions.map((t) => ({ name: t, value: Number(prices[t] || 0) }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const display = data.length ? data : [{ name: "None", value: 1 }];

  const COLORS = ["#2563eb", "#06b6d4", "#f97316", "#a78bfa", "#10b981"];

  // Custom label for slice (draw percent inside slice, white color)
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index
  }) => {
    const RAD = Math.PI / 180;
    // position label at middle radius between inner and outer
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RAD);
    const y = cy + radius * Math.sin(-midAngle * RAD);
    const txt = `${(percent * 100).toFixed(0)}%`;

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 700, pointerEvents: "none" }}
      >
        {txt}
      </text>
    );
  };

  // tweak sizes: larger chart
  const chartSize = 180;      // px (was ~140)
  const outerRadius = 80;     // larger outer radius
  const innerRadius = 40;     // donut hole

  return (
    <div style={{ width: "100%", paddingTop: 6, /* nudge left slightly */ marginLeft: -16 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "flex-start" }}>
        {/* Donut chart (bigger) */}
        <div style={{ width: chartSize, height: chartSize }}>
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={display}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                paddingAngle={4}
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {display.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend (right) — ONLY ticker name */}
        <div style={{ flex: 1 }}>
          {data.length === 0 ? (
            <div className="small muted">No allocation data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {data.map((item, idx) => {
                const color = COLORS[idx % COLORS.length];
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontWeight: 700,
                      fontSize: 15
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: color,
                        display: "inline-block"
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* total below chart */}
      <div style={{ marginTop: 12, textAlign: "center" }} className="small muted">
        Total: ${total ? total.toFixed(2) : "0.00"}
      </div>
    </div>
  );
}
