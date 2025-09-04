import React from "react";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/results`;

const JackpotButton = ({ onClear, gridValues }) => {
  const navigate = useNavigate();

  const handleExit = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handlePrintF12 = () => {
    if (!Array.isArray(gridValues)) {
      console.error("gridValues is not an array or is undefined");
      return;
    }

    const selectedBets = gridValues
      .flatMap((row, rowIndex) =>
        row
          .map((val, colIndex) => {
            const amount = parseFloat(val);
            if (!isNaN(amount) && amount > 0) {
              return {
                number: rowIndex * 10 + colIndex,
                points: amount,
              };
            }
            return null;
          })
          .filter(Boolean)
      );

    navigate("/print-f12", { state: { selectedBets } });
  };

  const fetchLatestResults = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch");

      await res.json();
      window.location.reload();
    } catch (err) {
      console.error("❌ Failed to fetch latest results", err);
    }
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/1234567890", "_blank"); // Replace with your WhatsApp number (no +)
  };

  const leftButtons = [
    { label: "Bet Dtls - T", color: "bg-red-500", onClick: () => navigate("/bet-details") },
    { label: "Clear - M", color: "bg-orange-400", onClick: onClear },
    { label: "Print - F12", color: "bg-pink-500", hideOnMobile: true, onClick: handlePrintF12 },
    { label: "Result - R", color: "bg-purple-400", onClick: () => navigate("/result-r") },
    { label: "Report - S", color: "bg-green-400", hideOnMobile: true, onClick: () => navigate("/report-s") },
    { label: "Upt. Rslt", color: "bg-pink-400", hideOnMobile: true, onClick: fetchLatestResults },
    { label: "Exit - X", color: "bg-orange-500", onClick: handleExit, mobileOnly: true },
    {
      label: <FaWhatsapp size={20} />,
      color: "bg-green-600",
      onClick: handleWhatsAppClick,
      mobileOnly: true,
    },
  ];

  return (
    <div className="w-full bg-blue-200 border-y border-black px-2 py-2 sm:py-3 md:py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {/* Left Side Buttons - Scrollable on Mobile */}
        <div className="flex flex-row flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible gap-3 pb-1">
          {leftButtons.map((btn, index) => (
            <button
              key={index}
              className={`
                ${btn.color} text-white font-semibold
                h-8 min-w-[8px]
                rounded-full
                text-sm
                shadow-md
                flex items-center justify-center
                px-4
                transition duration-200
                hover:brightness-110
                whitespace-nowrap
                ${btn.hideOnMobile ? "hidden sm:inline-block" : ""}
                ${btn.mobileOnly ? "sm:hidden" : ""}
              `}
              onClick={btn.onClick}
              aria-label={typeof btn.label === "string" ? btn.label : "WhatsApp"}
              title={typeof btn.label === "string" ? btn.label : "WhatsApp"}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right Side Buttons (Desktop) */}
        <div className="hidden sm:flex justify-center sm:justify-end gap-2">
          <button
            className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:brightness-110 transition duration-150"
            onClick={() => window.open("https://www.ammyy.com", "_blank")}
          >
            AMMYY ADMIN
          </button>
          <button
            className="bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow hover:brightness-110 transition duration-150"
            onClick={handleExit}
          >
            Exit - X
          </button>
        </div>
      </div>
    </div>
  );
};

export default JackpotButton;














