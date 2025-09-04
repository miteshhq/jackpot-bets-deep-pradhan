import { Server } from 'socket.io';
import db from '../config/db.js';

// ✅ Barcode generator function
const generateBarcode = () => {
  return Math.floor(1000000 + Math.random() * 9000000).toString(); // 7-digit string
};

let io;
const ROUND_DURATION = 5 * 60 * 1000; // 5 minutes
const FINAL_COUNTDOWN = 5; // 5 seconds
let roundEndTimestamp = null;
let manualResult = null;
let resultGenerated = false;
let inFinalCountdown = false;
let bonusMultiplier = 1;

const userSockets = new Map(); // userId => socket.id

// Format round time as HH:MM
const getRoundTimeFromTimestamp = (timestamp) => {
  const dt = new Date(timestamp);
  const mins = Math.floor(dt.getMinutes() / 5) * 5;
  return dt.getHours().toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0');
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

    // ✅ Emit a generated barcode to the frontend
    const barcode = generateBarcode();
    sock.emit('generated-barcode', barcode);

    sock.on('disconnect', () => {
      if (userId) userSockets.delete(userId);
    });
  });

  startNewRound();
  setInterval(tick, 500); // check every 0.5s
};

// Start a new round
const startNewRound = () => {
  const now = Date.now();
  roundEndTimestamp = now + ROUND_DURATION - (now % ROUND_DURATION);
  resultGenerated = false;
  manualResult = null;
  bonusMultiplier = 1;
  inFinalCountdown = false;
  console.log('🕒 New round ends at', new Date(roundEndTimestamp).toLocaleTimeString());
};

// Tick function (called every 0.5s)
const tick = async () => {
  if (!io) return;

  const secLeft = Math.max(0, Math.ceil((roundEndTimestamp - Date.now()) / 1000));
  io.emit('timer-update', secLeft);

  // Start final popup countdown
  if (secLeft <= FINAL_COUNTDOWN && !inFinalCountdown) {
    inFinalCountdown = true;
    console.log('🔔 Final popup countdown start');
    startPopupCountdown(FINAL_COUNTDOWN);
  }

  // Finalize round
  if (secLeft <= 0 && !resultGenerated) {
    resultGenerated = true;
    await finalizeResult();
    startNewRound();
  }
};

// Start preview countdown before final result
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
      // Do NOT emit final random result here
      // finalizeResult() will emit the real final result
    }
  }, 1000);
};

// Finalize the round, calculate bets and emit real result
const finalizeResult = async () => {
  console.log("🔧 Starting finalizeResult...");

  const roundTime = getRoundTimeFromTimestamp(roundEndTimestamp);
  const finalNumber = manualResult !== null ? manualResult : Math.floor(Math.random() * 100);
  console.log(`🎲 Final number: ${finalNumber} | Bonus ×${bonusMultiplier}`);

  try {
    // Save result to DB
    await db.query(
      'INSERT INTO results (`time`, `number`, `bonus`, `created_at`) VALUES (?, ?, ?, NOW())',
      [roundTime, finalNumber, bonusMultiplier]
    );

    // Process bets
    const [bets] = await db.query(
      'SELECT id, user_id, stake, number FROM bets WHERE status = "pending"'
    );

    console.log(`📦 Pending bets: ${bets.length}`);

    for (const bet of bets) {
      const isWin = Number(bet.number) === Number(finalNumber);

      if (isWin) {
        const winnings = bet.stake * 80 * 2 * bonusMultiplier;
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [winnings, bet.user_id]);
        await db.query('UPDATE bets SET status = "won" WHERE id = ?', [bet.id]);

        const [[updated]] = await db.query('SELECT balance FROM users WHERE id = ?', [bet.user_id]);
        const userSocket = getUserSocket(bet.user_id);
        if (userSocket) {
          io.to(userSocket).emit('bet-result', {
            result: 'won',
            number: finalNumber,
            amount: winnings,
            balance: updated.balance,
          });
          io.to(userSocket).emit('balance-updated', { balance: updated.balance });
        }
      } else {
        await db.query('UPDATE bets SET status = "lost" WHERE id = ?', [bet.id]);
        const userSocket = getUserSocket(bet.user_id);
        if (userSocket) {
          io.to(userSocket).emit('bet-result', {
            result: 'lost',
            number: finalNumber,
          });
        }
      }
    }

    // Emit final result to everyone
    io.emit("final-popup", {
      countdown: 0,
      preview: finalNumber,
      isResult: true,
    });

    // Hide popup after 5 seconds
    setTimeout(() => {
      io.emit("final-popup", {
        countdown: null,
        preview: null,
        isResult: true,
      });
    }, 5000);

    // Emit new result payload
    const resultPayload = { time: roundTime, number: finalNumber };
    if (bonusMultiplier > 1) resultPayload.bonus = bonusMultiplier;
    io.emit('new-result', resultPayload);

    console.log(`✅ Result finalized: ${finalNumber}`);
  } catch (err) {
    console.error('❌ Error in finalizeResult:', err);
  }
};

// Set manual number before countdown
export const setManualNumber = (n, bonus = 1) => {
  const secLeft = Math.max(0, Math.ceil((roundEndTimestamp - Date.now()) / 1000));
  if (secLeft <= FINAL_COUNTDOWN) {
    console.log('⚠️ Manual set too late:', secLeft);
    return false;
  }

  manualResult = n;
  bonusMultiplier = bonus;
  console.log('🛠️ Manual result set:', n, 'with bonus ×', bonus);
  return true;
};

// Helper to get user socket
const getUserSocket = (userId) => userSockets.get(String(userId)) || null;

// Export IO
export const getIO = () => io;




















