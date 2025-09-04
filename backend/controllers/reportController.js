// 📁 controllers/reportController.js
import db from '../config/db.js';

export const getSalesReport = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ msg: "❌ From and To dates are required" });
  }

  try {
    const [bets] = await db.query(
      `SELECT status, stake FROM bets WHERE DATE(placedAt) BETWEEN ? AND ?`,
      [from, to]
    );

    let totalBets = 0;
    let cancelledBets = 0;
    let totalStake = 0;

    for (const bet of bets) {
      totalBets += 1;

      if (bet.status === "cancelled") {
        cancelledBets += 1;
      } else {
        const stakeNum = parseFloat(bet.stake);
        if (!isNaN(stakeNum)) {
          totalStake += stakeNum;
        }
      }
    }

    return res.json({
      total_bets: totalBets,
      cancelled_bets: cancelledBets,
      total_sell_amount: totalStake.toFixed(2),
    });
  } catch (err) {
    console.error("❌ Report fetch error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getTotalWithdrawals = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT SUM(amount) AS totalWithdrawn FROM withdrawals WHERE status = 'approved'`
    );
    const totalWithdrawn = rows[0]?.totalWithdrawn || 0;
    res.json({ totalWithdrawn });
  } catch (error) {
    console.error('❌ Error getting total withdrawals:', error.message);
    res.status(500).json({ message: 'Failed to fetch total withdrawals' });
  }
};

export const cancelBet = async (req, res) => {
  const { betId } = req.params;
  const now = Date.now();
  const ROUND_DURATION = 5 * 60 * 1000;
  const [bet] = await db.query(`SELECT * FROM bets WHERE id = ?`, [betId]);
  if (!bet[0]) return res.status(404).json({ msg: 'Not found' });
  const placed = new Date(bet[0].createdAt).getTime();
  if (now - placed > ROUND_DURATION - 30 * 1000) {
    return res.status(403).json({ msg: '🚫 Too late to cancel' });
  }
  if (bet[0].status !== 'pending') {
    return res.status(400).json({ msg: 'Already processed' });
  }
  await db.query('UPDATE bets SET status="cancelled" WHERE id=?', [betId]);
  await db.query('UPDATE users SET balance=balance+? WHERE id=?', [bet[0].stake*2, bet[0].user_id]);
  res.json({ msg: '✅ Cancelled' });
};


export const getCancelledAmount = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ msg: 'Missing from or to date' });
  }

  try {
    const query = `
      SELECT IFNULL(SUM(stake * 2), 0) AS totalCancelledAmount 
      FROM bets 
      WHERE status = 'cancelled' AND createdAt BETWEEN ? AND ?
    `;

    const [rows] = await db.query(query, [from + ' 00:00:00', to + ' 23:59:59']);

    res.json({ totalCancelledAmount: rows[0].totalCancelledAmount });
  } catch (err) {
    console.error('Error fetching cancelled amount:', err);
    res.status(500).json({ msg: 'Internal server error' });
  }
};




