# 📈 Stock Broker Client Web Dashboard

A real-time stock subscription dashboard developed assignment.  
Users can log in using email, subscribe to stocks, and view live-updating simulated prices without page refresh.

---

## 🚀 Features
- Mock email-only login (no password)
- Supported stocks: GOOG, TSLA, AMZN, META, NVDA
- Subscribe / Unsubscribe to stocks
- Real-time price updates using WebSockets
- Multi-user support (independent subscriptions)
- Portfolio summary with live prices and allocation chart
- Clean, professional UI

---

## 🛠 Tech Stack

**Frontend**
- React + Vite
- Socket.IO Client
- Normal CSS


**Backend**
- Node.js
- Express.js
- Socket.IO
- In-memory storage

---
```
STOCK-BROKER-DASHBOARD/
│
├── client/                     # Frontend (React + Vite)
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Images, icons
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── LoginPage.css
│   │   ├── App.jsx             # Root React component
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── styles.css          # Global styling
│   │   └── main.jsx            # React entry point
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── .gitignore
│
├── server/                     # Backend (Node.js + Express)
│   ├── node_modules/
│   ├── index.js                # Server entry point
│   ├── package.json
│   └── package-lock.json
│
├── README.md                   # Project documentation
└── .gitignore
```

## ▶️ Run Locally

**Backend**
```bash
cd server
npm install
node index.js
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

## Hosted in Vercel(Frontend) And Render(Backend)
Link : https://stock-zeta-sooty.vercel.app

---
## 🧪 Multi-User Testing
1. Open the app in two browsers.
2. Log in with different emails.
3. Subscribe to different stocks.
4. Observe live updates without refresh.

---

## 📌 Notes
- Deployed in Vercel(frontend) and Render(backend)
- Prices are simulated and user is requested to wait 30 sec(after logging in) before subscribing for stocks because of vendors we used and those are free versions so takes time to load prices.
- Data stored in memory only.
- Designed for demo.

---

## 👤 Author
K Koushik Kumar Reddy

Computer Science and Engineering.
