import React from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaDice,
  FaFileInvoiceDollar,
  FaExchangeAlt,
  FaSignOutAlt,
  FaMoneyCheckAlt,
  FaListAlt,
  FaUser, // Added here
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo (2).png";

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("✅ Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    {
      to: "/admin-dashboard",
      icon: <FaTachometerAlt size={20} />,
      label: "Dashboard",
    },
    { to: "/admins", icon: <FaUsers size={20} />, label: "Admins" },
    { to: "/admin-users", icon: <FaUsers size={20} />, label: "Users" },
    { to: "/admin-bets", icon: <FaDice size={20} />, label: "Bets" },
    {
      to: "/admin-transactions",
      icon: <FaFileInvoiceDollar size={20} />,
      label: "Transaction",
    },
    {
      to: "/admin-results",
      icon: <FaExchangeAlt size={20} />,
      label: "Result",
    },
    {
      to: "/admin-create-result",
      icon: <FaExchangeAlt size={20} />,
      label: "Create Result",
    },
    {
      to: "/admin-payouts",
      icon: <FaMoneyCheckAlt size={20} />,
      label: "Payout Request",
    },
    {
      to: "/admin-deposits",
      icon: <FaMoneyCheckAlt size={20} />,
      label: "Deposit Request",
    },
    {
      to: "/admin-payout-list",
      icon: <FaListAlt size={20} />,
      label: "Payout List",
    },
    {
      to: "/admin-user-specification",
      icon: <FaUser size={20} />,
      label: "User Specification",
    }, // New field added
  ];

  const linkClasses = `flex items-center gap-4 p-2 rounded-md transition-all duration-300 hover:bg-white hover:text-blue-700 font-medium`;

  return (
    <div
      className={`bg-gradient-to-b from-purple-600 via-pink-500 to-red-500 text-white transition-all duration-300 ease-in-out min-h-screen flex flex-col justify-between shadow-xl ${
        isOpen ? "w-60 px-4" : "w-20 px-2"
      }`}
    >
      {/* Top: Logo & Nav */}
      <div>
        <div className="flex items-center gap-3 py-4">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          {isOpen && (
            <h2 className="text-xl font-bold tracking-wide">Admin Panel</h2>
          )}
        </div>

        <ul className="space-y-2">
          {navItems.map(({ to, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${linkClasses} ${
                    isActive ? "bg-white text-blue-800 font-semibold" : ""
                  }`
                }
              >
                {icon}
                {isOpen && <span className="whitespace-nowrap">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: Logout */}
      <div className="mb-4 border-t border-white/30 pt-4">
        <button onClick={handleLogout} className={`${linkClasses} w-full`}>
          <FaSignOutAlt size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
