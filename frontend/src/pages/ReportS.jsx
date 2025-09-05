import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ReportS = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState({
    sales: null,
    deposits: null,
    withdrawals: null,
    dailyStats: null,
    profitLoss: null,
    userStats: null,
    betsSummary: null,
  });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("today");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  // Initialize dates based on filter
  const initializeDates = (filter) => {
    const today = new Date();
    let from, to;

    switch (filter) {
      case "today":
        from = to = today.toISOString().slice(0, 10);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        from = to = yesterday.toISOString().slice(0, 10);
        break;
      case "this_week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        from = weekStart.toISOString().slice(0, 10);
        to = today.toISOString().slice(0, 10);
        break;
      case "this_month":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        to = today.toISOString().slice(0, 10);
        break;
      case "last_month":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        from = lastMonth.toISOString().slice(0, 10);
        to = lastMonthEnd.toISOString().slice(0, 10);
        break;
      default:
        from = to = today.toISOString().slice(0, 10);
    }

    setFromDate(from);
    setToDate(to);
    return { from, to };
  };

  const fetchAllReports = async (from, to) => {
    if (!from || !to) return;

    setLoading(true);
    try {
      const [
        salesRes,
        depositsRes,
        withdrawalsRes,
        dailyStatsRes,
        profitLossRes,
        userStatsRes,
        betsSummaryRes,
      ] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/report/sales`, { params: { from, to } }),
        axios.get(`${BACKEND_URL}/api/report/deposits`, {
          params: { from, to },
        }),
        axios.get(`${BACKEND_URL}/api/report/withdrawals`, {
          params: { from, to },
        }),
        axios.get(`${BACKEND_URL}/api/report/daily-stats`, {
          params: { from, to },
        }),
        axios.get(`${BACKEND_URL}/api/report/profit-loss`, {
          params: { from, to },
        }),
        axios.get(`${BACKEND_URL}/api/report/user-stats`, {
          params: { from, to },
        }),
        axios.get(`${BACKEND_URL}/api/report/bets-summary`, {
          params: { from, to },
        }),
      ]);

      setReportData({
        sales: salesRes.data,
        deposits: depositsRes.data,
        withdrawals: withdrawalsRes.data,
        dailyStats: dailyStatsRes.data,
        profitLoss: profitLossRes.data,
        userStats: userStatsRes.data,
        betsSummary: betsSummaryRes.data,
      });
    } catch (err) {
      console.error("❌ Failed to fetch reports", err);
    }
    setLoading(false);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    const { from, to } = initializeDates(filter);
    fetchAllReports(from, to);
  };

  const handleCustomDateSubmit = () => {
    if (fromDate && toDate) {
      setActiveFilter("custom");
      fetchAllReports(fromDate, toDate);
    }
  };

  useEffect(() => {
    // Load today's data by default
    handleFilterChange("today");
  }, []);

  const formatCurrency = (amount) =>
    `💎${parseFloat(amount || 0).toLocaleString()}`;
  const formatPercentage = (value) => `${parseFloat(value || 0).toFixed(2)}%`;

  const QuickFilterButtons = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {[
        { key: "today", label: "📅 Today" },
        { key: "yesterday", label: "📅 Yesterday" },
        { key: "this_week", label: "📅 This Week" },
        { key: "this_month", label: "📅 This Month" },
        { key: "last_month", label: "📅 Last Month" },
      ].map((filter) => (
        <button
          key={filter.key}
          onClick={() => handleFilterChange(filter.key)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === filter.key
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );

  const StatsCard = ({ title, value, subtitle, icon, color = "blue" }) => (
    <div
      className={`bg-white rounded-xl p-6 shadow-lg border-l-4 border-${color}-500 hover:shadow-xl transition-all`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-3xl text-${color}-500`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Reports Dashboard
            </h1>
            <button
              onClick={() => navigate("/game")}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              ❌ Close
            </button>
          </div>

          {/* Quick Filters */}
          <QuickFilterButtons />

          {/* Custom Date Range */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              📅 Custom Date Range
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCustomDateSubmit}
                disabled={!fromDate || !toDate || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-md transition"
              >
                {loading ? "📊 Loading..." : "📊 Get Report"}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        )}

        {/* Quick Stats Overview */}
        {reportData.dailyStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Bets"
              value={reportData.sales?.total_bets || 0}
              subtitle={`${formatCurrency(
                reportData.sales?.total_sell_amount || 0
              )} volume`}
              icon="🎰"
              color="blue"
            />
            <StatsCard
              title="Deposits"
              value={formatCurrency(reportData.deposits?.totalDeposits || 0)}
              subtitle={`${
                reportData.deposits?.totalDepositRequests || 0
              } requests`}
              icon="💰"
              color="green"
            />
            <StatsCard
              title="Withdrawals"
              value={formatCurrency(
                reportData.withdrawals?.totalWithdrawals || 0
              )}
              subtitle={`${
                reportData.withdrawals?.totalWithdrawalRequests || 0
              } requests`}
              icon="💸"
              color="red"
            />
            <StatsCard
              title="Net Profit"
              value={formatCurrency(reportData.profitLoss?.netProfit || 0)}
              subtitle={formatPercentage(reportData.profitLoss?.profitMargin)}
              icon="📈"
              color="purple"
            />
          </div>
        )}

        {/* Detailed Reports Grid */}
        {reportData.sales && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Report */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                🎯 Sales Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Sales:</span>
                  <span className="font-semibold">
                    {formatCurrency(reportData.sales.total_sell_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled Bets:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(reportData.sales.cancelled_amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Sales:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      (reportData.sales.total_sell_amount || 0) -
                        (reportData.sales.cancelled_amount || 0)
                    )}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Bets:</span>
                  <span className="text-blue-600">
                    {reportData.sales.total_bets}
                  </span>
                </div>
              </div>
            </div>

            {/* Win/Loss Summary */}
            {reportData.betsSummary && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  🏆 Win/Loss Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winning Bets:</span>
                    <span className="font-semibold text-green-600">
                      {reportData.betsSummary.winningBets || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Losing Bets:</span>
                    <span className="font-semibold text-red-600">
                      {reportData.betsSummary.losingBets || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Bets:</span>
                    <span className="font-semibold text-yellow-600">
                      {reportData.betsSummary.pendingBets || 0}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payouts:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(reportData.betsSummary.totalPayouts || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Win Rate:</span>
                    <span className="text-blue-600">
                      {reportData.betsSummary.winRate
                        ? `${reportData.betsSummary.winRate.toFixed(2)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Deposit Summary */}
            {reportData.deposits && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  💰 Deposit Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved Deposits:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(
                        reportData.deposits.approvedDeposits || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Deposits:</span>
                    <span className="font-semibold text-yellow-600">
                      {formatCurrency(reportData.deposits.pendingDeposits || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected Deposits:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(
                        reportData.deposits.rejectedDeposits || 0
                      )}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Requests:</span>
                    <span className="text-blue-600">
                      {reportData.deposits.totalDepositRequests || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Summary */}
            {reportData.withdrawals && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  💸 Withdrawal Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Completed Withdrawals:
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(
                        reportData.withdrawals.completedWithdrawals || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Withdrawals:</span>
                    <span className="font-semibold text-yellow-600">
                      {formatCurrency(
                        reportData.withdrawals.pendingWithdrawals || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected Withdrawals:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(
                        reportData.withdrawals.rejectedWithdrawals || 0
                      )}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Requests:</span>
                    <span className="text-blue-600">
                      {reportData.withdrawals.totalWithdrawalRequests || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* User Statistics */}
            {reportData.userStats && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  👥 User Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users:</span>
                    <span className="font-semibold text-green-600">
                      {reportData.userStats.activeUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Registrations:</span>
                    <span className="font-semibold text-blue-600">
                      {reportData.userStats.newUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-semibold text-purple-600">
                      {reportData.userStats.totalUsers || 0}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Avg. Bet per User:</span>
                    <span className="text-blue-600">
                      {formatCurrency(reportData.userStats.avgBetPerUser || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Profit/Loss Analysis */}
            {reportData.profitLoss && (
              <div className="bg-white rounded-xl p-6 shadow-lg lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  📊 Profit/Loss Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.profitLoss.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Payouts</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.profitLoss.totalPayouts || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.profitLoss.netProfit || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span
                      className={`text-lg font-bold ${
                        (reportData.profitLoss.profitMargin || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPercentage(
                        reportData.profitLoss.profitMargin || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Range Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          📅 Report Period: {fromDate} to {toDate} | Last Updated:{" "}
          {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ReportS;
