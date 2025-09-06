import db from '../config/db.js';
import { getCurrentRoundTime } from '../socket/index.js'; // ✅ Import from socket

// ✅ REMOVED: Local getCurrentRoundTime function - now using socket's version

// ✅ Updated placeBet to use socket's round time
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
        const ROUND_DURATION = 5 * 60 * 1000;
        const roundEnd = now + ROUND_DURATION - (now % ROUND_DURATION);
        const secondsLeft = Math.floor((roundEnd - now) / 1000);
        if (secondsLeft <= 15) {
            return res.status(403).json({ msg: '⏳ Bet not allowed in last 15 seconds of the round' });
        }

        const [[user]] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!user || user.balance < amount * 2) {
            return res.status(400).json({ msg: '❌ Insufficient balance' });
        }

        await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount * 2, userId]);

        // ✅ FIXED: Use socket's current round time
        const roundTime = getCurrentRoundTime();

        if (!roundTime) {
            return res.status(500).json({ msg: '❌ Round time not available' });
        }

        // console.log('🎲 Placing bet:', {
        //     userId,
        //     number,
        //     stake: amount,
        //     roundTime,
        //     barcode,
        //     currentTime: new Date().toLocaleTimeString()
        // });

        try {
            const [result] = await db.query(
                'INSERT INTO bets (user_id, number, stake, roundTime, barcode, status, bonus, placedAt) VALUES (?, ?, ?, ?, ?, "pending", 1.00, NOW())',
                [userId, number, amount, roundTime, barcode]
            );
            // console.log('✅ Bet inserted with ID:', result.insertId);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                const [result] = await db.query(
                    'INSERT INTO bets (user_id, number, stake, roundTime, barcode, status, placedAt) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
                    [userId, number, amount, roundTime, barcode]
                );
                // console.log('✅ Bet inserted (no bonus) with ID:', result.insertId);
            } else {
                throw err;
            }
        }

        const [verifyBet] = await db.query(
            'SELECT * FROM bets WHERE user_id = ? AND roundTime = ? AND barcode = ? ORDER BY id DESC LIMIT 1',
            [userId, roundTime, barcode]
        );
        // console.log('🔍 Bet verification:', verifyBet[0] || 'BET NOT FOUND!');

        const [[updated]] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);

        return res.json({
            msg: '✅ Bet placed successfully',
            balance: updated.balance,
            roundTime,
            betId: verifyBet[0]?.id
        });
    } catch (err) {
        console.error('❌ Error placing bet:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// ✅ Updated other functions to use socket's round time
export const getBetsSummary = async (req, res) => {
    try {
        const roundTime = getCurrentRoundTime();

        if (!roundTime) {
            return res.status(500).json({ msg: '❌ Round time not available' });
        }

        // console.log(`📊 Getting bets summary for round: ${roundTime}`);

        const [rows] = await db.query(`
            SELECT number, SUM(stake) AS totalStake
            FROM bets
            WHERE roundTime = ? AND status = 'pending'
            GROUP BY number
        `, [roundTime]);

        // console.log(`📊 Found ${rows.length} different numbers with bets for round ${roundTime}`);

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

// Keep all other functions the same...
export const declareResult = async (req, res) => {
    try {
        const { result, bonus = 1 } = req.body;
        const roundTime = getCurrentRoundTime();

        if (!roundTime) {
            return res.status(500).json({ msg: '❌ Round time not available' });
        }

        if (result == null || isNaN(result)) {
            return res.status(400).json({ msg: '❌ Invalid result' });
        }

        if (bonus < 1 || bonus > 10) {
            return res.status(400).json({ msg: '❌ Invalid bonus multiplier (must be 1-10)' });
        }

        try {
            await db.query('INSERT INTO results (`time`, `number`, `bonus`) VALUES (?, ?, ?)', [roundTime, result, bonus]);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                await db.query('INSERT INTO results (`time`, `number`) VALUES (?, ?)', [roundTime, result]);
            } else {
                throw err;
            }
        }

        const [pendingBets] = await db.query(
            'SELECT id, user_id, stake, number FROM bets WHERE roundTime = ? AND status = "pending"',
            [roundTime]
        );

        for (const bet of pendingBets) {
            let winnings = 0;
            let status = 'lost';

            if (parseInt(bet.number) === parseInt(result)) {
                const amount = bet.stake * 2;
                winnings = amount * 80 * bonus;
                status = 'won';

                await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [winnings, bet.user_id]);
            }

            try {
                await db.query('UPDATE bets SET status = ?, bonus = ? WHERE id = ?', [status, bonus, bet.id]);
            } catch (err) {
                if (err.code === 'ER_BAD_FIELD_ERROR') {
                    await db.query('UPDATE bets SET status = ? WHERE id = ?', [status, bet.id]);
                } else {
                    throw err;
                }
            }
        }

        return res.json({
            msg: '✅ Result declared and bets processed',
            result,
            bonus: `${bonus}x`,
            totalWinners: pendingBets.filter(b => parseInt(b.number) === parseInt(result)).length
        });
    } catch (err) {
        console.error('❌ Error declaring result:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

export const getDailyProfitLoss = async (req, res) => {
    try {
        const [columns] = await db.query(`SHOW COLUMNS FROM bets LIKE 'bonus'`);
        const bonusExists = columns.length > 0;

        const [stakes] = await db.query(`
            SELECT DATE(placedAt) AS date, SUM(stake * 2) AS totalStake
            FROM bets
            GROUP BY DATE(placedAt)
            ORDER BY DATE(placedAt) DESC
            LIMIT 30
        `);

        let payoutQuery;
        if (bonusExists) {
            payoutQuery = `
                SELECT DATE(placedAt) AS date, 
                       SUM(stake * 2 * 80 * COALESCE(bonus, 1)) AS totalPayout
                FROM bets
                WHERE status = 'won'
                GROUP BY DATE(placedAt)
                ORDER BY DATE(placedAt) DESC
                LIMIT 30
            `;
        } else {
            payoutQuery = `
                SELECT DATE(placedAt) AS date, 
                       SUM(stake * 2 * 80) AS totalPayout
                FROM bets
                WHERE status = 'won'
                GROUP BY DATE(placedAt)
                ORDER BY DATE(placedAt) DESC
                LIMIT 30
            `;
        }

        const [payouts] = await db.query(payoutQuery);

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

        const dailyProfitLoss = Object.values(resultMap)
            .map(item => ({
                ...item,
                profit: item.totalStake - item.totalPayout,
                profitPercentage: item.totalStake > 0 ? ((item.totalStake - item.totalPayout) / item.totalStake * 100).toFixed(2) : 0
            }))
            .sort((a, b) => (a.date < b.date ? 1 : -1));

        res.json(dailyProfitLoss);
    } catch (error) {
        console.error('Error fetching daily profit/loss:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

export const getBetsHistory = async (req, res) => {
    try {
        const [columns] = await db.query(`SHOW COLUMNS FROM bets LIKE 'bonus'`);
        const bonusExists = columns.length > 0;

        let query;
        if (bonusExists) {
            query = `
                SELECT DATE(placedAt) AS roundDate, roundTime, SUM(stake) AS total_stake,
                       AVG(COALESCE(bonus, 1)) as avg_bonus
                FROM bets
                GROUP BY roundDate, roundTime
                ORDER BY MAX(placedAt) DESC
                LIMIT 10
            `;
        } else {
            query = `
                SELECT DATE(placedAt) AS roundDate, roundTime, SUM(stake) AS total_stake,
                       1.00 as avg_bonus
                FROM bets
                GROUP BY roundDate, roundTime
                ORDER BY MAX(placedAt) DESC
                LIMIT 10
            `;
        }

        const [rows] = await db.query(query);

        const overallTotalStake = rows.reduce(
            (acc, row) => acc + parseFloat(row.total_stake || 0),
            0
        );

        const formatted = rows.map(r => ({
            roundTime: r.roundTime,
            totalStake: parseFloat(r.total_stake || 0),
            avgBonus: parseFloat(r.avg_bonus || 1).toFixed(2)
        }));

        res.json({
            rounds: formatted,
            overallTotalStake: overallTotalStake
        });
    } catch (err) {
        console.error("❌ Error fetching total stakes per round:", err);
        res.status(500).json({ error: "Failed to fetch total stakes per round" });
    }
};

export const claimBet = async (req, res) => {
    try {
        const { betId, userId, bankName, accountNumber, ifscCode } = req.body;

        if (!betId || !userId || !bankName || !accountNumber || !ifscCode) {
            return res.status(400).json({ msg: '❌ All fields are required' });
        }

        // Validate IFSC code format
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
            return res.status(400).json({ msg: '❌ Invalid IFSC code format' });
        }

        // Get bet details and verify it's a winning bet
        const [betRows] = await db.query(
            'SELECT * FROM bets WHERE id = ? AND user_id = ? AND status = "won"',
            [betId, userId]
        );

        if (!betRows.length) {
            return res.status(404).json({ msg: '❌ Winning bet not found or already claimed' });
        }

        const bet = betRows[0];

        // Check if already claimed
        const [existingClaim] = await db.query(
            'SELECT * FROM payout_requests WHERE bet_id = ?',
            [betId]
        );

        if (existingClaim.length > 0) {
            return res.status(400).json({ msg: '❌ This bet has already been claimed' });
        }

        // Calculate win amount
        const amount = bet.stake * 2;
        const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
        const winAmount = amount * 80 * bonus;

        // Create payout request
        await db.query(
            `INSERT INTO payout_requests (bet_id, user_id, win_amount, bank_name, bank_account_number, ifsc_code, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [betId, userId, winAmount, bankName, accountNumber, ifscCode.toUpperCase()]
        );

        // Update bet status to claimed
        await db.query('UPDATE bets SET status = "claimed" WHERE id = ?', [betId]);

        // console.log(`✅ Payout request created for bet ${betId}, amount: ₹${winAmount}`);

        return res.json({
            msg: '✅ Payout request submitted successfully',
            winAmount: winAmount,
            betId: betId
        });

    } catch (err) {
        console.error('❌ Error claiming bet:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

// Add this function to betController.js
export const updateBetClaimStatus = async (req, res) => {
    try {
        const { betId, status } = req.body; // status: 'claimed' or 'unclaimed'

        if (!betId || !['claimed', 'unclaimed'].includes(status)) {
            return res.status(400).json({ msg: '❌ Invalid bet ID or status' });
        }

        // Check if bet exists and is won
        const [betRows] = await db.query(
            'SELECT * FROM bets WHERE id = ? AND status = "won"',
            [betId]
        );

        if (!betRows.length) {
            return res.status(404).json({ msg: '❌ Bet not found or not a winning bet' });
        }

        // Check if table has claimed column, if not add it
        try {
            await db.query('ALTER TABLE bets ADD COLUMN claimed VARCHAR(20) DEFAULT "unclaimed"');
        } catch (err) {
            // Column might already exist, ignore error
            if (!err.message.includes('Duplicate column name')) {
                // console.log('Column might already exist:', err.message);
            }
        }

        // Update claimed status
        await db.query('UPDATE bets SET claimed = ? WHERE id = ?', [status, betId]);

        res.json({
            msg: `✅ Bet ${status} successfully`,
            betId,
            status
        });

    } catch (err) {
        console.error('❌ Error updating bet claim status:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

export const getBetsByUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        // ✅ Always try to get bonus and claimed status, with fallback
        const query = `
            SELECT id, number, stake, roundTime, status, barcode, placedAt, 
                   COALESCE(bonus, 1) as bonus,
                   COALESCE(claimed, 'unclaimed') as claimed
            FROM bets 
            WHERE user_id = ? 
            ORDER BY placedAt DESC
        `;

        const [bets] = await db.query(query, [userId]);

        // ✅ Log for debugging
        // console.log(`📊 Fetched ${bets.length} bets for user ${userId}`);
        if (bets.length > 0) {
            // console.log('📊 Sample bet:', {
            //     id: bets[0].id,
            //     status: bets[0].status,
            //     bonus: bets[0].bonus,
            //     stake: bets[0].stake,
            //     claimed: bets[0].claimed
            // });
        }

        res.status(200).json(bets);
    } catch (error) {
        console.error('❌ Error fetching bets by user:', error);
        res.status(500).json({ msg: 'Error fetching user bets' });
    }
};

export const getAllBets = async (req, res) => {
    try {
        const query = `
            SELECT id, number, stake, stake * 2 AS amount, roundTime, status, barcode, placedAt, 
                   COALESCE(bonus, 1) as bonus,
                   COALESCE(claimed, 'unclaimed') as claimed
            FROM bets
            ORDER BY placedAt DESC
            LIMIT 100
        `;

        const [bets] = await db.query(query);

        // ✅ Log for debugging
        // console.log(`📊 Fetched ${bets.length} bets for admin`);
        if (bets.length > 0) {
            const latestBet = bets[0];
            // console.log('📊 Latest bet:', {
            //     id: latestBet.id,
            //     status: latestBet.status,
            //     bonus: latestBet.bonus,
            //     stake: latestBet.stake,
            //     number: latestBet.number,
            //     claimed: latestBet.claimed
            // });
        }

        return res.json(bets);
    } catch (err) {
        console.error('❌ Error fetching bets:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

export const getBetsByBarcode = async (req, res) => {
    const { barcode } = req.params;

    if (!barcode || barcode.length !== 7) {
        return res.status(400).json({ msg: '❌ Invalid barcode' });
    }

    try {
        const query = `
            SELECT id, number, stake, roundTime AS drawTime, status, barcode, 
                   stake / 2 AS qty, stake AS amount, COALESCE(bonus, 1) as bonus,
                   COALESCE(claimed, 'unclaimed') as claimed,
                   CASE 
                     WHEN status = 'won' THEN stake * 2 * 80 * COALESCE(bonus, 1)
                     ELSE 0 
                   END AS winAmount 
            FROM bets 
            WHERE barcode = ?
            ORDER BY placedAt DESC
        `;

        const [bets] = await db.query(query, [barcode]);

        if (bets.length === 0) {
            return res.status(404).json({ msg: '❌ No bets found for this barcode' });
        }

        // ✅ Log for debugging
        // console.log(`📊 Fetched ${bets.length} bets for barcode ${barcode}`);
        bets.forEach(bet => {
            if (bet.status === 'won') {
                // console.log(`🏆 Winning bet: stake(${bet.stake}) × 2 × 80 × bonus(${bet.bonus}) = ${bet.winAmount}, claimed: ${bet.claimed}`);
            }
        });

        res.status(200).json(bets);
    } catch (error) {
        console.error('❌ Error fetching bets by barcode:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};
