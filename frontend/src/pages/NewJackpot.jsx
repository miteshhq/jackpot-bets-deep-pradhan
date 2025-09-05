import React, { useEffect, useState, useRef } from "react";
import JackpotHeader from "../components/JackpotHeader";
import JackpotGameResult from "../components/JackpotGameResult";
import JackpotButton from "../components/JackpotButton";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import io from "socket.io-client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ShufflingNumber = ({ preview, isFinal }) => {
  const [display, setDisplay] = React.useState("--");

  useEffect(() => {
    console.log("🎰 ShufflingNumber: isFinal =", isFinal, "preview =", preview);

    if (!isFinal) {
      const interval = setInterval(() => {
        const randomNum = Math.floor(Math.random() * 100);
        setDisplay(randomNum.toString().padStart(2, "0"));
      }, 80);

      return () => {
        console.log("🛑 Clearing shuffling interval");
        clearInterval(interval);
      };
    } else {
      console.log("✅ Displaying final number:", preview);
      setDisplay(preview?.toString().padStart(2, "0") || "--");
    }
  }, [preview, isFinal]);

  return (
    <motion.div
      key={display}
      initial={{ scale: isFinal ? 0.6 : 1 }}
      animate={{
        scale: isFinal ? 1.3 : 1,
        color: isFinal ? "#ff0000" : "#000",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="text-[110px] sm:text-[140px] font-extrabold drop-shadow-lg"
    >
      {display}
    </motion.div>
  );
};

// Simple Confirmation Message Component
const ConfirmationMessage = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600";

  return (
    <div
      className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center animate-bounce`}
    >
      <span className="mr-3">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-xl leading-none focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

// Game Guide Component
const GameGuide = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-800">
            🎯 How to Play STAR DIGIT
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 💡 Calculation Info Box */}
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 text-lg">
              📊 Win Calculation Formula:
            </h3>
            <div className="bg-white p-3 rounded border-l-4 border-green-500 mb-3">
              <p className="text-lg font-bold text-green-700 mb-2">
                <strong>Win Amount = Stake × 2 × 80 × Bonus Multiplier</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <p>
                  <strong>• Stake:</strong> Your bet amount (what you enter)
                </p>
                <p>
                  <strong>• Multiplied by 2:</strong> Standard game rule
                </p>
              </div>
              <div>
                <p>
                  <strong>• Multiplied by 80:</strong> Fixed payout ratio
                </p>
                <p>
                  <strong>• Multiplied by Bonus:</strong> Decided by admin
                  (1x-10x)
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-300">
              <p className="text-sm font-semibold">
                <span className="text-orange-600">Example:</span> If you bet ₹5
                and win with 3x bonus:
                <span className="text-green-600 font-bold">
                  {" "}
                  ₹5 × 2 × 80 × 3 = ₹2,400
                </span>
              </p>
            </div>
          </div>

          {/* Basic Game Rules */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3 text-lg">
              🎮 Game Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <strong>🎯 Objective:</strong> Predict the winning 2-digit
                  number (00-99)
                </p>
                <p>
                  <strong>⏰ Draw Timing:</strong> Every 5 minutes
                </p>
                <p>
                  <strong>💰 Minimum Bet:</strong> ₹1 per number
                </p>
                <p>
                  <strong>🎊 Win Ratio:</strong> 1:80 (before bonus)
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>⏳ Bet Cutoff:</strong> 15 seconds before draw
                </p>
                <p>
                  <strong>🎁 Bonus:</strong> 1x to 10x multiplier
                </p>
                <p>
                  <strong>📱 Auto Print:</strong> Ticket generated after bet
                </p>
                <p>
                  <strong>🔢 Barcode:</strong> 7-digit tracking number
                </p>
              </div>
            </div>
          </div>

          {/* How to Play Steps */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-3 text-lg">
              📝 Step-by-Step Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Choose Your Numbers</p>
                  <p className="text-sm text-gray-600">
                    Click on any number (00-99) and enter your bet amount
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Use Quick Options</p>
                  <p className="text-sm text-gray-600">
                    Use E-columns, Row betting, or Lucky Pick (LP) for faster
                    selection
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Review Total Amount</p>
                  <p className="text-sm text-gray-600">
                    Check the total amount in footer before placing bet
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Place Your Bet</p>
                  <p className="text-sm text-gray-600">
                    Click "Place Bet" button (available until 15 seconds before
                    draw)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div>
                  <p className="font-semibold">Get Your Ticket</p>
                  <p className="text-sm text-gray-600">
                    Auto-print ticket with barcode for tracking your bets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-3 text-lg">
              ⚡ Advanced Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-pink-600">
                    🌸 E-Columns (Pink)
                  </p>
                  <p className="text-sm">
                    Bet on entire columns (E0: 0,10,20...90)
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-cyan-600">
                    🌊 Row Betting (Cyan)
                  </p>
                  <p className="text-sm">Bet on entire rows (Row 0: 00-09)</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-blue-600">
                    🎲 Lucky Pick (LP)
                  </p>
                  <p className="text-sm">Auto-select 1-5 random numbers</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">
                    🔍 Barcode Tracking
                  </p>
                  <p className="text-sm">
                    Enter 7-digit code to check bet status
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Strategies */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-3 text-lg">
              💡 Tips & Strategies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <strong>✅ Do:</strong> Start with small amounts
                </p>
                <p>
                  <strong>✅ Do:</strong> Use combination betting (E+Row)
                </p>
                <p>
                  <strong>✅ Do:</strong> Keep track of your barcodes
                </p>
                <p>
                  <strong>✅ Do:</strong> Set a budget and stick to it
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>❌ Don't:</strong> Bet more than you can afford
                </p>
                <p>
                  <strong>❌ Don't:</strong> Chase losses
                </p>
                <p>
                  <strong>❌ Don't:</strong> Wait until last second
                </p>
                <p>
                  <strong>❌ Don't:</strong> Forget to save your barcode
                </p>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="font-bold text-red-800 mb-3 text-lg">
              ⏰ Important Timings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-green-600">🟢 Safe Zone</p>
                <p>More than 15 seconds left</p>
                <p className="text-xs text-gray-600">Betting allowed</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-yellow-600">🟡 Warning Zone</p>
                <p>30-16 seconds left</p>
                <p className="text-xs text-gray-600">Hurry up!</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-red-600">🔴 Locked Zone</p>
                <p>15-0 seconds left</p>
                <p className="text-xs text-gray-600">No betting allowed</p>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">
              🆘 Need Help?
            </h3>
            <div className="text-sm space-y-2">
              <p>
                <strong>📞 Support:</strong> Contact admin for assistance
              </p>
              <p>
                <strong>💰 Balance:</strong> Check your wallet balance before
                betting
              </p>
              <p>
                <strong>🎫 Tickets:</strong> Keep your barcode safe for
                verification
              </p>
              <p>
                <strong>🏆 Results:</strong> Check results section for winning
                numbers
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Got it! Let's Play 🎮
          </button>
        </div>
      </div>
    </div>
  );
};

// Constants
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SOCKET_URL = `${BACKEND_URL}`;

// Utility: Get current rounded draw time
const getCurrentRoundTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 5;
  const minutesRoundedUp =
    remainder === 0 ? minutes : minutes + (5 - remainder);

  if (minutesRoundedUp >= 60) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  } else {
    now.setMinutes(minutesRoundedUp);
  }

  now.setSeconds(0);
  now.setMilliseconds(0);

  const timeString = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return timeString.replace(/am|pm/, (match) => match.toUpperCase());
};

// Barcode Generator: 7-digit starting with "5"
const generateBarcode = () => {
  const randomSix = Math.floor(100000 + Math.random() * 900000);
  return `5${randomSix.toString().slice(0, 6)}`;
};

const JackpotGame = () => {
  const navigate = useNavigate();
  const [betNumbers, setBetNumbers] = useState(new Set());
  const [showGuide, setShowGuide] = useState(false);

  const [finalPopupCountdown, setFinalPopupCountdown] = useState(null);
  const [finalPopupPreview, setFinalPopupPreview] = useState(null);
  const [barcodeResults, setBarcodeResults] = useState([]);
  const [showBarcodePopup, setShowBarcodePopup] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [footerQty, setFooterQty] = useState(1);
  const [footerAmount, setFooterAmount] = useState(2.0);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [winPopup, setWinPopup] = useState(null);
  const [balance, setBalance] = useState(0);
  const [gridValues, setGridValues] = useState(
    Array.from({ length: 10 }, () => Array(10).fill(""))
  );
  const [eValues, setEValues] = useState(Array(10).fill(""));
  const [rowValues, setRowValues] = useState(Array(10).fill(""));
  const [lpValue, setLpValue] = useState("5");
  const [currentDrawTime, setCurrentDrawTime] = useState(getCurrentRoundTime());

  // New state for confirmation messages
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const socketRef = useRef(null);

  const numbers = Array.from({ length: 100 }, (_, i) => i);
  const grid = Array.from({ length: 10 }, (_, row) =>
    numbers.slice(row * 10, row * 10 + 10)
  );

  // Show guide for new users
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenGameGuide");
    if (!hasSeenGuide && user) {
      // Only show for logged-in users
      setTimeout(() => setShowGuide(true), 1000); // Delay to let page load
      localStorage.setItem("hasSeenGameGuide", "true");
    }
  }, [user]);

  // Show confirmation message helper
  const showMessage = (message, type = "success", duration = 5000) => {
    setConfirmationMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setConfirmationMessage("");
    }, duration);
  };

  // Clear function for manual clearing
  const clearNumber = () => {
    console.log("🧹 Manual clearing all betting fields...");
    setGridValues(Array.from({ length: 10 }, () => Array(10).fill("")));
    setEValues(Array(10).fill(""));
    setRowValues(Array(10).fill(""));
    setBetNumbers(new Set());
    setLpValue("5");
    localStorage.removeItem("placedNumbers");
    showMessage("🧹 All fields cleared! Ready for new bets.", "info");
  };

  // Auto clear function after successful bet placement
  const autoClearAfterBet = () => {
    console.log("🔄 Auto-clearing after successful bet placement...");
    setGridValues(Array.from({ length: 10 }, () => Array(10).fill("")));
    setEValues(Array(10).fill(""));
    setRowValues(Array(10).fill(""));
    setLpValue("5");
  };

  // BARCODE functionality
  useEffect(() => {
    let timeoutId;

    const fetchBarcodeBets = async () => {
      if (barcode.length === 7 && /^[5]\d{6}$/.test(barcode)) {
        try {
          const { data } = await axios.get(
            `${BACKEND_URL}/api/bets/by-barcode/${barcode}`
          );
          setBarcodeResults(data);
          setShowBarcodePopup(true);
        } catch (err) {
          console.error("❌ Error fetching barcode bets:", err.message);
          setBarcodeResults([]);
          setShowBarcodePopup(false);
        }
      } else {
        setShowBarcodePopup(false);
        setBarcodeResults([]);
      }
    };

    if (barcode) {
      timeoutId = setTimeout(fetchBarcodeBets, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [barcode]);

  // TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDrawTime(getCurrentRoundTime());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // SOCKET
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      query: { userId: user?.id || "" },
    });

    socketRef.current.on("connect", () =>
      console.log("🟢 Connected to socket.io server")
    );

    socketRef.current.on("timer-update", (sec) => setTimeLeft(sec));

    socketRef.current.on("final-popup", ({ countdown, preview, isResult }) => {
      console.log("📩 final-popup received:", { countdown, preview, isResult });

      if (countdown === null) {
        console.log("🔄 New round starting - resetting popup");
        setFinalPopupCountdown(null);
        setFinalPopupPreview(null);
        setBetNumbers(new Set());
        localStorage.removeItem("placedNumbers");
      } else if (isResult && countdown === 0) {
        console.log("🛑 Final result received, stopping shuffle");
        setFinalPopupCountdown(0);
        setFinalPopupPreview(preview);

        setTimeout(() => {
          console.log("⏰ Auto-closing final result popup");
          setFinalPopupCountdown(null);
          setFinalPopupPreview(null);
        }, 4000);
      } else if (countdown > 0) {
        console.log("⏳ Countdown in progress:", countdown);
        setFinalPopupCountdown(countdown);
        setFinalPopupPreview(preview);
      }
    });

    return () => {
      console.log("🔌 Disconnecting socket");
      socketRef.current.disconnect();
    };
  }, [user]);

  // LOAD SAVED BETS
  useEffect(() => {
    const saved = localStorage.getItem("placedNumbers");
    if (saved) {
      const { numbers, roundTime } = JSON.parse(saved);
      if (roundTime === getCurrentRoundTime()) {
        setBetNumbers(new Set(numbers));
      } else {
        localStorage.removeItem("placedNumbers");
      }
    }
  }, [currentDrawTime]);

  // ENHANCED PLACE BET WITH AUTO CLEAR AND CONFIRMATION MESSAGE
  const handlePlaceBet = async () => {
    if (!user) {
      showMessage("❌ Please login first.", "error");
      return;
    }

    if (timeLeft <= 15) {
      showMessage("⚠️ Bet window closed. Please wait for next round.", "error");
      return;
    }

    const bets = [];
    const placedNumbers = new Set();

    gridValues.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const amount = parseFloat(value);
        if (!isNaN(amount) && amount > 0) {
          const number = rowIndex * 10 + colIndex;
          bets.push({ number, points: amount });
          placedNumbers.add(number);
        }
      });
    });

    if (bets.length === 0) {
      showMessage("⚠️ Please enter at least one number to place bet.", "error");
      return;
    }

    try {
      const roundTime = getCurrentRoundTime();
      const totalAmount =
        bets.reduce((sum, bet) => sum + bet.points, 0) * footerAmount;
      const confirmed = window.confirm(
        `Confirm placing Rs.${totalAmount.toFixed(2)} in bets?`
      );
      if (!confirmed) return;

      const newBarcode = generateBarcode();
      setBarcode(newBarcode);

      // Place all bets
      for (const bet of bets) {
        await axios.post(`${BACKEND_URL}/api/bets/place`, {
          userId: user.id,
          number: bet.number,
          stake: bet.points,
          roundTime,
          barcode: newBarcode,
        });
      }

      // Save placed bet numbers for reference
      setBetNumbers((prev) => {
        const updated = new Set([...prev, ...placedNumbers]);
        localStorage.setItem(
          "placedNumbers",
          JSON.stringify({ numbers: Array.from(updated), roundTime })
        );
        return updated;
      });

      // Show success message
      showMessage(
        `✅ Bet placed successfully! Barcode: ${newBarcode}. You can place new bets now.`,
        "success",
        7000
      );

      // Auto clear input fields after successful bet
      setTimeout(() => {
        autoClearAfterBet();
      }, 1000);

      // Navigate to print page
      navigate("/print-f12", {
        state: {
          selectedBets: bets,
          barcode: newBarcode,
          roundTime,
          autoPrint: true,
        },
      });
    } catch (err) {
      console.error("❌ Bet error:", err.response?.data || err.message);
      showMessage(
        "❌ Failed to place bet. Please check your balance or try again.",
        "error"
      );
    }
  };

  // LP CLICK functionality
  const handleLPClick = () => {
    const count = parseInt(lpValue);
    if (isNaN(count) || count <= 0 || count > 5) {
      showMessage("⚠️ Please enter a valid number between 1 and 5.", "error");
      return;
    }

    const updatedGrid = gridValues.map((row) => [...row]);
    const selected = new Set();
    while (selected.size < count) selected.add(Math.floor(Math.random() * 100));

    selected.forEach((num) => {
      const row = Math.floor(num / 10);
      const col = num % 10;
      const currentVal = parseFloat(updatedGrid[row][col]) || 0;
      updatedGrid[row][col] = (currentVal + 1).toString();
    });

    setGridValues(updatedGrid);
    setLpValue("5");
    showMessage(
      `🎲 Lucky Pick: ${count} random numbers selected!`,
      "info",
      3000
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-white to-purple-100 font-sans overflow-hidden">
      <JackpotHeader onTimerUpdate={setTimeLeft} />

      <JackpotButton
        gridValues={gridValues}
        onClear={clearNumber}
        onShowGuide={() => setShowGuide(true)}
      />

      {/* Quick Info Bar with Guide Button */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span>🎯 Win Rate: 1:80</span>
          <span>⏰ Draws every 5 mins</span>
          <span>💰 Min bet: ₹2</span>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="bg-white text-black bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-semibold transition"
        >
          📖 How to Play
        </button>
      </div>

      {/* Win Calculation Guide - Always Visible */}
      <div className="mx-2 mt-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-green-800 text-sm mb-1">
              📊 Win Formula:{" "}
              <span className="text-blue-600">Stake × 2 × 80 × Bonus</span>
            </h3>
            <p className="text-xs text-green-700">
              Example: ₹5 bet with 3x bonus = ₹5 × 2 × 80 × 3 ={" "}
              <span className="font-bold text-green-600">₹2,400</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 p-2">
            <div className="text-sm mb-2 px-2 font-bold bg-gradient-to-b from-blue-300 via-blue-300 to-blue-500 flex justify-between">
              <div>STAR DIGIT Rs. 2</div>
              <div className="font-semibold">
                Current Draw: {currentDrawTime || "Loading..."}
              </div>
              <div className="font-bold text-black">WIN Rs. 160</div>
            </div>

            <div className="w-full overflow-auto">
              <div className="w-full bg-gradient-to-b from-white via-blue-100 to-blue-500 p-2 rounded-md relative">
                {/* Main Content */}
                <div className="flex w-full">
                  {/* Main Grid - NO GREEN BOXES */}
                  <div className="w-full sm:w-[85%] space-y-[8px] pt-[2px]">
                    {grid.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="grid grid-cols-10 gap-2 sm:gap-2"
                      >
                        {row.map((num, colIndex) => (
                          <div key={num} className="flex flex-col items-center">
                            <p className="text-center text-[8px] sm:text-xs font-semibold">
                              {num.toString().padStart(2, "0")}
                            </p>
                            <input
                              type="tel"
                              key={colIndex}
                              disabled={isLocked}
                              className={`text-center border border-gray-400 h-[20px] w-[26px] text-[8px]
                sm:h-[28px] sm:w-12 sm:text-xs disabled:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  parseFloat(gridValues[rowIndex][colIndex]) > 0
                    ? "bg-white"
                    : "bg-white"
                }`}
                              value={gridValues[rowIndex][colIndex]}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!/^\d{0,2}$/.test(value)) return;
                                const updated = [...gridValues];
                                updated[rowIndex][colIndex] = value;
                                setGridValues(updated);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Right Side E Inputs - Hidden on Mobile */}
                  <div className="hidden sm:flex w-[15%] flex-row ml-1 pt-[2px]">
                    <div className="flex flex-col space-y-[5.5px]">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="flex justify-center gap-1 w-full px-1">
                            <div className="text-[8px] sm:text-xs font-semibold text-center w-[22px] sm:w-[36px]">
                              E{i}
                            </div>
                            <div className="text-[8px] sm:text-xs font-semibold text-center w-[32px] sm:w-[50px]">
                              {`${i * 10}-${i * 10 + 9}`}
                            </div>
                          </div>
                          <div className="flex gap-1 mt-[2px]">
                            <input
                              type="tel"
                              className="w-[22px] h-[18px] text-[8px] 
                     sm:w-[36px] sm:h-[28px] sm:text-sm
                     bg-pink-500 text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-pink-400"
                              value={eValues[i]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/^\d{0,2}$/.test(val)) return;
                                const newEValues = [...eValues];
                                newEValues[i] = val;
                                setEValues(newEValues);
                                const updatedGrid = [...gridValues];
                                for (let row = 0; row < 10; row++) {
                                  const rowVal =
                                    rowValues[row] === ""
                                      ? 0
                                      : parseInt(rowValues[row]);
                                  if (val === "") {
                                    updatedGrid[row][i] = "";
                                  } else {
                                    const colVal = parseInt(val);
                                    updatedGrid[row][i] = (
                                      rowVal + colVal
                                    ).toString();
                                  }
                                }
                                setGridValues(updatedGrid);
                              }}
                            />
                            <input
                              type="tel"
                              className="w-[22px] h-[18px] text-[8px] 
                     sm:w-[36px] sm:h-[28px] sm:text-sm
                     bg-cyan-300 text-blue-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                              value={rowValues[i]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/^\d{0,2}$/.test(val)) return;
                                const newRowValues = [...rowValues];
                                newRowValues[i] = val;
                                setRowValues(newRowValues);
                                const updatedGrid = [...gridValues];
                                for (let col = 0; col < 10; col++) {
                                  const colVal =
                                    eValues[col] === ""
                                      ? 0
                                      : parseInt(eValues[col]);
                                  if (val === "") {
                                    updatedGrid[i][col] = "";
                                  } else {
                                    const rowVal = parseInt(val);
                                    updatedGrid[i][col] = (
                                      rowVal + colVal
                                    ).toString();
                                  }
                                }
                                setGridValues(updatedGrid);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* LP input & button */}
                    <div className="flex flex-col items-center justify-end ml-1 h-full pb-1">
                      <input
                        type="tel"
                        value={lpValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d{0,1}$/.test(val)) return;
                          if (parseInt(val) > 5) return;
                          setLpValue(val);
                        }}
                        className="w-[40px] h-[28px] text-sm text-center border border-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleLPClick}
                        disabled={isLocked}
                        className="w-[40px] h-[28px] text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded mt-1"
                      >
                        LP
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile E & Row Inputs */}
                <div className="block sm:hidden w-full mt-3 space-y-2">
                  {/* E0 - E9 labels */}
                  <div className="grid grid-cols-10 gap-[6px] justify-items-center">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`elabel-${i}`}
                        className="text-[10px] font-bold text-center w-[26px]"
                      >
                        E{i}
                      </div>
                    ))}
                  </div>
                  {/* E-values inputs */}
                  <div className="grid grid-cols-10 gap-[6px] justify-items-center">
                    {[...Array(10)].map((_, i) => (
                      <input
                        key={`einput-${i}`}
                        type="tel"
                        className="w-[26px] h-[22px] text-[10px] text-center bg-pink-500 text-white font-bold focus:outline-none focus:ring-1 focus:ring-pink-400"
                        value={eValues[i]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d{0,2}$/.test(val)) return;
                          const newEValues = [...eValues];
                          newEValues[i] = val;
                          setEValues(newEValues);
                          const updatedGrid = [...gridValues];
                          for (let row = 0; row < 10; row++) {
                            const rowVal =
                              rowValues[row] === ""
                                ? 0
                                : parseInt(rowValues[row]);
                            if (val === "") {
                              updatedGrid[row][i] = "";
                            } else {
                              const colVal = parseInt(val);
                              updatedGrid[row][i] = (
                                rowVal + colVal
                              ).toString();
                            }
                          }
                          setGridValues(updatedGrid);
                        }}
                      />
                    ))}
                  </div>
                  {/* Range Labels */}
                  <div className="grid grid-cols-10 gap-[6px] justify-items-center">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`range-${i}`}
                        className="text-[10px] font-bold text-center w-[40px] truncate"
                      >
                        {i * 10}-{i * 10 + 9}
                      </div>
                    ))}
                  </div>
                  {/* Row-values inputs */}
                  <div className="grid grid-cols-10 gap-[6px] justify-items-center">
                    {[...Array(10)].map((_, i) => (
                      <input
                        key={`rinput-${i}`}
                        type="tel"
                        className="w-[26px] h-[22px] text-[10px] text-center bg-cyan-300 text-blue-900 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        value={rowValues[i]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d{0,2}$/.test(val)) return;
                          const newRowValues = [...rowValues];
                          newRowValues[i] = val;
                          setRowValues(newRowValues);
                          const updatedGrid = [...gridValues];
                          for (let col = 0; col < 10; col++) {
                            const colVal =
                              eValues[col] === "" ? 0 : parseInt(eValues[col]);
                            if (val === "") {
                              updatedGrid[i][col] = "";
                            } else {
                              const rowVal = parseInt(val);
                              updatedGrid[i][col] = (
                                rowVal + colVal
                              ).toString();
                            }
                          }
                          setGridValues(updatedGrid);
                        }}
                      />
                    ))}
                  </div>
                  {/* LP Input and Button */}
                  <div className="flex justify-center items-center gap-2 pt-2">
                    <input
                      type="tel"
                      value={lpValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d{0,1}$/.test(val)) return;
                        if (parseInt(val) > 5) return;
                        setLpValue(val);
                      }}
                      className="w-[40px] h-[28px] text-[12px] text-center border border-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleLPClick}
                      disabled={isLocked}
                      className="w-[40px] h-[28px] text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      LP
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Popup */}
            {finalPopupCountdown !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] 
            bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 
            rounded-full flex items-center justify-center shadow-2xl border-8 border-white"
                >
                  <ShufflingNumber
                    preview={finalPopupPreview}
                    isFinal={finalPopupCountdown === 0}
                  />

                  {finalPopupCountdown > 0 && (
                    <div className="absolute bottom-2 right-2 bg-white w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-black text-2xl sm:text-3xl font-bold">
                        {finalPopupCountdown.toString().padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 text-sm sm:text-base text-white font-semibold tracking-wide drop-shadow">
                    {finalPopupCountdown > 0
                      ? "Final Draw in..."
                      : "🎉 Final Result"}
                  </div>

                  {finalPopupCountdown === 0 && (
                    <button
                      onClick={() => {
                        console.log("👆 Manual close of final popup");
                        setFinalPopupCountdown(null);
                        setFinalPopupPreview(null);
                      }}
                      className="absolute top-4 right-4 bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-gray-100 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </div>
          <div className="w-full md:w-1/3 p-3">
            <JackpotGameResult />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-yellow-200 rounded-t-md p-3 shadow-inner border-t border-yellow-300 mx-2">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Total Amount:</span>
            <span className="text-lg font-bold text-blue-900">
              💎
              {(
                gridValues.flat().reduce((sum, val) => {
                  const num = parseFloat(val);
                  return sum + (isNaN(num) ? 0 : num);
                }, 0) * footerAmount
              ).toFixed(2)}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm">Barcode:</span>
            <input
              type="tel"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              maxLength={7}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
            />
          </div>
          <button
            onClick={handlePlaceBet}
            disabled={isLocked || timeLeft <= 15}
            className={`px-4 py-1.5 rounded text-white text-sm font-semibold ${
              isLocked || timeLeft <= 15
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Place Bet
          </button>
        </div>
      </footer>

      {/* Game Guide Modal */}
      <GameGuide isVisible={showGuide} onClose={() => setShowGuide(false)} />

      {/* Confirmation Message Component */}
      <ConfirmationMessage
        message={confirmationMessage}
        type={messageType}
        onClose={() => setConfirmationMessage("")}
      />
    </div>
  );
};

export default JackpotGame;
