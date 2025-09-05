import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPhone, FaLock } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import boyPointing from "../assets/boy-panting.png";

const Login = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!phone || !password) {
      return alert("Please enter phone number and password");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        phone,
        password,
      });
      localStorage.setItem("token", res.data.token);

      // Check if response indicates admin login
      const isAdmin = res.data.isAdmin || false;

      alert("Login successful!");
      navigate(isAdmin ? "/admin-dashboard" : "/game");
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen max-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#ff0080] via-[#7928ca] to-[#2afadf] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-8 max-w-6xl w-full h-full">
        <motion.img
          src={boyPointing}
          alt="Jumping Boy"
          className="w-40 sm:w-52 md:w-72 select-none max-h-[40vh] md:max-h-[60vh]"
          animate={{ y: [0, -20, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md backdrop-blur-xl bg-opacity-90 max-h-[60vh] overflow-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-700 mb-6 sm:mb-8 drop-shadow-md">
            🎮 Login to Jackpot
          </h2>

          <div className="relative mb-4 sm:mb-5">
            <FaPhone className="absolute top-4 left-4 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="relative mb-5 sm:mb-6">
            <FaLock className="absolute top-4 left-4 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>

          <p className="mt-5 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-purple-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-purple-600 font-semibold hover:underline cursor-pointer">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Login;
