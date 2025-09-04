import React, { useState } from 'react';
import axios from 'axios';

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
    "IndusInd Bank"
];

const Withdraw = ({ user, BACKEND_URL, onClose, onSuccess, userBalance }) => {
    const [bankName, setBankName] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState(1);

    const handleBankChange = (e) => {
        const val = e.target.value;
        setBankName(val);
        if (val.length >= 1) {
            const matches = BANKS.filter(b =>
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
        if (!/^\d{6,18}$/.test(accountNumber)) return alert("Please enter a valid account number");
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) return alert("Please enter a valid IFSC code");
        setStep(2);
    };
const handleSubmit = async () => {
  const numAmount = Number(amount);
  const trimmedBankName = bankName.trim();
  const trimmedAccountNumber = accountNumber.trim();
  const trimmedIfsc = ifsc.trim().toUpperCase();

  if (!trimmedBankName) return alert("Please enter your bank name");
  if (!/^\d{6,18}$/.test(trimmedAccountNumber)) return alert("Please enter a valid account number");
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmedIfsc)) return alert("Please enter a valid IFSC code");
  if (!numAmount || numAmount < 1) return alert("Please enter a valid amount");
  if (numAmount > userBalance) return alert("You cannot withdraw more than your available balance");

  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `${BACKEND_URL}/api/payout/request`,
      {
        userId: user.id,
        amount: numAmount,
        bankName: trimmedBankName,
        accountNumber: trimmedAccountNumber,
         ifscCode: ifsc 
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert("✅ Payout request submitted successfully");
    onSuccess();
    onClose();
  } catch (err) {
    console.error("Payout request error:", err.response?.data || err.message);
    alert(err.response?.data?.error || "❌ Error while submitting payout request");
  }
  console.log({
  userId: user.id,
  amount: numAmount,
  bankName: trimmedBankName,
  accountNumber: trimmedAccountNumber,
  ifsc: ifsc
});

};




    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-4 text-pink-600">
                    🧾 Request Payout
                </h2>

                {step === 1 ? (
                    <div>
                        <div className="mb-3 relative">
                            <input
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Bank Name"
                                value={bankName}
                                onChange={handleBankChange}
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute bg-white border rounded-lg w-full mt-1 max-h-40 overflow-auto z-20">
                                    {suggestions.map(b => (
                                        <li
                                            key={b}
                                            className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
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
                            onChange={e => setAccountNumber(e.target.value)}
                        />
                        <input
                            className="w-full px-4 py-2 mb-5 border rounded-lg"
                            placeholder="IFSC Code"
                            value={ifsc}
                            onChange={e => setIfsc(e.target.value)}
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
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                                Next ➡
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 text-sm mb-2">Available Balance: ₹{Number(userBalance).toFixed(2)}</p>
                        <input
                            className="w-full px-4 py-2 mb-5 border rounded-lg text-center"
                            type="number"
                            placeholder="Enter payout amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep(1)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                            >
                                ⬅ Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg"
                            >
                                🚀 Submit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Withdraw;


