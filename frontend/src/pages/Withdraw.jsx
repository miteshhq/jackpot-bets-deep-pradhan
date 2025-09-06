import React, { useState } from "react";
import axios from "axios";

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

const Withdraw = ({ user, BACKEND_URL, onClose, onSuccess, userBalance }) => {
  const [bankName, setBankName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);

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

  // ✅ Fixed validation and submission logic
  const validateAndProceed = () => {
    const hasBankDetails =
      bankName.trim() && accountNumber.trim() && ifsc.trim();
    const hasUpiId = upiId.trim();

    if (!hasBankDetails && !hasUpiId) {
      return alert(
        "Please provide either complete bank details (Bank Name, Account Number, IFSC) OR UPI ID"
      );
    }

    // Validate bank details if provided
    if (hasBankDetails) {
      if (!/^\d{6,18}$/.test(accountNumber.trim())) {
        return alert("Please enter a valid account number (6-18 digits)");
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim())) {
        return alert("Please enter a valid IFSC code (e.g., SBIN0001234)");
      }
    }

    // ✅ FIXED: More flexible UPI validation
    if (hasUpiId && !/^[\w\.-]+@[\w]+$/i.test(upiId.trim())) {
      return alert(
        "Please enter a valid UPI ID (e.g., user@paytm, 9876543210@ybl)"
      );
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (loading) return;

    const numAmount = Number(amount);

    if (!numAmount || numAmount < 1) {
      return alert("Please enter a valid amount (minimum ₹1)");
    }
    if (numAmount > userBalance) {
      return alert(
        `You cannot withdraw more than your available balance of ₹${Number(
          userBalance
        ).toFixed(2)}`
      );
    }

    const hasBankDetails =
      bankName.trim() && accountNumber.trim() && ifsc.trim();
    const hasUpiId = upiId.trim();

    if (!hasBankDetails && !hasUpiId) {
      return alert("Please provide either bank details OR UPI ID");
    }

    // Final validation before submission
    if (hasBankDetails) {
      if (!/^\d{6,18}$/.test(accountNumber.trim())) {
        return alert("Please enter a valid account number (6-18 digits)");
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim())) {
        return alert("Please enter a valid IFSC code");
      }
    }

    if (hasUpiId && !/^[\w\.-]+@[\w]+$/i.test(upiId.trim())) {
      return alert("Please enter a valid UPI ID");
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // ✅ FIXED: Properly handle optional fields
      const payload = {
        userId: user.id || user.userId,
        amount: numAmount,
      };

      // Only add fields if they have values
      if (bankName.trim()) payload.bankName = bankName.trim();
      if (accountNumber.trim()) payload.accountNumber = accountNumber.trim();
      if (ifsc.trim()) payload.ifscCode = ifsc.trim().toUpperCase();
      if (upiId.trim()) payload.upiId = upiId.trim();

      await axios.post(
        `${BACKEND_URL}/api/wallet/withdrawal/request`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        "✅ Withdrawal request submitted successfully! Admin will process it manually and transfer money to your account."
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        "Withdrawal request error:",
        err.response?.data || err.message
      );
      alert(
        err.response?.data?.message ||
          "❌ Error while submitting withdrawal request"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBankName("");
    setSuggestions([]);
    setAccountNumber("");
    setIfsc("");
    setAmount("");
    setUpiId("");
    setStep(1);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-4 text-pink-600">
          🧾 Request Withdrawal
        </h2>

        {step === 1 ? (
          <div>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🏦 <strong>Process:</strong> Admin will manually transfer money
                to your account after verification. You can provide bank
                details, UPI ID, or both.
              </p>
            </div>

            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                💎 <strong>Available Balance:</strong> ₹
                {Number(userBalance).toFixed(2)}
              </p>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold mb-2">
                Payment Methods:
              </p>
              <p className="text-xs text-blue-700">
                • Provide bank details for bank transfer
                <br />
                • Provide UPI ID for UPI transfer
                <br />• You can provide both for flexibility
              </p>
            </div>

            {/* Bank Details Section */}
            <div className="mb-4 p-3 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">
                🏦 Bank Transfer Details (Optional)
              </h3>

              <div className="mb-3 relative">
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Bank Name (optional)"
                  value={bankName}
                  onChange={handleBankChange}
                  disabled={loading}
                />
                {suggestions.length > 0 && (
                  <ul className="absolute bg-white border rounded-lg w-full mt-1 max-h-40 overflow-auto z-20">
                    {suggestions.map((b) => (
                      <li
                        key={b}
                        className="px-3 py-1 hover:bg-blue-100 cursor-pointer text-sm"
                        onClick={() => chooseBank(b)}
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                className="w-full px-4 py-2 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Account Number (6-18 digits, optional)"
                value={accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Only numbers
                  if (val.length <= 18) {
                    setAccountNumber(val);
                  }
                }}
                disabled={loading}
                maxLength={18}
              />

              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="IFSC Code (e.g., SBIN0001234, optional)"
                value={ifsc}
                onChange={(e) => {
                  const val = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  if (val.length <= 11) {
                    setIfsc(val);
                  }
                }}
                disabled={loading}
                maxLength={11}
              />
            </div>

            {/* UPI Section */}
            <div className="mb-5 p-3 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">
                📱 UPI Details (Optional)
              </h3>
              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="UPI ID (e.g., user@paytm, 9876543210@ybl) - optional"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-600 mt-1">
                Common UPI handles: @paytm, @ybl, @oksbi, @okhdfcbank, @okaxis
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleClose}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={validateAndProceed}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Processing..." : "Next ➡"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                📋 Withdrawal Summary:
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                {bankName && (
                  <p>
                    <strong>Bank:</strong> {bankName}
                  </p>
                )}
                {accountNumber && (
                  <p>
                    <strong>Account:</strong> {accountNumber}
                  </p>
                )}
                {ifsc && (
                  <p>
                    <strong>IFSC:</strong> {ifsc}
                  </p>
                )}
                {upiId && (
                  <p>
                    <strong>UPI ID:</strong> {upiId}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                💎 <strong>Available Balance:</strong> ₹
                {Number(userBalance).toFixed(2)}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Withdrawal Amount (₹):
              </label>
              <input
                className="w-full px-4 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-pink-400"
                type="number"
                placeholder="Enter withdrawal amount"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    val === "" ||
                    (Number(val) >= 0 && Number(val) <= userBalance)
                  ) {
                    setAmount(val);
                  }
                }}
                disabled={loading}
                min="1"
                max={userBalance}
              />
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => setAmount("100")}
                  disabled={loading || userBalance < 100}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                >
                  ₹100
                </button>
                <button
                  onClick={() => setAmount("500")}
                  disabled={loading || userBalance < 500}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                >
                  ₹500
                </button>
                <button
                  onClick={() => setAmount("1000")}
                  disabled={loading || userBalance < 1000}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                >
                  ₹1000
                </button>
                <button
                  onClick={() => setAmount(userBalance.toString())}
                  disabled={loading || userBalance <= 0}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                >
                  All
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Note:</strong> This amount will be processed manually
                by admin. Please ensure your payment details are correct.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                ⬅ Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !amount || Number(amount) < 1}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <span>🚀 Submit Request</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
