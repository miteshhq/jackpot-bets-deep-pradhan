import { Server } from 'socket.io';
import db from '../config/db.js';

const generateBarcode = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
};

let io;
const ROUND_DURATION = 5 * 60 * 1000; // 5 minutes
const FINAL_COUNTDOWN = 5;
let roundEndTimestamp = null;
let manualResult = null;
let resultGenerated = false;
let inFinalCountdown = false;
let bonusMultiplier = 1;
let currentRoundTime = null; // ✅ NEW: Track the current round

const userSockets = new Map();

// ✅ FIXED: Calculate round time based on the round END timestamp
const getRoundTimeFromEndTimestamp = (endTimestamp) => {
    // The round represents the 5-minute period ENDING at this timestamp
    const endDate = new Date(endTimestamp);
    const endMinutes = endDate.getMinutes();
    const endHours = endDate.getHours();

    // Round the end minutes to nearest 5-minute mark
    const roundedEndMinutes = Math.ceil(endMinutes / 5) * 5;

    let actualEndHours = endHours;
    let actualEndMinutes = roundedEndMinutes;

    // Handle minute overflow
    if (actualEndMinutes >= 60) {
        actualEndMinutes = 0;
        actualEndHours += 1;
    }

    return `${actualEndHours.toString().padStart(2, '0')}:${actualEndMinutes.toString().padStart(2, '0')}`;
};

// ✅ NEW: Get the current active round time (what bets should be placed in)
const getCurrentActiveRoundTime = () => {
    if (!roundEndTimestamp) return null;
    return getRoundTimeFromEndTimestamp(roundEndTimestamp);
};

export const initSocket = (server) => {
    io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

    io.on('connection', (sock) => {
        const userId = sock.handshake.query.userId;
        if (userId) {
            userSockets.set(userId, sock.id);
            sock.join(userId);
        }

        if (roundEndTimestamp) {
            const secLeft = Math.max(0, Math.ceil((roundEndTimestamp - Date.now()) / 1000));
            sock.emit('timer-update', secLeft);
        }

        // Emit current round info
        if (currentRoundTime) {
            sock.emit('current-round', { roundTime: currentRoundTime });
        }

        const barcode = generateBarcode();
        sock.emit('generated-barcode', barcode);

        sock.on('disconnect', () => {
            if (userId) userSockets.delete(userId);
        });
    });

    startNewRound();
    setInterval(tick, 500);
};

const startNewRound = () => {
    const now = Date.now();
    roundEndTimestamp = now + ROUND_DURATION - (now % ROUND_DURATION);
    resultGenerated = false;
    manualResult = null;
    bonusMultiplier = 1;
    inFinalCountdown = false;

    // ✅ Calculate and store the current round time
    currentRoundTime = getRoundTimeFromEndTimestamp(roundEndTimestamp);

    console.log('🕒 New round started:');
    console.log('   - Round Time:', currentRoundTime);
    console.log('   - Ends at:', new Date(roundEndTimestamp).toLocaleTimeString());

    // Emit current round to all clients
    if (io) {
        io.emit('current-round', { roundTime: currentRoundTime });
    }
};

const tick = async () => {
    if (!io) return;

    const secLeft = Math.max(0, Math.ceil((roundEndTimestamp - Date.now()) / 1000));
    io.emit('timer-update', secLeft);

    if (secLeft <= FINAL_COUNTDOWN && !inFinalCountdown) {
        inFinalCountdown = true;
        console.log('🔔 Final popup countdown start');
        startPopupCountdown(FINAL_COUNTDOWN);
    }

    if (secLeft <= 0 && !resultGenerated) {
        resultGenerated = true;
        await finalizeResult();
        startNewRound();
    }
};

const startPopupCountdown = (seconds) => {
    let s = seconds;
    console.log("🚀 Starting popup countdown...");

    const previewInterval = setInterval(() => {
        if (s > 0) {
            const preview = Math.floor(Math.random() * 100);
            console.log("📤 Emitting preview:", preview, "in", s, "seconds");
            io.emit("final-popup", {
                countdown: s,
                preview,
                isResult: false,
            });
            s--;
        } else {
            clearInterval(previewInterval);
        }
    }, 1000);
};

// ✅ FIXED: Use the stored current round time for processing
const finalizeResult = async () => {
    console.log("🔧 Starting finalizeResult...");

    const roundTime = currentRoundTime; // Use the stored round time
    const finalNumber = manualResult !== null ? manualResult : Math.floor(Math.random() * 100);

    console.log(`🎲 Final number: ${finalNumber} | Bonus ×${bonusMultiplier}`);
    console.log(`🎯 Processing bets for round: ${roundTime}`);

    try {
        // Save result to DB
        try {
            await db.query(
                'INSERT INTO results (`time`, `number`, `bonus`, `created_at`) VALUES (?, ?, ?, NOW())',
                [roundTime, finalNumber, bonusMultiplier]
            );
            console.log(`💾 Result saved to DB: ${roundTime} → ${finalNumber} with ${bonusMultiplier}x bonus`);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                await db.query(
                    'INSERT INTO results (`time`, `number`, `created_at`) VALUES (?, ?, NOW())',
                    [roundTime, finalNumber]
                );
            } else {
                throw err;
            }
        }

        // ✅ FIXED: Get bets for the exact round time
        const [bets] = await db.query(
            'SELECT id, user_id, stake, number FROM bets WHERE roundTime = ? AND status = "pending"',
            [roundTime]
        );

        console.log(`📦 Pending bets for round ${roundTime}: ${bets.length}`);

        if (bets.length === 0) {
            console.log("🔍 Checking what bets exist in database...");
            const [allPending] = await db.query(
                'SELECT roundTime, COUNT(*) as count FROM bets WHERE status = "pending" GROUP BY roundTime ORDER BY id DESC LIMIT 5'
            );
            console.log("📋 Pending bets by round:", allPending);

            // ✅ Additional debugging
            const [recentBets] = await db.query(
                'SELECT roundTime, placedAt, status FROM bets ORDER BY id DESC LIMIT 10'
            );
            console.log("📋 Recent bets with timestamps:", recentBets);
        }

        // Process bets
        for (const bet of bets) {
            const isWin = Number(bet.number) === Number(finalNumber);

            if (isWin) {
                const amount = bet.stake * 2;
                const winnings = amount * 80 * bonusMultiplier; // ✅ Use correct bonus

                console.log(`💰 WIN CALCULATION: stake(${bet.stake}) × 2 × 80 × bonus(${bonusMultiplier}) = ${winnings}`);

                await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [winnings, bet.user_id]);

                // ✅ CRITICAL FIX: Always save bonus, even if column doesn't exist initially
                try {
                    await db.query('UPDATE bets SET status = "won", bonus = ? WHERE id = ?', [bonusMultiplier, bet.id]);
                    console.log(`✅ Bet ${bet.id} updated with bonus ${bonusMultiplier}x`);
                } catch (err) {
                    if (err.code === 'ER_BAD_FIELD_ERROR') {
                        // If bonus column doesn't exist, add it and then update
                        try {
                            await db.query('ALTER TABLE bets ADD COLUMN bonus DECIMAL(3,2) DEFAULT 1.00');
                            await db.query('UPDATE bets SET status = "won", bonus = ? WHERE id = ?', [bonusMultiplier, bet.id]);
                            console.log(`✅ Added bonus column and updated bet ${bet.id} with bonus ${bonusMultiplier}x`);
                        } catch (alterErr) {
                            await db.query('UPDATE bets SET status = "won" WHERE id = ?', [bet.id]);
                            console.log(`⚠️ Could not save bonus for bet ${bet.id}, saved status only`);
                        }
                    } else {
                        throw err;
                    }
                }

                const [[updated]] = await db.query('SELECT balance FROM users WHERE id = ?', [bet.user_id]);
                const userSocket = getUserSocket(bet.user_id);
                if (userSocket) {
                    io.to(userSocket).emit('bet-result', {
                        result: 'won',
                        number: finalNumber,
                        amount: winnings, // ✅ Send correct amount with bonus
                        bonus: bonusMultiplier,
                        balance: updated.balance,
                    });
                    io.to(userSocket).emit('balance-updated', { balance: updated.balance });
                }

                console.log(`✅ User ${bet.user_id} WON: ${winnings} (${bonusMultiplier}x bonus)`);
            } else {
                // ✅ FIXED: Save bonus for losing bets too
                try {
                    await db.query('UPDATE bets SET status = "lost", bonus = ? WHERE id = ?', [bonusMultiplier, bet.id]);
                } catch (err) {
                    if (err.code === 'ER_BAD_FIELD_ERROR') {
                        try {
                            await db.query('ALTER TABLE bets ADD COLUMN bonus DECIMAL(3,2) DEFAULT 1.00');
                            await db.query('UPDATE bets SET status = "lost", bonus = ? WHERE id = ?', [bonusMultiplier, bet.id]);
                        } catch (alterErr) {
                            await db.query('UPDATE bets SET status = "lost" WHERE id = ?', [bet.id]);
                        }
                    } else {
                        throw err;
                    }
                }

                const userSocket = getUserSocket(bet.user_id);
                if (userSocket) {
                    io.to(userSocket).emit('bet-result', {
                        result: 'lost',
                        number: finalNumber,
                        bonus: bonusMultiplier,
                    });
                }

                console.log(`❌ User ${bet.user_id} LOST. Bet: ${bet.number}, Result: ${finalNumber}`);
            }
        }

        setTimeout(() => {
            io.emit("final-popup", {
                countdown: 0,
                preview: finalNumber,
                bonus: bonusMultiplier,
                isResult: true,
            });
        }, 500); // Small delay for dramatic effect

        setTimeout(() => {
            io.emit("final-popup", {
                countdown: null,
                preview: null,
                isResult: true,
            });
        }, 3000);

        const resultPayload = {
            time: roundTime,
            number: finalNumber,
            bonus: bonusMultiplier
        };
        io.emit('new-result', resultPayload);

        console.log(`✅ Result finalized: ${finalNumber} with ${bonusMultiplier}x bonus`);

        manualResult = null;
        bonusMultiplier = 1;

    } catch (err) {
        console.error('❌ Error in finalizeResult:', err);
    }
};

export const setManualNumber = (n, bonus = 1) => {
    const secLeft = Math.max(0, Math.ceil((roundEndTimestamp - Date.now()) / 1000));
    if (secLeft <= FINAL_COUNTDOWN) {
        console.log('⚠️ Manual set too late:', secLeft, 'seconds left');
        return false;
    }

    manualResult = n;
    bonusMultiplier = bonus;
    console.log('🛠️ Manual result set:', n, 'with bonus ×', bonus);
    return true;
};

// ✅ NEW: Export function to get current round time for bet controller
export const getCurrentRoundTime = () => {
    return currentRoundTime;
};

const getUserSocket = (userId) => userSockets.get(String(userId)) || null;
export const getIO = () => io;
