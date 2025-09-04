import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Register = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Get referral code from URL: ?ref=xyz123
  const referralCode = new URLSearchParams(location.search).get('ref') || '';

  useEffect(() => {
    if (timer === 0) clearInterval(timerRef.current);
  }, [timer]);

  const startTimer = () => {
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
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
    if (!password) return alert('Please enter password');

    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { phone });
      alert('OTP sent successfully!');
      setStep(2);
      startTimer();
    } catch (err) {
      alert('Failed to send OTP: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0) return;
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { phone });
      alert('OTP resent successfully!');
      startTimer();
    } catch (err) {
      alert('Failed to resend OTP: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return alert('Please enter OTP');

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
        phone,
        password,
        otp,
        referralCode, // ✅ Include referral code
      });

      localStorage.setItem('token', res.data.token);
      alert('Registration & login successful!');
      navigate('/game');
    } catch (err) {
      alert('OTP verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#43e97b] via-[#38f9d7] to-[#6456ff] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md backdrop-blur-xl bg-opacity-90"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        <h2 className="text-4xl font-extrabold text-center text-green-600 mb-8 drop-shadow-md">
          🕹️ Register to Jackpot
        </h2>

       // Inside Register component...
{step === 1 && (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      sendOtp();
    }}
    className="space-y-5"
  >
    <div className="relative">
      <FaPhone className="absolute top-4 left-4 text-gray-400" />
      <input
        type="tel"
        placeholder="Phone Number"
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
    </div>
    <div className="relative">
      <FaLock className="absolute top-4 left-4 text-gray-400" />
      <input
        type="password"
        placeholder="Password"
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
    >
      {loading ? 'Sending OTP...' : 'Send OTP'}
    </motion.button>

    {/* ✅ Login link under step 1 */}
    <p className="text-center text-sm text-gray-600">
      Already have an account?{' '}
      <Link to="/login" className="text-green-600 font-semibold hover:underline">
        Login here
      </Link>
    </p>
  </form>
)}


        {step === 2 && (
          <>
            <div className="relative mb-5">
              <input
                type="number"
                placeholder="Enter OTP"
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center mb-5">
              <button
                onClick={resendOtp}
                disabled={timer > 0 || loading}
                className={`text-sm font-semibold text-green-600 hover:underline ${
                  timer > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Resend OTP {timer > 0 && `in ${timer}s`}
              </button>
              <span className="text-gray-500 text-sm">
                OTP expires in {timer}s
              </span>
            </div>

            <motion.button
              onClick={verifyOtp}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Register'}
            </motion.button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Register;




