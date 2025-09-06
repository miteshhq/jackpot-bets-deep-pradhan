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

        // Check if bonus column exists in results table
        const [columns] = await db.query(`SHOW COLUMNS FROM results LIKE 'bonus'`);
        const bonusExists = columns.length > 0;

        let query;
        if (bonusExists) {
            query = `SELECT time, number, COALESCE(bonus, 1) as bonus FROM results WHERE DATE(created_at) = ? ORDER BY id ASC`;
        } else {
            query = `SELECT time, number, 1 as bonus FROM results WHERE DATE(created_at) = ? ORDER BY id ASC`;
        }

        const [rows] = await db.query(query, [targetDate]);
        return res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ msg: 'Server error' });
    }
};

// ✅ Manual result generator - FIXED COLUMN NAMES AND BONUS CALCULATION
export const generateManualResult = async (req, res) => {
    try {
        const now = new Date();
        const roundTime = now.toTimeString().slice(0, 5); // "HH:MM"
        const num = Math.floor(Math.random() * 100); // result number
        const bonus = Math.floor(Math.random() * 3) + 1; // Random bonus 1-3x

        // console.log(`📝 Inserting result for roundTime: ${roundTime}, number: ${num}, bonus: ${bonus}x`);

        // Insert result with bonus
        try {
            await db.query(
                'INSERT INTO results (time, number, bonus, created_at) VALUES (?, ?, ?, NOW())',
                [roundTime, num, bonus]
            );
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                // Fallback if bonus column doesn't exist in results
                await db.query(
                    'INSERT INTO results (time, number, created_at) VALUES (?, ?, NOW())',
                    [roundTime, num]
                );
            } else {
                throw err;
            }
        }

        // ✅ FIXED: Get bets with correct column names
        const [bets] = await db.query(
            'SELECT * FROM bets WHERE roundTime = ? AND status = "pending"',
            [roundTime]
        );

        if (bets.length === 0) {
            // console.log('ℹ️ No bets for this round.');
        } else {
            for (const bet of bets) {
                // ✅ FIXED: Use correct column names
                const isWin = Number(bet.number) === num;

                if (isWin) {
                    // ✅ FIXED: Use correct stake calculation
                    const amount = bet.stake * 2;
                    const winningAmount = amount * 80 * bonus; // Apply bonus multiplier

                    await db.query(
                        'UPDATE users SET balance = balance + ? WHERE id = ?',
                        [winningAmount, bet.user_id]
                    );

                    // ✅ FIXED: Update bet with bonus
                    try {
                        await db.query(
                            'UPDATE bets SET status = ?, bonus = ? WHERE id = ?',
                            ['won', bonus, bet.id]
                        );
                    } catch (err) {
                        if (err.code === 'ER_BAD_FIELD_ERROR') {
                            await db.query(
                                'UPDATE bets SET status = ? WHERE id = ?',
                                ['won', bet.id]
                            );
                        } else {
                            throw err;
                        }
                    }

                    // console.log(`✅ User ${bet.user_id} WON. Bet: ${bet.number}, Result: ${num}, Bonus: ${bonus}x, Amount: ${winningAmount}`);
                } else {
                    // ✅ FIXED: Update losing bets with bonus
                    try {
                        await db.query(
                            'UPDATE bets SET status = ?, bonus = ? WHERE id = ?',
                            ['lost', bonus, bet.id]
                        );
                    } catch (err) {
                        if (err.code === 'ER_BAD_FIELD_ERROR') {
                            await db.query(
                                'UPDATE bets SET status = ? WHERE id = ?',
                                ['lost', bet.id]
                            );
                        } else {
                            throw err;
                        }
                    }

                    // console.log(`❌ User ${bet.user_id} LOST. Bet: ${bet.number}, Result: ${num}`);
                }
            }
        }

        // Emit to frontend via socket
        getIO().emit('new-result', { time: roundTime, number: num, bonus });

        // console.log(`🎯 Final result: ${roundTime} → ${num} (${bonus}x bonus)`);
        res.json({ time: roundTime, number: num, bonus });

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

    const bonusMultiplier = bonus || 1; // Default to 1x if no bonus provided

    const ok = setManualNumber(number, bonusMultiplier);
    if (!ok) {
        return res.status(403).json({ msg: "Too late to set result. Wait for next round." });
    }
    res.json({ msg: `Manual result set to ${number} with bonus ×${bonusMultiplier}` });
};
