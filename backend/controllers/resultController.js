import db from '../config/db.js';
import { getIO, setManualNumber } from '../socket/index.js';

// ✅ Get results (by date or default today)
export const getResults = async (req, res) => {
  try {
    const { date } = req.query;

    let targetDate = date;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
      }
    } else {
      targetDate = new Date().toISOString().slice(0, 10); // today's date
    }

    const [rows] = await db.query(
      `SELECT time, number, bonus FROM results WHERE DATE(created_at) = ? ORDER BY id ASC`,
      [targetDate]
    );

    return res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ Manual result generator (triggered at 4:50 of next round)
export const generateManualResult = async (req, res) => {
  try {
    const now = new Date();
    const roundTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const num = Math.floor(Math.random() * 100); // result number

    console.log(`📝 Inserting result for roundTime: ${roundTime}, number: ${num}`);

    await db.query(
      'INSERT INTO results (time, number, bonus, created_at) VALUES (?, ?, ?, NOW())',
      [roundTime, num, 1]
    );

    // Get bets placed for this round
    const [bets] = await db.query(
      'SELECT * FROM bets WHERE round_time = ? AND status = "pending"',
      [roundTime]
    );

    if (bets.length === 0) {
      console.log('ℹ️ No bets for this round.');
    } else {
      for (const bet of bets) {
        const isWin = Number(bet.bet_number) === num;

        if (isWin) {
          const winningAmount = bet.bet_amount * 90;

          await db.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [winningAmount, bet.user_id]
          );

          await db.query(
            'UPDATE bets SET result = ?, status = ? WHERE id = ?',
            [num, 'win', bet.id]
          );

          console.log(`✅ User ${bet.user_id} WON. Bet: ${bet.bet_number}, Result: ${num}`);
        } else {
          await db.query(
            'UPDATE bets SET result = ?, status = ? WHERE id = ?',
            [num, 'lose', bet.id]
          );

          console.log(`❌ User ${bet.user_id} LOST. Bet: ${bet.bet_number}, Result: ${num}`);
        }
      }
    }

    // Emit to frontend via socket
    getIO().emit('new-result', { time: roundTime, number: num, bonus: 1 });

    console.log(`🎯 Final result: ${roundTime} → ${num}`);
    res.json({ time: roundTime, number: num });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error generating result' });
  }
};

// ✅ Set manual result override
export const setManualResult = (req, res) => {
  const { number, bonus } = req.body;

  if (typeof number !== "number" || number < 0 || number > 99) {
    return res.status(400).json({ msg: "Invalid number" });
  }

  const ok = setManualNumber(number, bonus);
  if (!ok) {
    return res.status(403).json({ msg: "Too late to set result. Wait for next round." });
  }
  res.json({ msg: `Manual result set to ${number} with bonus ×${bonus}` });
};










