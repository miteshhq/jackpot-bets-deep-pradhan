import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminManualResultSetterWithSummary = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [number, setNumber] = useState('');
  const [bonus, setBonus] = useState(1);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);

  const [betsSummary, setBetsSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch bet summary initially and every 5 seconds
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/bets/summary`);
        setBetsSummary(res.data || {});
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bets summary:', err);
        setLoading(false);
      }
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  // Calculate min, max, and total
  const values = Object.values(betsSummary).map((v) => parseFloat(v));
  const nonZeroValues = values.filter((v) => v > 0);
  const maxVal = values.length ? Math.max(...values) : 0;
  const minVal = nonZeroValues.length ? Math.min(...nonZeroValues) : 0;
  const totalAmount = values.reduce((acc, v) => acc + v, 0);

  const submitManualResult = async () => {
    setMsg('');
    setError(false);

    const num = parseInt(number, 10);
    const bon = parseInt(bonus, 10);

    if (isNaN(num) || num < 0 || num > 99) {
      setMsg('❌ Result number must be between 0 and 99');
      setError(true);
      return;
    }

    if (isNaN(bon) || bon < 1 || bon > 99) {
      setMsg('❌ Bonus multiplier must be between 1 and 99');
      setError(true);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/results/set-manual-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num, bonus: bon }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.msg || '✅ Result submitted successfully');
        setError(false);
      } else {
        setMsg(data.msg || '❌ Failed to submit result');
        setError(true);
      }
    } catch (e) {
      setMsg('❌ Server error while submitting result');
      setError(true);
    }
  };

  const handleNumberChange = (e) => {
    const val = e.target.value;
    if (val === '' || (/^\d{1,2}$/.test(val) && parseInt(val, 10) <= 99)) {
      setNumber(val);
    }
  };

  const handleBonusChange = (e) => {
    const val = e.target.value;
    if (val === '' || (/^\d{1,2}$/.test(val) && parseInt(val, 10) <= 99)) {
      setBonus(val);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Manual Result Setter */}
      <div className="max-w-lg mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        <h3 className="text-2xl font-bold text-blue-700 mb-4 text-center">🛠️ Set the Result</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Result Number</label>
            <input
              type="number"
              min="0"
              max="99"
              value={number}
              onChange={handleNumberChange}
              className="w-full border rounded px-4 py-2"
              placeholder="0–99"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Bonus Multiplier</label>
            <input
              type="number"
              min="1"
              max="99"
              value={bonus}
              onChange={handleBonusChange}
              className="w-full border rounded px-4 py-2"
              placeholder="1–99"
            />
          </div>
        </div>
        <button
          onClick={submitManualResult}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🚀 Submit
        </button>
        {msg && (
          <p className={`mt-4 text-center ${error ? 'text-red-600' : 'text-green-600'}`}>
            {msg}
          </p>
        )}
      </div>

      {/* Bets Summary Grid */}
      <div className="max-w-5xl mx-auto">
        <h4 className="text-xl font-semibold mb-2 text-center">
          Bet Summary for Current Round (updates every 5s)
        </h4>
        
        {/* ✅ Total Amount Section */}
        <p className="text-center text-lg font-bold mb-4">
          💰 Total Bet Amount: <span className="text-blue-700">{totalAmount.toFixed(2) * 2}</span>
        </p>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 gap-2">
            {Array.from({ length: 100 }, (_, i) => {
              const val = betsSummary[i] || 0;
              const isMax = val === maxVal && maxVal > 0;
              const isMin = val === minVal && val > 0;
              const hasAmount = val > 0;

              let bgColor = 'bg-gray-100';
              if (hasAmount) bgColor = 'bg-yellow-200';
              if (isMin) bgColor = 'bg-green-300';
              if (isMax) bgColor = 'bg-red-300';

              return (
                <div
                  key={i}
                  className={`border rounded p-2 text-center text-sm sm:text-base ${bgColor}`}
                >
                  <div className="font-bold">{String(i).padStart(2, "0")}</div>
                  <div>{val}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManualResultSetterWithSummary;
