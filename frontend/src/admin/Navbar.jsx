import React from "react";
import { FaBars } from "react-icons/fa";

const Navbar = ({ toggleSidebar }) => {
  return (
    <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient-x shadow-md px-4 py-3 flex justify-between items-center relative overflow-hidden rounded-b-lg">
      {/* Toggle Sidebar Button */}
      <button
        className="text-white font-bold text-lg hover:scale-110 transition-transform duration-300"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <FaBars size={24} />
      </button>

      {/* Center Title */}
      <h1 className="text-2xl font-bold text-white drop-shadow-md animate-pulse">
        🎰 JACKPOT ADMIN 🎲
      </h1>

      {/* Spacer to balance layout */}
      <div className="w-6" />
    </header>
  );
};

export default Navbar;


