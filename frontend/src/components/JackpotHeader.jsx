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

  return (
    <>
      <div className="bg-gradient-to-b from-blue-300 to-blue-500 text-black font-semibold text-sm px-2 md:px-4">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col ">
          <div className="flex justify-center items-center">
            <img
              src={jackpotLogo}
              alt="Jackpot"
              className="object-contain flex-1 "
              style={{
                height: "60px",
                width: "auto",
                filter:
                  "brightness(0) saturate(100%) invert(21%) sepia(99%) saturate(7481%) hue-rotate(1deg) brightness(101%) contrast(126%)",
              }}
            />
            <span className="font-semibold whitespace-nowrap">
              Agent: {user?.id || "N/A"}
            </span>
          </div>

          {/* Evenly spaced row */}
          <div className="grid grid-cols-4  w-full items-center text-[11px] px-1 text-center">
            <p className="font-semibold whitespace-nowrap">
              Time Left : {formatTime(timeLeft)}
            </p>
            <p className="font-semibold whitespace-nowrap">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="font-semibold whitespace-nowrap">
              ₹{Number(balance).toFixed(2)}
            </p>
            <div className="flex flex-col w-full  ">
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-2  py-0.5 rounded text-[10px]"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white  px-2 py-0.5 rounded text-[10px]"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-black font-bold">Time Left :</span>
            <span className="text-black text-lg font-mono">
              {formatTime(timeLeft)}
            </span>
          </div>
          <img
            src={jackpotLogo}
            alt="Jackpot"
            className="h-10 md:h-14 object-contain scale-300 max-h-14"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(21%) sepia(99%) saturate(7481%) hue-rotate(1deg) brightness(101%) contrast(126%)",
            }}
          />
          <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-1 md:space-y-0 text-xs md:text-sm">
            <span>
              Agent ID : <span className="font-bold">{user?.id || "N/A"}</span>
            </span>
            <span className="font-bold text-black text-base md:text-lg">
              {new Date().toLocaleTimeString()}
            </span>
            <div className="hidden md:flex items-center">
              <label htmlFor="drTime" className="mr-1">
                Dr. Time :
              </label>
              <select
                id="drTime"
                className="text-sm px-1 py-0.5 border rounded"
              >
                <option value="">--</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 border-l border-black pl-4">
              <span className="font-bold text-black">
                Balance: ₹{Number(balance).toFixed(2)}
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1 rounded"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Request Modal */}
      {showModal && (
        <div className="fixed z-50 inset-0 flex justify-center items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl border border-purple-300 relative">
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-600">
              💸 Request Deposit
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📱 <strong>Process:</strong> Admin will contact you on WhatsApp
                for UPI payment after you submit this request.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[10, 50, 100, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-full py-2 text-sm font-semibold transition-all duration-200 shadow-sm hover:scale-105
                  ${
                    selectedAmount === amt
                      ? "bg-gradient-to-r from-green-400 to-green-600 text-white ring-2 ring-green-500"
                      : "bg-gradient-to-r from-indigo-400 to-indigo-600 text-white hover:ring-2 hover:ring-indigo-300"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Or enter custom amount"
              className="w-full px-4 py-2 text-center text-sm border rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDepositRequest(selectedAmount || customAmount)
                }
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcomeAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          🎉 ₹20 Welcome Bonus added to your wallet!
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
