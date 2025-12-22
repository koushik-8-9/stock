

// client/src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard({ email, supportedTickers, onLogout }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
      if (!email) return;
      if (socketRef.current) return;
    // const s = io("https://stock-g0zg.onrender.com", { transports: ["websocket"] });
    const s = io("https://stock-g0zg.onrender.com", {transports: ["websocket"],withCredentials: true});

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => { s.emit("registerUser", email); });
    s.on("init", ({ subscriptions: serverSubs = [], prices: initialPrices = {} }) => {
      setSubscriptions(Array.isArray(serverSubs) ? serverSubs : []);
      setPrices((prev) => ({ ...prev, ...initialPrices }));
    });
    s.on("priceUpdate", ({ prices: updatedPrices }) => {
      if (!updatedPrices) return;
      setPrices((prev) => ({ ...prev, ...updatedPrices }));
    });

    return () => {
      try { s.disconnect(); } catch (e) {}
      socketRef.current = null;
    };
  }, [email]);





  const isSubscribed = (ticker) => subscriptions.includes(ticker);

  const handleToggleSubscription = (ticker) => {
    const s = socketRef.current;
    if (!s) return;
    // if (isSubscribed(ticker)) {
    //   s.emit("unsubscribe", { ticker });
    //   setSubscriptions((prev) => prev.filter((t) => t !== ticker));
    // } else {
    //   s.emit("subscribe", { ticker });
    //   setSubscriptions((prev) => [...prev, ticker]);
    // }
    if (isSubscribed(ticker)) {
  s.emit("unsubscribe", { ticker });
} else {
  s.emit("subscribe", { ticker });
}

  };

  
  const totalValue = subscriptions.reduce((sum, t) => sum + (Number(prices[t]) || 0), 0);
  const avgPrice = subscriptions.length ? (totalValue / subscriptions.length) : 0;
  
  const sortedPrices = subscriptions
      .map(t => ({ ticker: t, price: Number(prices[t]) || 0 }))
      .sort((a, b) => b.price - a.price);
  
  const topStock = sortedPrices[0];
  const lowestStock = sortedPrices[sortedPrices.length - 1];

  return (
    <div className="dashboard">
      {/* --- HEADER --- */}
      <div className="dashboard-header">
        <div>
          <h2 className="header-title">Welcome To Good Stocks</h2>
          <p className="header-subtitle">{email}</p>
        </div>
        
        <div className="header-right">
          <p className="small muted">Real-time Data Active</p>
          <button className="btn danger" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* --- PORTFOLIO SUMMARY --- */}
      <div className="card summary-card">
        <h3 className="card-title">Portfolio Summary</h3>
        <p className="muted small">Live overview of your subscribed stocks</p>

        {subscriptions.length === 0 ? (
          <p className="muted empty-state">No subscribed stocks yet. Add some below.</p>
        ) : (
          <div className="summary-grid">
            <div className="stats-col">
              <div className="total-value">${totalValue.toFixed(2)}</div>
              <div className="divider" />
              
              <div className="stats-grid">
                <div>
                  <div className="small muted">Subscribed</div>
                  <div className="stat-value">{subscriptions.length}</div>
                </div>
                <div>
                  <div className="small muted">Avg Price</div>
                  <div className="stat-value">${avgPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="small muted">Highest</div>
                  <div className="stat-value">
                     {topStock ? `${topStock.ticker} ($${topStock.price.toFixed(2)})` : "—"}
                  </div>
                </div>
                <div>
                  <div className="small muted">Lowest</div>
                  <div className="stat-value">
                     {lowestStock ? `${lowestStock.ticker} ($${lowestStock.price.toFixed(2)})` : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-col">
              <AllocationChart subscriptions={subscriptions} prices={prices} />
            </div>
          </div>
        )}
      </div>

      {/* --- MAIN GRID --- */}
      <div className="dashboard-grid">
        {/* Supported Stocks */}
        <div className="card">
          <h3 className="card-title">Supported Stocks</h3>
          <p className="muted small">Manage subscriptions</p>

          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supportedTickers.map((ticker) => (
                <tr key={ticker}>
                  <td><span className="ticker-symbol">{ticker}</span></td>
                  <td>
                    {isSubscribed(ticker) ? 
                      <span className="tag tag-subscribed">Active</span> : 
                      <span className="tag tag-not-subscribed">Inactive</span>
                    }
                  </td>
                  <td>
                    <button
                      className={`btn small ${isSubscribed(ticker) ? "danger" : "primary"}`}
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

        {/* My Watchlist */}
        <div className="card">
          <h3 className="card-title">My Watchlist</h3>
          <p className="muted small">Live updates</p>

          {subscriptions.length === 0 ? (
             <p className="muted empty-state">Subscribe to stocks to see prices.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((ticker) => (
                  <PriceRow key={ticker} ticker={ticker} price={prices[ticker]} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceRow({ ticker, price }) {
  const prevRef = useRef();
  const [dir, setDir] = useState(null);

  useEffect(() => {
    if (prevRef.current !== undefined && price !== undefined && prevRef.current !== price) {
      setDir(price > prevRef.current ? "up" : "down");
      const t = setTimeout(() => setDir(null), 1000);
      return () => clearTimeout(t);
    }
    prevRef.current = price;
  }, [price]);

  const dirClass = dir === "up" ? "price-up" : dir === "down" ? "price-down" : "";

  return (
    <tr>
      <td><span className="ticker-symbol">{ticker}</span></td>
      <td className="price-cell">
        {price !== undefined ? (
          <span className={`price-value ${dirClass}`}>
            ${Number(price).toFixed(2)}
          </span>
        ) : <span className="muted">...</span>}
      </td>
    </tr>
  );
}

function AllocationChart({ subscriptions, prices }) {
  const data = subscriptions.map((t) => ({ name: t, value: Number(prices[t] || 0) }));
  const COLORS = ["#6366f1", "#0ea5e9", "#f43f5e", "#8b5cf6", "#10b981"]; // Updated colors

  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center" }}>
      <ResponsiveContainer width={180} height="100%">
        <RePieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5}>
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            formatter={(val) => `$${Number(val).toFixed(2)}`} 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }}
          />
        </RePieChart>
      </ResponsiveContainer>
      <div style={{ marginLeft: 20 }}>
          {data.map((entry, idx) => (
             <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 6, fontSize: "0.85rem" }}>
                <span style={{ width: 10, height: 10, backgroundColor: COLORS[idx % COLORS.length], borderRadius: "50%", marginRight: 8 }}></span>
                <span style={{color: "#fff", fontWeight: 600}}>{entry.name}</span>
             </div>
          ))}
      </div>
    </div>
  );
}
