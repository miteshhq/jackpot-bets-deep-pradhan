import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUsers, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [userCount, setUserCount] = useState(0);
  const [latestResult, setLatestResult] = useState(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found in localStorage');
        setErrorMessage('Token missing. Please login again.');
        navigate('/login');
        return;
      }

      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // ✅ Get total users
        const userRes = await axios.get(`${BACKEND_URL}/api/auth/admin/user-count`, config);
        setUserCount(userRes.data.count);

        // ✅ Get latest game result
        const resultRes = await axios.get(`${BACKEND_URL}/api/results`);
        const results = resultRes.data;
        if (Array.isArray(results) && results.length > 0) {
          setLatestResult(results[results.length - 1]);
        }

        // ✅ Get total Razorpay transaction amount
        const txRes = await axios.get(`${BACKEND_URL}/api/razorpay/transactions/total`, config);
        const totalAmount = parseFloat(txRes.data.totalAmount || 0);
        setTotalTransactions(totalAmount);

      } catch (err) {
        console.error('❌ Error fetching data:', err.response?.data || err.message);

        if (err.response?.status === 401) {
          setErrorMessage('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setErrorMessage('Something went wrong. Please try again later.');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-gray-800 text-center animate-fade-in">
        ✨ Admin Dashboard ✨
      </h2>

      {errorMessage && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-6 text-center font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        {/* 🧑‍🤝‍🧑 Total Users */}
        <DashboardCard
          icon={<FaUsers className="text-2xl sm:text-3xl text-purple-800 animate-bounce" />}
          title="Total Users"
          value={userCount}
          bgFrom="purple-600"
          bgTo="pink-500"
          textColor="text-purple-700"
        />

        {/* 💰 Total Transactions */}
        <DashboardCard
          icon={<FaMoneyBillWave className="text-2xl sm:text-3xl text-green-800 animate-pulse" />}
          title="Total Transactions"
          value={formatCurrency(totalTransactions)}
          bgFrom="green-400"
          bgTo="blue-500"
          textColor="text-green-700"
        />

        {/* 🕒 Latest Result */}
        <DashboardCard
          icon={<FaClock className="text-2xl sm:text-3xl text-red-800 animate-spin-slow" />}
          title="Latest Result"
          value={latestResult ? `🎯 ${latestResult.number.toString().padStart(2, '0')}` : 'Loading...'}
          subtitle={latestResult ? `Time: ${latestResult.time}` : ''}
          bgFrom="yellow-400"
          bgTo="red-500"
          textColor="text-blue-700"
        />
      </div>
    </div>
  );
};

const DashboardCard = ({ icon, title, value, subtitle, bgFrom, bgTo, textColor }) => (
  <div className="relative group w-full max-w-sm p-5 sm:p-6 bg-white/30 rounded-3xl border border-white/20 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
    <div className={`absolute -inset-0.5 bg-gradient-to-r from-${bgFrom} to-${bgTo} rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500`}></div>
    <div className="relative z-10 flex flex-col items-center space-y-2 text-center">
      {icon}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h3>
      <p className={`text-2xl sm:text-4xl font-bold ${textColor}`}>{value}</p>
      {subtitle && <p className="text-sm font-medium text-gray-600">{subtitle}</p>}
    </div>
  </div>
);

export default AdminDashboard;











