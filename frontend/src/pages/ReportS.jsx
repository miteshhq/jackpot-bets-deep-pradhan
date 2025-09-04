import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ReportS = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState(null);
  const [withdrawals, setWithdrawals] = useState(0);
  const [cancelledAmount, setCancelledAmount] = useState(0);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate(); // ✅ useNavigate instead of window.location.href

  const fetchReport = async () => {
    if (!fromDate || !toDate) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/report/sales`, {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch report", err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/report/transactions/total-withdrawals`);
      setWithdrawals(res.data.totalWithdrawn || 0);
    } catch (err) {
      console.error("❌ Failed to fetch withdrawals", err);
    }
  };

  const fetchCancelledAmount = async () => {
    if (!fromDate || !toDate) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/report/cancelled-amount`, {
        params: { from: fromDate, to: toDate },
      });
      setCancelledAmount(res.data.totalCancelledAmount || 0);
    } catch (err) {
      console.error("❌ Failed to fetch cancelled amount", err);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    fetchCancelledAmount();
  }, [fromDate, toDate]);

  const handleCancel = () => {
    navigate("/game"); // ✅ React Router navigation to /game
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* 🔍 Date Filters */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-yellow-300 hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-yellow-700 mb-6 text-center drop-shadow-sm">
            📅 Select Report Date
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {/* From Date */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-yellow-800 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-yellow-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
              />
            </div>

            {/* To Date */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-yellow-800 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-yellow-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col justify-end gap-3">
              <button
                onClick={handleCancel}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md transition shadow-md"
              >
                ❌ Cancel
              </button>
              <button
                onClick={() => {
                  fetchReport();
                  fetchCancelledAmount();
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-md transition shadow-md"
              >
                📊 Get Report
              </button>
            </div>
          </div>
        </div>

        {/* 📄 Report Display */}
        {report && (
          <div className="bg-green-700 p-6 rounded-xl shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-800 to-green-900 opacity-80 rounded-xl"></div>

            <div className="relative z-10 text-center mb-6">
              <h3 className="text-3xl font-bold">🎰 JACKPOT REPORT</h3>
              <p className="text-sm font-mono opacity-90">
                AGENT ID: {report?.agentId || "52080007"}
              </p>
              <p className="text-sm font-mono opacity-90">
                DATE: {fromDate} → {toDate}
              </p>
            </div>

            <div className="relative z-10 border-t border-green-400 pt-4 text-sm font-mono space-y-2 px-4">
              <p><strong>Gross Sales Amount :</strong> ₹{report?.total_sell_amount || 0}</p>
              <p><strong>Cancelled Amount :</strong> ₹{cancelledAmount}</p>
              <p><strong>Net Sales Amount :</strong> ₹{report?.net_sales || (report?.total_sell_amount - cancelledAmount)}</p>
              <p><strong>Payout Amount :</strong> ₹{withdrawals || 0}</p>
              <p><strong>Operator Balance :</strong> ₹{report?.operator_balance || 16}</p>
              <p><strong>Retailer Discount :</strong> ₹{report?.retailer_discount || 152.16}</p>
              <p><strong>Unclaimed Amount :</strong> ₹{report?.unclaimed_amount || 0}</p>
              <p><strong>Payout Incentive :</strong> ₹{report?.payout_incentive || 0}</p>

              <hr className="my-3 border-green-300" />

              <p className="text-lg font-semibold text-yellow-300">
                💰 Total Profit : ₹{report?.profit || 152.16}
              </p>
              <p className="text-lg font-semibold text-red-300">
                📉 Net to Pay : ₹{report?.net_to_pay || -136.16}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportS;














