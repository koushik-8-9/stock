// // server/index.js
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const { Server } = require("socket.io");

// const app = express();
// const PORT = 4000;

// app.use(cors({
//   origin: "http://localhost:5173",
//   methods: ["GET", "POST"],
//   credentials: true
// }));
// app.use(express.json());

// // --- Supported tickers ---
// const SUPPORTED_TICKERS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

// // --- In-memory price store ---
// const stockPrices = {};

// // --- In-memory client and user stores ---
// // clients: socketId -> { email, subscriptions: Set }
// const clients = {};

// // userSubscriptions: email -> Set of tickers (persisted across socket reconnects)
// const userSubscriptions = {}; // KEY CHANGE: persistent mapping by email

// // --- Helpers ---
// function getRandomInitialPrice() {
//   const price = 100 + Math.random() * 900;
//   return parseFloat(price.toFixed(2));
// }
// function mutatePrice(currentPrice) {
//   const delta = (Math.random() - 0.5) * 10;
//   const newPrice = Math.max(10, currentPrice + delta);
//   return parseFloat(newPrice.toFixed(2));
// }

// // Initialize prices
// SUPPORTED_TICKERS.forEach(t => {
//   stockPrices[t] = getRandomInitialPrice();
// });

// // --- Mock login endpoint ---
// app.post("/api/login", (req, res) => {
//   const { email } = req.body;
//   if (!email || typeof email !== "string") {
//     return res.status(400).json({ success: false, message: "Email is required" });
//   }
//   // Ensure userSubscriptions entry exists so it persists even when no socket connected
//   if (!userSubscriptions[email]) {
//     userSubscriptions[email] = new Set();
//   }
//   console.log(`Login request for email: ${email}`);
//   res.json({ success: true, email });
// });

// // --- Start server + socket.io ---
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   socket.on("registerUser", (email) => {
//     console.log(`Socket ${socket.id} registering email: ${email}`);

//     // Ensure the global userSubscriptions entry exists
//     if (!userSubscriptions[email]) {
//       userSubscriptions[email] = new Set();
//     }

//     // Attach this socket to clients map
//     const subscriptionsFromUser = new Set([...userSubscriptions[email]]); // copy
//     clients[socket.id] = {
//       email,
//       subscriptions: subscriptionsFromUser
//     };

//     // Send initial data to client: its subscriptions + current prices for those tickers
//     const subscribedTickersArray = Array.from(subscriptionsFromUser);
//     const initialPrices = {};
//     subscribedTickersArray.forEach(t => {
//       if (stockPrices[t] !== undefined) initialPrices[t] = stockPrices[t];
//     });

//     socket.emit("init", {
//       subscriptions: subscribedTickersArray,
//       prices: initialPrices
//     });

//     console.log(`Initialized socket ${socket.id} with subscriptions:`, subscribedTickersArray);
//   });

//   socket.on("subscribe", ({ ticker }) => {
//     const client = clients[socket.id];
//     if (!client) return;

//     if (!SUPPORTED_TICKERS.includes(ticker)) return;

//     // Update socket's subscriptions
//     client.subscriptions.add(ticker);

//     // Update global userSubscriptions (persist)
//     const email = client.email;
//     if (!userSubscriptions[email]) userSubscriptions[email] = new Set();
//     userSubscriptions[email].add(ticker);

//     console.log(`User ${email} subscribed to ${ticker}`);
//     // Optionally send the immediate price for this ticker to the client
//     socket.emit("priceUpdate", { prices: { [ticker]: stockPrices[ticker] } });
//   });

//   socket.on("unsubscribe", ({ ticker }) => {
//     const client = clients[socket.id];
//     if (!client) return;

//     if (!client.subscriptions.has(ticker)) return;

//     // Remove from socket subscriptions
//     client.subscriptions.delete(ticker);

//     // Remove from global userSubscriptions (persist)
//     const email = client.email;
//     if (userSubscriptions[email]) {
//       userSubscriptions[email].delete(ticker);
//     }

//     console.log(`User ${client.email} unsubscribed from ${ticker}`);
//   });

//   socket.on("disconnect", () => {
//     const client = clients[socket.id];
//     if (client) {
//       console.log(`Client disconnected: ${socket.id}, email: ${client.email}`);
//       // Do NOT delete userSubscriptions — we want to persist the user's subscriptions by email
//       delete clients[socket.id];
//     } else {
//       console.log(`Client disconnected: ${socket.id}`);
//     }
//   });
// });

// // --- Price update broadcast (every second) ---
// setInterval(() => {
//   // mutate prices
//   SUPPORTED_TICKERS.forEach((ticker) => {
//     stockPrices[ticker] = mutatePrice(stockPrices[ticker]);
//   });

//   // For each connected client, send only the tickers they're subscribed to
//   Object.entries(clients).forEach(([socketId, client]) => {
//     const pricesForClient = {};
//     client.subscriptions.forEach((ticker) => {
//       pricesForClient[ticker] = stockPrices[ticker];
//     });

//     if (Object.keys(pricesForClient).length > 0) {
//       io.to(socketId).emit("priceUpdate", { prices: pricesForClient });
//     }
//   });
// }, 1000);

// server.listen(PORT, () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
// });


const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const Brevo = require("@getbrevo/brevo");

const app = express();
const PORT = process.env.PORT || 4000; // ✅ FIX 1

/* ---------------- CORS ---------------- */
const allowedOrigins = [
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

/* ---------------- DATA ---------------- */
const SUPPORTED_TICKERS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];
const stockPrices = {};
const clients = {};              // socketId -> { email, subscriptions }
const userSubscriptions = {};    // email -> Set
const otpStore = {}; // email -> { otp, expiresAt }

/* ---------------- HELPERS ---------------- */
function getRandomInitialPrice() {
  return +(100 + Math.random() * 900).toFixed(2);
}

function mutatePrice(price) {
  return +(Math.max(10, price + (Math.random() - 0.5) * 10)).toFixed(2);
}

// Init prices
SUPPORTED_TICKERS.forEach(t => stockPrices[t] = getRandomInitialPrice());

/* ---------------- LOGIN ---------------- */
app.post("/api/login", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false });

  if (!userSubscriptions[email]) userSubscriptions[email] = new Set();
  res.json({ success: true, email });
});

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP (in-memory for now)
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    // Initialize Brevo API
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // Send OTP email
    await apiInstance.sendTransacEmail({
      sender: {
        name: "Good Stocks",
        email: process.env.SENDER_EMAIL
      },
      to: [{ email }],
      subject: "Your OTP for Good Stocks Login",
      htmlContent: `
        <p>Hello,</p>

        <p>We received a request to sign in to your Good Stocks account.</p>

        <p>Your One-Time Password (OTP) is:</p>

        <h2><strong>${otp}</strong></h2>

        <p>
          This OTP is valid for the next <strong>5 minutes</strong>.<br/>
          Please do not share this code with anyone for security reasons.
        </p>

        <p>
          If you did not request this login, please ignore this email.
        </p>

        <p>
          Best regards,<br/>
          <strong>Good Stocks Team</strong>
        </p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("BREVO ERROR:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});


app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ success: false });

  if (Date.now() > record.expiresAt)
    return res.status(400).json({ success: false, message: "OTP expired" });

  if (record.otp !== otp)
    return res.status(400).json({ success: false, message: "Invalid OTP" });

  delete otpStore[email];
  res.json({ success: true });
});


/* ---------------- SOCKET ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  },
  transports: ["websocket"] // ✅ FIX 3
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("registerUser", (email) => {
    if (!userSubscriptions[email]) userSubscriptions[email] = new Set();

    clients[socket.id] = {
      email,
      subscriptions: new Set([...userSubscriptions[email]])
    };

    const prices = {};
    clients[socket.id].subscriptions.forEach(t => {
      prices[t] = stockPrices[t];
    });

    socket.emit("init", {
      subscriptions: [...clients[socket.id].subscriptions],
      prices
    });
  });

  // socket.on("subscribe", ({ ticker }) => {
  //   const client = clients[socket.id];
  //   if (!client || !SUPPORTED_TICKERS.includes(ticker)) return;

  //   client.subscriptions.add(ticker);
  //   userSubscriptions[client.email].add(ticker);

  //   socket.emit("priceUpdate", {
  //     prices: { [ticker]: stockPrices[ticker] }
  //   });
  // });

  // socket.on("unsubscribe", ({ ticker }) => {
  //   const client = clients[socket.id];
  //   if (!client) return;

  //   client.subscriptions.delete(ticker);
  //   userSubscriptions[client.email]?.delete(ticker);
  // });

  socket.on("subscribe", ({ ticker }) => {
  const client = clients[socket.id];
  if (!client || !SUPPORTED_TICKERS.includes(ticker)) return;

  client.subscriptions.add(ticker);
  userSubscriptions[client.email].add(ticker);

  socket.emit("subscribed", { ticker });
  socket.emit("priceUpdate", { prices: { [ticker]: stockPrices[ticker] } });
});

socket.on("unsubscribe", ({ ticker }) => {
  const client = clients[socket.id];
  if (!client) return;

  client.subscriptions.delete(ticker);
  userSubscriptions[client.email]?.delete(ticker);

  socket.emit("unsubscribed", { ticker });
});


  socket.on("disconnect", () => {
    delete clients[socket.id];
    console.log("Disconnected:", socket.id);
  });
});

/* ---------------- PRICE STREAM ---------------- */
setInterval(() => {
  SUPPORTED_TICKERS.forEach(t => {
    stockPrices[t] = mutatePrice(stockPrices[t]);
  });

  Object.entries(clients).forEach(([id, client]) => {
    const prices = {};
    client.subscriptions.forEach(t => prices[t] = stockPrices[t]);
    if (Object.keys(prices).length) {
      io.to(id).emit("priceUpdate", { prices });
    }
  });
}, 1000);

/* ---------------- START ---------------- */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
