import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const generateLink = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const code = uuidv4();
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${FRONTEND_URL}/register?ref=${code}`;

    await db.query(
      "INSERT INTO referrals (user_id, code, created_at) VALUES (?, ?, NOW())",
      [userId, code]
    );

    res.json({ link });
  } catch (err) {
    console.error("Referral generation error:", err);
    res.status(500).json({ error: 'Server error' });
  }
};



