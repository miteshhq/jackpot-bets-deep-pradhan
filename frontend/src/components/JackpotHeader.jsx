import React, { useState, useEffect, useRef } from "react";
import jackpotLogo from "../assets/Jkpt1.png";
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
      <div className="bg-gradient-to-b from-blue-300 to-blue-500 text-black font-medium px-3 py-2">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col space-y-3">
          {/* Logo and Agent */}
          <div className="flex justify-between items-center">
            <img
              src={jackpotLogo}
              alt="Jackpot"
              className="h-12 object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(21%) sepia(99%) saturate(7481%) hue-rotate(1deg) brightness(101%) contrast(126%)",
              }}
            />
            <div className="text-right flex items-center gap-2 bg-blue-50 rounded-lg p-1 px-2">
              <div className="text-xs">Agent:</div>
              <div className="text-lg font-bold">{user?.id || "N/A"}</div>
            </div>
          </div>

          {/* Main Info Row */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Timer - Most Important */}
            <div className="col-span-2 bg-white/90 rounded-lg p-2">
              <div className="text-xs text-gray-600">Time Left</div>
              <div className={`text-xl font-bold ${getTimerColor()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Balance */}
            <div className="bg-yellow-100 rounded-lg p-2">
              <div className="text-xs text-gray-600">Balance</div>
              <div className="text-sm font-bold text-green-700">
                💎{Number(balance).toFixed(2)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-pink-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Time */}
          <div className="text-center text-sm">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Timer */}
          <div className="bg-white/90 p-3 rounded-lg">
            <span className="text-sm mr-2">Time Left:</span>
            <span className={`text-2xl font-bold ${getTimerColor()}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Logo */}
          <img
            src={jackpotLogo}
            alt="Jackpot"
            className="h-24 object-contain"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(21%) sepia(99%) saturate(7481%) hue-rotate(1deg) brightness(101%) contrast(126%)",
            }}
          />

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Agent ID */}
            <div className="text-right flex items-center gap-2 bg-blue-50 rounded-lg p-2 px-4">
              <div className="text-sm">Agent ID:</div>
              <div className="text-lg font-bold">{user?.id || "N/A"}</div>
            </div>

            {/* Time */}
            <div className="text-lg font-medium">
              {new Date().toLocaleTimeString()}
            </div>

            {/* Dr. Time */}
            <div className="flex items-center">
              <label htmlFor="drTime" className="mr-2 text-sm">
                Dr. Time:
              </label>
              <select
                id="drTime"
                className="text-sm px-2 py-1 border rounded bg-white"
              >
                <option value="">--</option>
              </select>
            </div>

            {/* Balance & Actions */}
            <div className="flex items-center space-x-4 bg-white/90 rounded-lg p-3">
              <div className="text-right">
                <div className="text-sm">Balance</div>
                <div className="text-lg font-bold text-green-700">
                  💎{Number(balance).toFixed(2)}
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded font-medium"
              >
                Withdraw
              </button>
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
