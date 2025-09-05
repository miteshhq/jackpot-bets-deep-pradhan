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

export const getDepositsReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [deposits] = await db.query(`
      SELECT 
        status,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM deposit_requests 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY status
    `, [from, to]);

        let approvedDeposits = 0;
        let pendingDeposits = 0;
        let rejectedDeposits = 0;
        let totalDepositRequests = 0;

        for (const deposit of deposits) {
            totalDepositRequests += deposit.count;
            switch (deposit.status) {
                case 'approved':
                    approvedDeposits = deposit.total_amount;
                    break;
                case 'pending':
                    pendingDeposits = deposit.total_amount;
                    break;
                case 'rejected':
                    rejectedDeposits = deposit.total_amount;
                    break;
            }
        }

        return res.json({
            approvedDeposits,
            pendingDeposits,
            rejectedDeposits,
            totalDeposits: approvedDeposits + pendingDeposits + rejectedDeposits,
            totalDepositRequests
        });
    } catch (err) {
        console.error("❌ Deposits report error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

export const getWithdrawalsReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [withdrawals] = await db.query(`
      SELECT 
        status,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM withdrawal_requests 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY status
    `, [from, to]);

        let completedWithdrawals = 0;
        let pendingWithdrawals = 0;
        let rejectedWithdrawals = 0;
        let totalWithdrawalRequests = 0;

        for (const withdrawal of withdrawals) {
            totalWithdrawalRequests += withdrawal.count;
            switch (withdrawal.status) {
                case 'completed':
                    completedWithdrawals = withdrawal.total_amount;
                    break;
                case 'pending':
                    pendingWithdrawals = withdrawal.total_amount;
                    break;
                case 'rejected':
                    rejectedWithdrawals = withdrawal.total_amount;
                    break;
            }
        }

        return res.json({
            completedWithdrawals,
            pendingWithdrawals,
            rejectedWithdrawals,
            totalWithdrawals: completedWithdrawals + pendingWithdrawals + rejectedWithdrawals,
            totalWithdrawalRequests
        });
    } catch (err) {
        console.error("❌ Withdrawals report error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

export const getDailyStatsReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [stats] = await db.query(`
      SELECT 
        DATE(placedAt) as date,
        COUNT(*) as total_bets,
        SUM(stake * 2) as total_volume,
        SUM(CASE WHEN status = 'won' THEN stake * 2 * 80 * COALESCE(bonus, 1) ELSE 0 END) as total_payouts,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as winning_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as losing_bets,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bets
      FROM bets 
      WHERE DATE(placedAt) BETWEEN ? AND ?
      GROUP BY DATE(placedAt)
      ORDER BY DATE(placedAt) DESC
    `, [from, to]);

        return res.json(stats);
    } catch (err) {
        console.error("❌ Daily stats error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

export const getProfitLossReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [profitLoss] = await db.query(`
      SELECT 
        SUM(stake * 2) as total_revenue,
        SUM(CASE WHEN status = 'won' THEN stake * 2 * 80 * COALESCE(bonus, 1) ELSE 0 END) as total_payouts,
        (SUM(stake * 2) - SUM(CASE WHEN status = 'won' THEN stake * 2 * 80 * COALESCE(bonus, 1) ELSE 0 END)) as net_profit
      FROM bets 
      WHERE DATE(placedAt) BETWEEN ? AND ?
    `, [from, to]);

        const data = profitLoss[0];
        const totalRevenue = parseFloat(data.total_revenue || 0);
        const totalPayouts = parseFloat(data.total_payouts || 0);
        const netProfit = parseFloat(data.net_profit || 0);
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

        return res.json({
            totalRevenue,
            totalPayouts,
            netProfit,
            profitMargin
        });
    } catch (err) {
        console.error("❌ Profit/Loss report error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

export const getUserStatsReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [userStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_bets,
        AVG(stake) as avg_bet_amount
      FROM bets 
      WHERE DATE(placedAt) BETWEEN ? AND ?
    `, [from, to]);

        const [newUsers] = await db.query(`
      SELECT COUNT(*) as new_users
      FROM users 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [from, to]);

        const [totalUsers] = await db.query(`
      SELECT COUNT(*) as total_users FROM users
    `);

        const activeUsers = userStats[0].active_users || 0;
        const totalBets = userStats[0].total_bets || 0;
        const avgBetPerUser = activeUsers > 0 ? (totalBets / activeUsers) : 0;

        return res.json({
            activeUsers,
            newUsers: newUsers[0].new_users || 0,
            totalUsers: totalUsers[0].total_users || 0,
            avgBetPerUser: parseFloat(userStats[0].avg_bet_amount || 0) * avgBetPerUser
        });
    } catch (err) {
        console.error("❌ User stats error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

export const getBetsSummaryReport = async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ msg: "From and To dates are required" });
    }

    try {
        const [summary] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'won' THEN 1 END) as winning_bets,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as losing_bets,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bets,
        SUM(CASE WHEN status = 'won' THEN stake * 2 * 80 * COALESCE(bonus, 1) ELSE 0 END) as total_payouts,
        COUNT(*) as total_bets
      FROM bets 
      WHERE DATE(placedAt) BETWEEN ? AND ?
    `, [from, to]);

        const data = summary[0];
        const winRate = data.total_bets > 0 ? ((data.winning_bets / data.total_bets) * 100) : 0;

        return res.json({
            winningBets: data.winning_bets || 0,
            losingBets: data.losing_bets || 0,
            pendingBets: data.pending_bets || 0,
            totalPayouts: data.total_payouts || 0,
            winRate
        });
    } catch (err) {
        console.error("❌ Bets summary error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};
