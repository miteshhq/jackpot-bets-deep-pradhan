import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

// ✅ Add Claim Modal Component
const ClaimModal = ({
  bet,
  user,
  BACKEND_URL,
  onClose,
  onSuccess,
  userBalance,
}) => {
  const [bankName, setBankName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [step, setStep] = useState(1);

  const BANKS = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "YES Bank",
    "IDFC First Bank",
    "IndusInd Bank",
  ];

  const handleBankChange = (e) => {
    const val = e.target.value;
    setBankName(val);
    if (val.length >= 1) {
      const matches = BANKS.filter((b) =>
        b.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const chooseBank = (name) => {
    setBankName(name);
    setSuggestions([]);
  };

  const validateBank = () => {
    if (!bankName.trim()) return alert("Please enter your bank name");
    if (!/^\d{6,18}$/.test(accountNumber))
      return alert("Please enter a valid account number");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase()))
      return alert("Please enter a valid IFSC code");
    setStep(2);
  };

  const calculateWinAmount = () => {
    const stake = parseFloat(bet.stake);
    const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
    return stake * 2 * 80 * bonus;
  };

  const handleClaim = async () => {
    const winAmount = calculateWinAmount();
    const trimmedBankName = bankName.trim();
    const trimmedAccountNumber = accountNumber.trim();
    const trimmedIfsc = ifsc.trim().toUpperCase();

    if (!trimmedBankName) return alert("Please enter your bank name");
    if (!/^\d{6,18}$/.test(trimmedAccountNumber))
      return alert("Please enter a valid account number");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmedIfsc))
      return alert("Please enter a valid IFSC code");

    // ✅ Check if user has sufficient balance (in case they withdrew from main dashboard)
    if (winAmount > userBalance) {
      return alert(
        `❌ Insufficient balance! You have ₹${Number(userBalance).toFixed(
          2
        )} but trying to claim ₹${winAmount.toFixed(
          2
        )}. Please check if you've already withdrawn this amount.`
      );
    }

    try {
      const token = localStorage.getItem("token");

      // Submit withdrawal request using existing API
      await axios.post(
        `${BACKEND_URL}/api/wallet/withdrawal/request`,
        {
          userId: user.id,
          amount: winAmount,
          bankName: trimmedBankName,
          accountNumber: trimmedAccountNumber,
          ifscCode: trimmedIfsc,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update bet claimed status
      await axios.post(
        `${BACKEND_URL}/api/bets/claim-status`,
        {
          betId: bet.id,
          status: "claimed",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        `✅ Claim request submitted successfully for ₹${winAmount.toFixed(
          2
        )}! Admin will process the payout manually.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Claim request error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "❌ Error while submitting claim request"
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4 text-green-600">
          🏆 Claim Winnings
        </h2>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            💰 <strong>Win Amount:</strong> ₹{calculateWinAmount().toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Calculation: {bet.stake} × 2 × 80 × {bet.bonus || 1}x bonus
          </p>
        </div>

        {step === 1 ? (
          <div>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🏦 <strong>Process:</strong> Admin will manually transfer your
                winnings after verification.
              </p>
            </div>

            <div className="mb-3 relative">
              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Bank Name"
                value={bankName}
                onChange={handleBankChange}
              />
              {suggestions.length > 0 && (
                <ul className="absolute bg-white border rounded-lg w-full mt-1 max-h-40 overflow-auto z-20">
                  {suggestions.map((b) => (
                    <li
                      key={b}
                      className="px-3 py-1 hover:bg-green-100 cursor-pointer"
                      onClick={() => chooseBank(b)}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              className="w-full px-4 py-2 mb-3 border rounded-lg"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <input
              className="w-full px-4 py-2 mb-5 border rounded-lg"
              placeholder="IFSC Code"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
            />

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={validateBank}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Next ➡
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🏆 <strong>Bet Details:</strong>
              </p>
              <p className="text-xs text-blue-600">
                Barcode: {bet.barcode} | Number: {bet.number} | Status:{" "}
                {bet.status}
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                ⬅ Back
              </button>
              <button
                onClick={handleClaim}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                🚀 Submit Claim
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BetDetails = () => {
  const [bets, setBets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pending, setPending] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const BACK = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found in localStorage");
      setPending(false);
      return;
    }

    try {
      const decodedUser = jwtDecode(token);
    //   console.log("Decoded user:", decodedUser);
      setUser(decodedUser);
      fetchUserBets(decodedUser.id || decodedUser.userId);
      fetchUserBalance(decodedUser.id || decodedUser.userId);
    } catch (err) {
      console.error("Invalid token:", err);
      setPending(false);
    }
  }, []);

  const fetchUserBets = async (uid) => {
    setPending(true);
    try {
      const res = await axios.get(`${BACK}/api/bets/user/${uid}`);
    //   console.log("Fetched bets:", res.data);
      setBets(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setBets([]);
    } finally {
      setPending(false);
    }
  };

  const fetchUserBalance = async (uid) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BACK}/api/wallet/get-balance/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserBalance(res.data.balance);
    } catch (err) {
      console.error("Balance fetch error:", err);
      setUserBalance(0);
    }
  };

  useEffect(() => {
    let temp = [...bets];

    if (date) {
      temp = temp.filter((b) => {
        if (!b.placedAt) {
          console.warn("No placedAt on bet:", b);
          return false;
        }
        const betDate = new Date(b.placedAt);
        if (isNaN(betDate.getTime())) {
          console.warn("Invalid date for bet:", b);
          return false;
        }
        return betDate.toISOString().slice(0, 10) === date;
      });
    }

    if (barcodeSearch) {
      temp = temp.filter((b) => b.barcode && b.barcode.includes(barcodeSearch));
    }

    // console.log("Filtered bets:", temp);
    setFiltered(temp);
  }, [bets, date, barcodeSearch]);

  const handleCancel = async (bid) => {
    try {
      await axios.post(`${BACK}/api/report/cancel/${bid}`);
      alert("✅ Ticket cancelled");
      const user = jwtDecode(localStorage.getItem("token"));
      fetchUserBets(user.id || user.userId);
    } catch (e) {
      alert(e.response?.data?.msg || "Error");
    }
  };

  const handleClaim = (bet) => {
    if (bet.status !== "won") {
      alert("❌ Only winning bets can be claimed!");
      return;
    }
    if (bet.claimed === "claimed") {
      alert("✅ This bet has already been claimed!");
      return;
    }
    setSelectedBet(bet);
    setShowClaimModal(true);
  };

  const onClaimSuccess = () => {
    if (user) {
      fetchUserBets(user.id || user.userId);
      fetchUserBalance(user.id || user.userId);
    }
  };

  // ✅ FIXED: Convert 24-hour time to 12-hour format with AM/PM
  const formatTo12Hour = (time24) => {
    if (!time24) return "";

    const [hours, minutes] = time24.split(":");
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${ampm}`;
  };

  // ✅ FIXED: Add minutes and convert to 12-hour format
  const addMinutesToTime = (timeString, minutesToAdd) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0);

    const newHours = date.getHours();
    const newMinutes = date.getMinutes();
    const hour12 =
      newHours === 0 ? 12 : newHours > 12 ? newHours - 12 : newHours;
    const ampm = newHours >= 12 ? "PM" : "AM";

    return `${hour12}:${newMinutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const getWinCalculationString = (bet) => {
    const stake = parseFloat(bet.stake);
    const amount = stake * 2;
    const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;

    // console.log("🧮 Calculation for bet:", {
    //   stake,
    //   amount,
    //   bonus,
    //   status: bet.status,
    // });

    if (bet.status === "won") {
      const winAmount = amount * 80 * bonus;
      return `Win: ${stake} × 2 × 80 × ${bonus}x bonus = ₹${winAmount.toFixed(
        2
      )}`;
    } else if (bet.status === "lost") {
      return `Lost: No winnings (${bonus}x bonus was set)`;
    } else {
      return `Pending: Potential win = ${stake} × 2 × 80 × ${bonus}x = ₹${(
        amount *
        80 *
        bonus
      ).toFixed(2)}`;
    }
  };

  const getBonusDisplay = (bet) => {
    const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
    // console.log("🎁 Bonus for bet", bet.id, ":", bonus);
    return `${bonus}x`;
  };

  const getClaimStatusDisplay = (bet) => {
    if (bet.status !== "won") return null;

    const claimed = bet.claimed || "unclaimed";
    return (
      <span
        className={`px-2 py-1 rounded text-xs ${
          claimed === "claimed"
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800"
        }`}
      >
        {claimed}
      </span>
    );
  };

  // PDF Generation Function with detailed calculations (keeping existing functionality)
  const generatePDF = () => {
    if (filtered.length === 0) {
      alert("No bets to download!");
      return;
    }

    const pdf = new jsPDF();
    const token = localStorage.getItem("token");
    let agentID = "N/A";

    if (token) {
      try {
        const user = jwtDecode(token);
        agentID = user?.id || "N/A";
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    // PDF Header
    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text("BET DETAILS SLIP", 105, 20, { align: "center" });

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    pdf.text(`Agent ID: ${agentID}`, 20, 45);
    pdf.text(`Total Bets: ${filtered.length}`, 20, 55);

    if (barcodeSearch) {
      pdf.text(`Barcode Filter: ${barcodeSearch}`, 20, 65);
    }
    if (date) {
      pdf.text(`Date Filter: ${date}`, 120, 55);
    }

    // Calculate total amounts with bonus
    const totalStake = filtered.reduce(
      (sum, bet) => sum + parseFloat(bet.stake || 0),
      0
    );
    const totalAmount = totalStake * 2;
    const totalWinnings = filtered.reduce((sum, bet) => {
      const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
      return (
        sum +
        (bet.status === "won" ? parseFloat(bet.stake || 0) * 2 * 80 * bonus : 0)
      );
    }, 0);

    pdf.text(`Total Stake: ₹${totalStake.toFixed(2)}`, 120, 65);

    // Table Header
    let yPos = 85;
    pdf.setFont(undefined, "bold");
    pdf.text("#", 20, yPos);
    pdf.text("Barcode", 35, yPos);
    pdf.text("Draw Time", 70, yPos);
    pdf.text("Number", 105, yPos);
    pdf.text("Stake", 125, yPos);
    pdf.text("Amount", 145, yPos);
    pdf.text("Bonus", 162, yPos);
    pdf.text("Win", 175, yPos);
    pdf.text("Status", 190, yPos);

    // Draw line under header
    pdf.line(20, yPos + 2, 200, yPos + 2);

    // Table Content with calculation explanations
    pdf.setFont(undefined, "normal");
    filtered.forEach((bet, index) => {
      yPos += 12; // More space for calculation text

      // Check if we need a new page
      if (yPos > 265) {
        pdf.addPage();
        yPos = 30;
        // Redraw header on new page
        pdf.setFont(undefined, "bold");
        pdf.text("#", 20, yPos);
        pdf.text("Barcode", 35, yPos);
        pdf.text("Draw Time", 70, yPos);
        pdf.text("Number", 105, yPos);
        pdf.text("Stake", 125, yPos);
        pdf.text("Amount", 145, yPos);
        pdf.text("Bonus", 162, yPos);
        pdf.text("Win", 175, yPos);
        pdf.text("Status", 190, yPos);
        pdf.line(20, yPos + 2, 200, yPos + 2);
        yPos += 12;
        pdf.setFont(undefined, "normal");
      }

      const qty = parseFloat(bet.stake).toFixed(0);
      const amount = bet.stake * 2;
      const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
      const winAmount = bet.status === "won" ? amount * 80 * bonus : 0;

      pdf.text((index + 1).toString(), 20, yPos);
      pdf.text(bet.barcode || "", 35, yPos);
      pdf.text(addMinutesToTime(bet.roundTime, 0), 70, yPos);
      pdf.text(String(bet.number).padStart(2, "0"), 105, yPos);
      pdf.text(`₹${parseFloat(bet.stake).toFixed(2)}`, 125, yPos);
      pdf.text(`₹${amount.toFixed(2)}`, 145, yPos);
      pdf.text(`${bonus}x`, 162, yPos);
      pdf.text(`₹${winAmount.toFixed(0)}`, 175, yPos);
      pdf.text(bet.status || "", 190, yPos);

      // Add calculation explanation below each row
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100); // Gray color
      pdf.text(getWinCalculationString(bet), 20, yPos + 6);
      pdf.setTextColor(0, 0, 0); // Reset to black
      pdf.setFontSize(10);
    });

    // Footer Summary
    yPos += 20;
    if (yPos > 260) {
      pdf.addPage();
      yPos = 30;
    }

    pdf.line(20, yPos, 200, yPos);
    yPos += 10;
    pdf.setFont(undefined, "bold");
    pdf.text("SUMMARY", 20, yPos);
    yPos += 10;
    pdf.setFont(undefined, "normal");
    pdf.text(`Total Bets: ${filtered.length}`, 20, yPos);
    pdf.text(`Total Stake: ₹${totalStake.toFixed(2)}`, 20, yPos + 10);
    pdf.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 20, yPos + 20);
    pdf.text(`Total Winnings: ₹${totalWinnings.toFixed(2)}`, 20, yPos + 30);

    // Add calculation formula explanation
    yPos += 50;
    pdf.setFont(undefined, "bold");
    pdf.text("CALCULATION FORMULA:", 20, yPos);
    yPos += 8;
    pdf.setFont(undefined, "normal");
    pdf.text("Win Amount = Stake × 2 × 80 × Bonus Multiplier", 20, yPos);

    // Generate filename
    const filename = barcodeSearch
      ? `bet-details-${barcodeSearch}-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      : `bet-details-${date}-${new Date().toISOString().slice(0, 10)}.pdf`;

    // Download PDF
    pdf.save(filename);
  };

  // Download filtered bets by barcode (keeping existing functionality)
  const downloadBarcodeSlip = (barcode) => {
    const barcodeFiltered = bets.filter((b) => b.barcode === barcode);

    if (barcodeFiltered.length === 0) {
      alert("No bets found for this barcode!");
      return;
    }

    const pdf = new jsPDF();
    const token = localStorage.getItem("token");
    let agentID = "N/A";

    if (token) {
      try {
        const user = jwtDecode(token);
        agentID = user?.id || "N/A";
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    // Receipt Style PDF
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("JACKPOT BETTING SLIP", 105, 20, { align: "center" });

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");

    const firstBet = barcodeFiltered[0];
    const counterID = (52080000 + Math.floor(Math.random() * 1000)).toString();

    pdf.text(`Counter ID: ${counterID}`, 20, 40);
    pdf.text(`Barcode: ${barcode}`, 20, 50);
    pdf.text(`Agent ID: ${agentID}`, 20, 60);
    pdf.text(`Draw Time: ${addMinutesToTime(firstBet.roundTime, 0)}`, 20, 70);
    pdf.text(
      `Date: ${new Date(firstBet.placedAt).toLocaleDateString()}`,
      20,
      80
    );

    // Line separator
    pdf.line(20, 85, 190, 85);

    // Bet Details
    let yPos = 95;
    pdf.setFont(undefined, "bold");
    pdf.text("BET DETAILS:", 20, yPos);
    yPos += 10;

    pdf.setFont(undefined, "normal");
    barcodeFiltered.forEach((bet, index) => {
      const numberStr = String(bet.number).padStart(2, "0");
      const stakeStr = parseFloat(bet.stake).toFixed(0);
      const bonus = bet.bonus ? parseFloat(bet.bonus) : 1;
      pdf.text(
        `${numberStr} - ${stakeStr} (${bonus}x)`,
        20 + (index % 4) * 40,
        yPos
      );

      if ((index + 1) % 4 === 0) {
        yPos += 10;
      }
    });

    // Summary
    if (barcodeFiltered.length % 4 !== 0) {
      yPos += 10;
    }
    yPos += 10;

    pdf.line(20, yPos, 190, yPos);
    yPos += 10;

    const totalStake = barcodeFiltered.reduce(
      (sum, bet) => sum + parseFloat(bet.stake || 0),
      0
    );
    const totalAmount = totalStake * 2;

    pdf.text(`Qty: ${barcodeFiltered.length}`, 20, yPos);
    pdf.text(`Total Pts: ${totalAmount.toFixed(2)}`, 100, yPos);

    yPos += 10;
    pdf.setFontSize(8);
    pdf.text("Formula: Win = Stake × 2 × 80 × Bonus", 20, yPos);
    pdf.setFontSize(10);

    yPos += 20;
    pdf.setFont(undefined, "bold");
    pdf.text("*** GOOD LUCK ***", 105, yPos, { align: "center" });

    // Download
    pdf.save(`betting-slip-${barcode}.pdf`);
  };

  return (
    <div className="bg-yellow-100 min-h-screen p-4 text-sm">
      {/* 🔍 Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-bold">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={() => setDate(date)}
            className="border px-3 py-1 rounded bg-white"
          >
            View
          </button>
          <button
            onClick={() => {
              setBarcodeSearch("");
              setDate(new Date().toISOString().slice(0, 10));
            }}
            className="border px-3 py-1 rounded bg-white"
          >
            Unclaimed
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-bold">Barcode search:</label>
          <input
            type="text"
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            maxLength={7}
            className="border px-2 py-1 w-32 rounded"
            placeholder="Enter barcode"
          />
          <button
            onClick={() => setBarcodeSearch("")}
            className="border px-3 py-1 rounded bg-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 📊 Download Section */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={generatePDF}
            disabled={filtered.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📄 Download All Filtered ({filtered.length})
          </button>

          {barcodeSearch && (
            <button
              onClick={() => downloadBarcodeSlip(barcodeSearch)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🎫 Download Barcode Slip
            </button>
          )}

          <span className="text-sm text-gray-600 ml-2">
            💡 Use barcode search to download specific betting slips
          </span>
        </div>
      </div>

      {/* 💰 Balance Display */}
      <div className="mb-4 p-3 bg-purple-50 rounded-md border border-purple-200">
        <div className="text-sm text-purple-800">
          💎 <strong>Current Balance:</strong> ₹{Number(userBalance).toFixed(2)}
        </div>
      </div>

      {/* 💡 Calculation Info Box */}
      <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
        <h3 className="font-bold text-green-800 mb-2">
          📊 Win Calculation Formula:
        </h3>
        <p className="text-sm text-green-700 mb-1">
          <strong>Win Amount = Stake × 2 × 80 × Bonus Multiplier</strong>
        </p>
        <div className="text-xs text-green-600">
          <p>• Stake: Your bet amount</p>
          <p>• Multiplied by 2: Standard game rule</p>
          <p>• Multiplied by 80: Fixed payout ratio</p>
          <p>• Multiplied by Bonus: Decided by admin</p>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-full text-center border-collapse">
          <thead className="bg-yellow-200 text-xs md:text-sm">
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Barcode</th>
              <th className="border px-2 py-1">Draw Time</th>
              <th className="border px-2 py-1">Mrp</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Number</th>
              <th className="border px-2 py-1">Bonus</th>
              <th className="border px-2 py-1">Win</th>
              <th className="border px-2 py-1">Calculation</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Claim Status</th>
              <th className="border px-2 py-1">Claim</th>
              <th className="border px-2 py-1">Cancel</th>
              <th className="border px-2 py-1">Download</th>
            </tr>
          </thead>

          <tbody>
            {pending ? (
              <tr>
                <td colSpan="15" className="py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="15" className="py-4 text-gray-500">
                  No bets found.
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => {
                const qty = parseFloat(b.stake).toFixed(0);
                const amount = b.stake * 2;
                const bonus = b.bonus ? parseFloat(b.bonus) : 1;
                const winAmount = b.status === "won" ? amount * 80 * bonus : 0;

                // console.log("💰 Row calculation:", {
                //   betId: b.id,
                //   stake: b.stake,
                //   bonus: bonus,
                //   status: b.status,
                //   claimed: b.claimed,
                //   calculatedWin: winAmount,
                // });

                return (
                  <tr
                    key={b.id || i}
                    className="hover:bg-yellow-50 text-xs md:text-sm"
                  >
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{b.barcode}</td>
                    <td className="border px-2 py-1">
                      {addMinutesToTime(b.roundTime, 0)}
                    </td>
                    <td className="border px-2 py-1">2.00</td>
                    <td className="border px-2 py-1">{qty}</td>
                    <td className="border px-2 py-1">💎{amount.toFixed(2)}</td>
                    <td className="border px-2 py-1">
                      {String(b.number).padStart(2, "0")}
                    </td>
                    <td className="border px-2 py-1 text-purple-600 font-bold">
                      {getBonusDisplay(b)}
                    </td>
                    <td className="border px-2 py-1 text-green-700 font-bold">
                      💎{winAmount.toFixed(0)}
                    </td>
                    <td className="border px-1 py-1 text-xs text-gray-600 max-w-24">
                      <div
                        className="truncate"
                        title={getWinCalculationString(b)}
                      >
                        {getWinCalculationString(b)}
                      </div>
                    </td>
                    <td className="border px-2 py-1 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          b.status === "won"
                            ? "bg-green-100 text-green-800"
                            : b.status === "lost"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="border px-2 py-1">
                      {getClaimStatusDisplay(b)}
                    </td>
                    <td className="border px-2 py-1">
                      {b.status === "won" &&
                        (b.claimed || "unclaimed") === "unclaimed" && (
                          <button
                            onClick={() => handleClaim(b)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            title={`Claim winnings: ₹${winAmount.toFixed(0)}`}
                          >
                            🏆 Claim
                          </button>
                        )}
                      {b.status === "won" &&
                        (b.claimed || "unclaimed") === "claimed" && (
                          <span className="text-xs text-green-600">
                            ✅ Claimed
                          </span>
                        )}
                    </td>
                    <td className="border px-2 py-1">
                      {b.status === "pending" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        onClick={() => downloadBarcodeSlip(b.barcode)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        title={`Download slip for barcode ${b.barcode}`}
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🔘 Bottom Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Re-Print
        </button>
        <button
          onClick={() => alert("Cancel Claim not implemented yet")}
          className="px-4 py-2 bg-blue-700 text-white rounded"
        >
          Tkt. Cancel
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-black rounded"
        >
          Refresh from server
        </button>
        <button
          onClick={() => navigate("/game")}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Cancel
        </button>
      </div>

      {/* ✅ Claim Modal */}
      {showClaimModal && selectedBet && user && (
        <ClaimModal
          bet={selectedBet}
          user={user}
          BACKEND_URL={BACK}
          onClose={() => {
            setShowClaimModal(false);
            setSelectedBet(null);
          }}
          onSuccess={onClaimSuccess}
          userBalance={userBalance}
        />
      )}
    </div>
  );
};

export default BetDetails;
