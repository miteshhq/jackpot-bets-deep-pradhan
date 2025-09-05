import db from "../config/db.js";
import Razorpay from "razorpay";

// Initialize Razorpay (simulated for now)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// ✅ USER - Request a payout
export const requestPayout = async (req, res) => {
    const { userId, bankName, accountNumber, ifscCode, amount } = req.body;

    if (!userId || !bankName || !accountNumber || !ifscCode || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "All fields are required with a valid amount" });
    }

    try {
        const [userResult] = await db.query("SELECT balance FROM users WHERE id = ?", [userId]);
        if (!userResult.length) return res.status(404).json({ error: "User not found" });

        const userBalance = userResult[0].balance;
        if (userBalance < amount) return res.status(400).json({ error: "Insufficient balance" });

        await db.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId]);

        await db.query(
            `INSERT INTO withdrawals (user_id, bank_name, bank_account_number, ifsc_code, amount, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, bankName, accountNumber, ifscCode, amount]
        );

        res.json({ message: "Withdrawal request submitted successfully" });
    } catch (err) {
        console.error("❌ Payout error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ ADMIN - Get all payout requests
export const getPayoutRequests = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        w.id, w.user_id, u.phone, 
        w.bank_name, w.bank_account_number, w.ifsc_code, 
        w.amount, w.status, w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error("❌ Error fetching payout requests:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ ADMIN - Approve payout
export const approvePayout = async (req, res) => {
    const { id } = req.body;
    try {
        await db.query("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [id]);
        res.json({ message: "Payout approved successfully" });
    } catch (err) {
        console.error("❌ Approve payout error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ ADMIN - Reject payout
export const rejectPayout = async (req, res) => {
    const { id } = req.body;
    try {
        const [[withdrawal]] = await db.query("SELECT * FROM withdrawals WHERE id = ?", [id]);
        if (!withdrawal) return res.status(404).json({ error: "Payout not found" });

        await db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [withdrawal.amount, withdrawal.user_id]);
        await db.query("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [id]);

        res.json({ message: "Payout rejected and amount refunded" });
    } catch (err) {
        console.error("❌ Reject payout error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ ADMIN - Mark payout as paid (simulated Razorpay)
export const payPayout = async (req, res) => {
    const { id } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Valid withdrawal ID is required" });
    }

    try {
        const [[withdrawal]] = await db.query("SELECT * FROM withdrawals WHERE id = ?", [id]);

        if (!withdrawal) {
            return res.status(404).json({ error: "Withdrawal not found" });
        }

        console.log("✅ Withdrawal found:", withdrawal);

        if (!withdrawal.bank_name || !withdrawal.bank_account_number || !withdrawal.ifsc_code) {
            console.error("❌ Missing bank details in withdrawal record", withdrawal);
            return res.status(500).json({ error: "Bank details missing from withdrawal record" });
        }

        const payment_id = "pay_" + Date.now();
        const order_id = "order_" + Date.now();

        await db.query("UPDATE withdrawals SET status = 'paid' WHERE id = ?", [id]);

        await db.query(
            `INSERT INTO transactions 
      (user_id, withdrawal_id, amount, bank_name, bank_account_number, ifsc_code, payment_id, order_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
            [
                withdrawal.user_id,
                id,
                withdrawal.amount,
                withdrawal.bank_name,
                withdrawal.bank_account_number,
                withdrawal.ifsc_code,
                payment_id,
                order_id,
            ]
        );

        res.json({ message: "Payout marked as paid & transaction recorded" });
    } catch (err) {
        console.error("❌ Payout send error:", err);
        res.status(500).json({ error: "Failed to send payout" });
    }
};



// ✅ ADMIN - Get only approved payouts
export const getApprovedPayouts = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        w.id, w.user_id, u.phone, 
        w.amount, w.bank_name, w.bank_account_number, 
        w.ifsc_code, w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'approved'
      ORDER BY w.created_at DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error("❌ Error fetching approved payouts:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ ADMIN - General status update (approve/reject with validation)
export const updatePayoutStatus = async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ error: "ID and status are required" });
    }

    try {
        const [[withdrawal]] = await db.query("SELECT * FROM withdrawals WHERE id = ?", [id]);

        if (!withdrawal) {
            return res.status(404).json({ error: "Withdrawal not found" });
        }

        console.log("✅ Withdrawal found:", withdrawal);  // 🔍 Debug log

        if (!withdrawal) return res.status(404).json({ error: "Payout not found" });

        if (withdrawal.status !== "pending") {
            return res.status(400).json({ error: `Payout already ${withdrawal.status}, cannot change status` });
        }

        if (status === "approved") {
            await db.query("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [id]);

            console.log(`💰 Sending 💎${withdrawal.amount} to ${withdrawal.bank_name} - ${withdrawal.bank_account_number}`);
            return res.json({ message: "Payout approved & money sent" });

        } else if (status === "rejected") {
            await db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [
                withdrawal.amount,
                withdrawal.user_id,
            ]);
            await db.query("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [id]);

            return res.json({ message: "Payout rejected & balance refunded" });
        } else {
            return res.status(400).json({ error: "Invalid status" });
        }
    } catch (err) {
        console.error("❌ Update payout status error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

