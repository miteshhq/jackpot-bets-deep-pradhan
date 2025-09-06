// backend/server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import moment from 'moment-timezone';   // ✅ Add this

import db from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import betRoutes from './routes/betRoutes.js';
import payoutRoutes from "./routes/payoutRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import referralRoutes from './routes/referralRoutes.js'; // ✅ सही फाइल नाम
import walletRoutes from './routes/walletRoutes.js';

import { initSocket } from './socket/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    req.kolkataTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    //   console.log("🕒 Kolkata Time:", req.kolkataTime);
    next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/bets', betRoutes);
app.use("/api/payout", payoutRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/referrals', referralRoutes); // ✅ सही रूट
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
    res.send(`Hello | Kolkata Time: ${req.kolkataTime}`);
});

// Start the server and WebSocket
(async () => {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL');

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

        initSocket(server); // 🧠 Start WebSocket & CRON here
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
        process.exit(1);
    }
})();