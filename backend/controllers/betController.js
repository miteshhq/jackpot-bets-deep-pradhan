import db from '../config/db.js';

const getCurrentRoundTime = () => {
  const now = new Date();
  const minutesRounded = Math.floor(now.getMinutes() / 5) * 5;
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = minutesRounded.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// ✅ Place a bet
export const placeBet = async (req, res) => {
  try {
    const { userId, number, stake, barcode } = req.body;
    const amount = parseFloat(stake);

    if (!userId || number == null || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: '❌ Invalid bet data' });
    }

    if (!barcode || barcode.length !== 7) {
      return res.status(400).json({ msg: '❌ Invalid or missing barcode' });
    }

    const now = Date.now();
    const ROUND_DURATION = 5 * 60 * 1000; // 5 minutes
    const roundEnd = now + ROUND_DURATION - (now % ROUND_DURATION);
    const secondsLeft = Math.floor((roundEnd - now) / 1000);
    if (secondsLeft <= 15) {
      return res.status(403).json({ msg: '⏳ Bet not allowed in last 15 seconds of the round' });
    }

    const [[user]] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!user || user.balance < amount * 2) {
      return res.status(400).json({ msg: '❌ Insufficient balance' });
    }

    // Deduct double the stake from user balance (stake * 2)
    await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount * 2, userId]);

    const roundTime = getCurrentRoundTime();

    await db.query(
      'INSERT INTO bets (user_id, number, stake, roundTime, barcode, status, placedAt) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
      [userId, number, amount, roundTime, barcode]
    );

    const [[updated]] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);

    return res.json({
      msg: '✅ Bet placed successfully',
      balance: updated.balance,
    });
  } catch (err) {
    console.error('❌ Error placing bet:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ Declare result
// ✅ Declare result
export const declareResult = async (req, res) => {
  try {
    const { result } = req.body;
    const roundTime = getCurrentRoundTime();

    if (result == null || isNaN(result)) {
      return res.status(400).json({ msg: '❌ Invalid result' });
    }

    // Save result in DB
    await db.query('INSERT INTO results (`time`, `number`) VALUES (?, ?)', [roundTime, result]);

    // Get all pending bets of this round
    const [pendingBets] = await db.query(
      'SELECT id, user_id, stake, number FROM bets WHERE roundTime = ? AND status = "pending"',
      [roundTime]
    );

    for (const bet of pendingBets) {
      let winnings = 0;
      let status = 'lost';

      if (parseInt(bet.number) === parseInt(result)) {
        // ✅ पहले: winnings = stake * 80
        // ✅ अब: winnings = (stake * 2) * 80  (क्योंकि amount = stake * 2)
        const amount = bet.stake * 2;
        winnings = amount * 80;
        status = 'won';

        // Add winnings to user balance
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [winnings, bet.user_id]);
      }

      // Update bet status
      await db.query('UPDATE bets SET status = ? WHERE id = ?', [status, bet.id]);
    }

    return res.json({ msg: '✅ Result declared and bets processed' });
  } catch (err) {
    console.error('❌ Error declaring result:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};


// ✅ Get all bets (admin)

export const getAllBets = async (req, res) => {
  try {
    const [bets] = await db.query(`
      SELECT id, number, stake, stake * 2 AS amount, roundTime, status, barcode, placedAt
      FROM bets
      ORDER BY placedAt DESC
    `);

    return res.json(bets);
  } catch (err) {
    console.error('❌ Error fetching bets:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ Get bets by user ID
export const getBetsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [bets] = await db.query(
      `SELECT id, number, stake, roundTime, status, barcode, placedAt 
       FROM bets WHERE user_id = ? ORDER BY placedAt DESC`,
      [userId]
    );
    res.status(200).json(bets);
  } catch (error) {
    console.error('❌ Error fetching bets by user:', error);
    res.status(500).json({ msg: 'Error fetching user bets' });
  }
};

// ✅ Get bets by barcode
export const getBetsByBarcode = async (req, res) => {
  const { barcode } = req.params;

  if (!barcode || barcode.length !== 7) {
    return res.status(400).json({ msg: '❌ Invalid barcode' });
  }

  try {
    const [bets] = await db.query(
      `SELECT id, number, stake, roundTime AS drawTime, status, barcode, 
              stake / 2 AS qty, stake AS amount,
              CASE WHEN status = 'won' THEN stake * 80 ELSE 0 END AS winAmount 
       FROM bets 
       WHERE barcode = ?
       ORDER BY placedAt DESC`,
      [barcode]
    );

    if (bets.length === 0) {
      return res.status(404).json({ msg: '❌ No bets found for this barcode' });
    }

    res.status(200).json(bets);
  } catch (error) {
    console.error('❌ Error fetching bets by barcode:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
// ✅ Get current round bets summary (for admin result view)
export const getBetsSummary = async (req, res) => {
  try {
    const roundTime = getCurrentRoundTime();

    const [rows] = await db.query(`
      SELECT number, SUM(stake) AS totalStake
      FROM bets
      WHERE roundTime = ? AND status = 'pending'
      GROUP BY number
    `, [roundTime]);

    const summary = {};
    for (let i = 0; i < 100; i++) {
      summary[i] = 0;
    }

    for (const row of rows) {
      summary[row.number] = parseFloat(row.totalStake);
    }

    res.json(summary);
  } catch (err) {
    console.error('❌ Error fetching bets summary:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


export const getDailyProfitLoss = async (req, res) => {
  try {
    // Har din ki total stakes
    const [stakes] = await db.query(`
      SELECT DATE(placedAt) AS date, SUM(stake * 2) AS totalStake
      FROM bets
      GROUP BY DATE(placedAt)
      ORDER BY DATE(placedAt) DESC
      LIMIT 30
    `);

    // Har din ki total payout (jitne amount diye)
    const [payouts] = await db.query(`
      SELECT DATE(placedAt) AS date, SUM(stake * 2 * 80) AS totalPayout
      FROM bets
      WHERE status = 'won'
      GROUP BY DATE(placedAt)
      ORDER BY DATE(placedAt) DESC
      LIMIT 30
    `);

    // Dono ko date ke hisaab se merge karte hain
    const resultMap = {};

    stakes.forEach(row => {
      resultMap[row.date] = {
        date: row.date,
        totalStake: row.totalStake,
        totalPayout: 0,
      };
    });

    payouts.forEach(row => {
      if (resultMap[row.date]) {
        resultMap[row.date].totalPayout = row.totalPayout;
      } else {
        resultMap[row.date] = {
          date: row.date,
          totalStake: 0,
          totalPayout: row.totalPayout,
        };
      }
    });

    // Object ko array mein convert karo aur date descending sort karo
    const dailyProfitLoss = Object.values(resultMap).sort((a, b) => (a.date < b.date ? 1 : -1));

    res.json(dailyProfitLoss);
  } catch (error) {
    console.error('Error fetching daily profit/loss:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};


// export const getRoundBetsSummary = async (req, res) => {
//   try {
//     const { roundTime } = req.params;

//     if (!roundTime || !/^\d{2}:\d{2}$/.test(roundTime)) {
//       return res.status(400).json({ msg: '❌ Invalid roundTime format (expected HH:MM)' });
//     }

//     const [rows] = await db.query(`
//       SELECT number, SUM(stake) AS totalStake
//       FROM bets
//       WHERE roundTime = ?
//       GROUP BY number
//     `, [roundTime]);

//     // Create 0-filled summary for numbers 0-99
//     const summary = {};
//     for (let i = 0; i < 100; i++) {
//       summary[i] = 0;
//     }

//     for (const row of rows) {
//       summary[row.number] = parseFloat(row.totalStake);
//     }

//     res.json({ roundTime, summary });
//   } catch (err) {
//     console.error('❌ Error fetching round bets summary:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };


// export const getBetsHistory = async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         roundTime,
//         SUM(stake) AS totalStake,
//         MAX(CASE WHEN status = 'won' THEN number END) AS resultNumber
//       FROM bets
//       GROUP BY roundTime
//       ORDER BY MAX(createdAt) DESC
//       LIMIT 10
//     `);

//     const formatted = rows.map(r => ({
//       roundTime: r.roundTime,
//       totalStake: parseFloat(r.totalStake),
//       result: r.resultNumber || "No Winner"
//     }));

//     res.json(formatted);
//   } catch (err) {
//     console.error("❌ Error fetching round summaries:", err);
//     res.status(500).json({ error: "Failed to fetch round summaries" });
//   }
// };


export const getBetsHistory = async (req, res) => {
  try {
    // Query to get total stake per round for the last 10 rounds
    const [rows] = await db.query(`
     SELECT DATE(createdAt) AS roundDate, roundTime, SUM(stake) AS total_stake
      FROM bets
      GROUP BY roundDate, roundTime
      ORDER BY MAX(placedAt) DESC
      LIMIT 10;
    `);

    // Calculate the sum of all stakes for the last 10 rounds
    const overallTotalStake = rows.reduce(
      (acc, row) => acc + parseFloat(row.total_stake || 0),
      0
    );

    // Format the response
    const formatted = rows.map(r => ({
      roundTime: r.roundTime,
      totalStake: parseFloat(r.total_stake || 0)
    }));

    // Return both the per-round total stakes and the overall total stake
    res.json({
      rounds: formatted,
      overallTotalStake: overallTotalStake
    });
  } catch (err) {
    console.error("❌ Error fetching total stakes per round:", err);
    res.status(500).json({ error: "Failed to fetch total stakes per round" });
  }
};