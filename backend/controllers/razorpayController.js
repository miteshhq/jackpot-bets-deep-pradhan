import Razorpay from 'razorpay';
import crypto from 'crypto';
import db from '../config/db.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// ✅ Create Razorpay order
export const createOrder = async (req, res) => {
  const { amount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: 'INR',
    });
    res.json(order);
  } catch (err) {
    console.error('❌ Razorpay order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// ✅ Verify and store payment + update balance
export const verifyPaymentAndUpdateBalance = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  try {
    // 💰 Update balance
    await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);

    // 🧾 Log transaction
    await db.query(
      `INSERT INTO transactions (user_id, amount, payment_id, order_id, status)
       VALUES (?, ?, ?, ?, 'success')`,
      [userId, amount, razorpay_payment_id, razorpay_order_id]
    );

    res.json({ message: "Balance updated & transaction logged successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating balance", error: err.message });
  }
};

// ✅ Fetch user balance
export const getUserBalance = async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: rows[0].balance });
  } catch (err) {
    console.error('Failed to fetch balance:', err);
    res.status(500).json({ message: 'Failed to fetch balance', error: err.message });
  }
};

// ✅ Fetch transaction history for user
export const getUserTransactions = async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching transactions for user:', userId);
  try {
    const [rows] = await db.query(
      `SELECT amount, payment_id, order_id, status, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    console.log('Transactions fetched:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch transactions:', err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// ✅ Fetch all transactions (admin)
export const getAllTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT amount, payment_id, order_id, status, created_at, user_id
       FROM transactions ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch all transactions:', err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// ✅ Get total transaction amount
export const getTotalTransactions = async (req, res) => {
  console.log('✅ /transactions/total route hit');
  try {
    const [rows] = await db.query('SELECT SUM(amount) AS totalAmount FROM transactions');
    console.log('Fetched total transaction amount:', rows);
    const totalAmount = rows[0]?.totalAmount || 0;
    res.json({ totalAmount });
  } catch (error) {
    console.error('❌ Error getting total transactions:', error.message);
    res.status(500).json({ message: 'Failed to fetch total transactions' });
  }
};
