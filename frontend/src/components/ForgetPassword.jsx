import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPhone, FaLock, FaKey, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ForgetPassword = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timer === 0) clearInterval(timerRef.current);
  }, [timer]);

  const startTimer = () => {
    setTimer(300); // 5 minutes
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!phone) return alert('Please enter phone number');
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/auth/send-reset-otp`, { phone });
      alert('OTP sent successfully!');
      setStep(2);
      startTimer();
    } catch (err) {
      alert('Failed to send OTP: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndReset = async () => {
    if (!otp || !newPassword) return alert('Please enter OTP and new password');
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/auth/verify-reset-otp`, {
        phone,
        otp,
        newPassword,
      });
      alert('Password reset successful! You can now login with new password.');
      setStep(1);
      setPhone('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      alert('Password reset failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 px-4">
      <motion.div
        className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-purple-700 drop-shadow-md">
          🔐 Forgot Password
        </h2>

        {step === 1 && (
          <>
            <div className="relative mb-5">
              <FaPhone className="absolute top-4 left-4 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </motion.button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="relative mb-4">
              <FaKey className="absolute top-4 left-4 text-gray-400" />
              <input
                type="number"
                placeholder="Enter OTP"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="relative mb-4">
              <FaLock className="absolute top-4 left-4 text-gray-400" />
              <input
                type="password"
                placeholder="New Password"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={verifyOtpAndReset}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
            <p className="mt-4 text-center text-sm text-gray-600">
              OTP expires in{' '}
              <span className="font-semibold">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>{' '}
              minutes
            </p>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-purple-600 font-semibold hover:underline text-sm"
          >
            <FaArrowLeft className="mr-2" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgetPassword;

