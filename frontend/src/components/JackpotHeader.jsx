import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import Withdraw from "../pages/Withdraw";
import ReferelLink from "../pages/ReferelLink";

const JackpotHeader = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [balance, setBalance] = useState(0.0);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);

  const [timeLeft, setTimeLeft] = useState(300);
  const [showModal, setShowModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [changes, setChanges] = useState(true);

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL);
    socketRef.current.on("timer-update", (serverTime) =>
      setTimeLeft(serverTime)
    );
    return () => socketRef.current.disconnect();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/wallet/get-balance/${user.id}`
      );
      const numericBalance = parseFloat(data.balance) || 0;
      setBalance(numericBalance);
    } catch (err) {
      console.error("❌ Error fetching balance:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
    if (localStorage.getItem("showWelcomeBonus") === "true") {
      setShowWelcomeAlert(true);
      localStorage.removeItem("showWelcomeBonus");
      setTimeout(() => setShowWelcomeAlert(false), 5000);
    }
  }, [user?.id, changes]);

  const handleDepositRequest = async (amountToUse) => {
    const amount = Number(amountToUse || customAmount);
    if (!amount || amount < 1) return alert("Enter a valid amount");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/wallet/deposit/request`,
        {
          userId: user.id,
          amount,
          phoneNumber: user.phone || "N/A",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(
        "✅ Deposit request submitted! Admin will contact you on WhatsApp for payment verification."
      );
      setShowModal(false);
      setSelectedAmount(null);
      setCustomAmount("");
    } catch (err) {
      console.error("❌ Deposit request error:", err);
      alert(
        err.response?.data?.message ||
          "Something went wrong while creating deposit request"
      );
    }
  };

  // Simple timer color
  const getTimerColor = () => {
    if (timeLeft <= 30) return "text-red-600";
    if (timeLeft <= 60) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <>
      <div className="bg-gradient-to-b from-blue-300 to-blue-500 text-black font-medium px-3 py-3">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col space-y-4">
          {/* Centered Jackpot Title */}
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-red-600 drop-shadow-lg tracking-wider">
              JACKPOT
            </h1>
          </div>

          {/* Agent and Current Time Row */}
          <div className="flex justify-between items-center">
            <div className="text-left flex items-center gap-2 bg-blue-50 rounded-lg p-2 px-3">
              <div className="text-sm font-medium">Agent:</div>
              <div className="text-xl font-bold text-blue-700">
                {user?.id || "N/A"}
              </div>
            </div>

            <div className="text-right bg-white/90 rounded-lg p-2 px-3">
              <div className="text-sm text-gray-600">Current Time</div>
              <div className="text-lg font-bold text-blue-700">
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>

          {/* Timer - Large and Prominent */}
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-lg border-4 border-yellow-400">
            <div className="text-sm text-gray-600 mb-1">⏰ Next Draw In</div>
            <div
              className={`text-4xl sm:text-5xl font-black ${getTimerColor()} drop-shadow-md`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Balance and Actions Row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Balance */}
            <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg p-3 border-2 border-yellow-300">
              <div className="text-xs text-gray-600">💰 Balance</div>
              <div className="text-lg font-bold text-green-700">
                💎{Number(balance).toFixed(2)}
              </div>
            </div>

            {/* Deposit Button */}
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white p-3 rounded-lg font-bold text-sm shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              💸 Deposit
            </button>

            {/* Withdraw Button */}
            <button
              onClick={() => setShowPayoutModal(true)}
              className="bg-gradient-to-b from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white p-3 rounded-lg font-bold text-sm shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              💰 Withdraw
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Left Section - Timer */}
          <div className="bg-white/95 p-4 rounded-xl shadow-lg border-4 border-yellow-400">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">⏰ Next Draw In</div>
              <div
                className={`text-3xl font-black ${getTimerColor()} drop-shadow-md`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Center Section - Jackpot Title */}
          <div className="text-center flex-1">
            <h1 className="text-6xl lg:text-7xl font-black text-red-600 drop-shadow-lg tracking-wider">
              JACKPOT
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Agent ID */}
            <div className="text-center flex flex-col items-center gap-1 bg-blue-50 rounded-lg p-3 px-4">
              <div className="text-sm font-medium">Agent ID</div>
              <div className="text-xl font-bold text-blue-700">
                {user?.id || "N/A"}
              </div>
            </div>

            {/* Current Time */}
            <div className="text-center bg-white/90 rounded-lg p-3 px-4">
              <div className="text-sm text-gray-600">Current Time</div>
              <div className="text-xl font-bold text-blue-700">
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            {/* Dr. Time Dropdown */}
            <div className="flex flex-col items-center bg-white/90 rounded-lg p-3">
              <label htmlFor="drTime" className="text-sm text-gray-600 mb-1">
                Dr. Time
              </label>
              <select
                id="drTime"
                className="text-sm px-3 py-1 border rounded bg-white font-medium"
              >
                <option value="">--</option>
              </select>
            </div>

            {/* Balance & Actions */}
            <div className="flex items-center space-x-4 bg-white/95 rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600">💰 Balance</div>
                <div className="text-xl font-bold text-green-700">
                  💎{Number(balance).toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  💸 Deposit
                </button>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  💰 Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Deposit Modal */}
      {showModal && (
        <div className="fixed z-50 inset-0 flex justify-center items-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold text-center mb-4">
              💸 Request Deposit
            </h2>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📱 Admin will contact you on WhatsApp for UPI payment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[10, 50, 100, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-2 text-sm font-medium rounded ${
                    selectedAmount === amt
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  💎{amt}
                </button>
              ))}
            </div>

            <input
              type="tel"
              placeholder="Custom amount"
              className="w-full px-3 py-2 border rounded mb-4 text-center"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDepositRequest(selectedAmount || customAmount)
                }
                className="flex-1 bg-green-500 text-white py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Welcome Alert */}
      {showWelcomeAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded z-50">
          🎉 💎20 Welcome Bonus added!
        </div>
      )}

      {showPayoutModal && (
        <Withdraw
          user={user}
          BACKEND_URL={BACKEND_URL}
          userBalance={balance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => setChanges(!changes)}
        />
      )}

      <ReferelLink />
    </>
  );
};

export default JackpotHeader;
