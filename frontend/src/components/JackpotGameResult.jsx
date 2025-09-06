import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SOCKET_URL = `${BACKEND_URL}`;
const API_URL = `${BACKEND_URL}/api/results`;

const JackpotGameResult = () => {
  const [resultTimes, setResultTimes] = useState([]);

  const desktopScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  // Convert 24-hour time to 12-hour format with am/pm
  const convert24to12 = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const fetchLatestResults = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setResultTimes(data);
    } catch (err) {
      console.error("❌ Failed to fetch results:", err);
    }
  };

  useEffect(() => {
    fetchLatestResults();

    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
    //   console.log("🟢 Connected to socket:", socket.id);
    });

    socket.on("new-result", (newResult) => {
      setResultTimes((prev) => [...prev, newResult]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (desktopScrollRef.current) {
      desktopScrollRef.current.scrollTop =
        desktopScrollRef.current.scrollHeight;
    }
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollLeft = mobileScrollRef.current.scrollWidth;
    }
  }, [resultTimes]);

  return (
    <div className="relative w-full bg-white p-4 md:p-5 rounded-xl shadow-md">
      <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-lg p-4 w-full text-3xl font-bold text-white uppercase mb-4 text-center">
        Jackpot Results
      </div>
      {/* Mobile View - Horizontal Scroll */}
      <div
        ref={mobileScrollRef}
        className="flex md:hidden gap-3 overflow-x-auto pb-2 scrollbar-thin"
      >
        {resultTimes.map(({ time, number, bonus }, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[60px] relative flex flex-col items-center justify-center border border-gray-300 rounded-lg bg-gradient-to-br from-white to-gray-100 p-2 shadow"
          >
            {bonus && bonus > 1 && (
              <span className="absolute top-1 right-1 bg-yellow-400 text-[10px] font-bold text-gray-800 px-1.5 py-0.5 rounded-full shadow">
                x{bonus}
              </span>
            )}
            <p
              className={`text-4xl sm:text-5xl font-black tracking-wider ${
                bonus && bonus > 1
                  ? "text-yellow-700"
                  : idx % 2 === 0
                  ? "text-blue-800"
                  : "text-red-700"
              }`}
              style={{
                textShadow: "2px 2px 3px rgba(0,0,0,0.3)",
              }}
            >
              {number !== null ? number.toString().padStart(2, "0") : "--"}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white bg-red-800 px-2 py-0.5 rounded">
              {convert24to12(time)}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop View - Vertical Scroll */}
      <div
        ref={desktopScrollRef}
        className="hidden md:block overflow-y-auto max-h-[523px]"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {resultTimes.map(({ time, number, bonus }, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center justify-center border border-gray-300 rounded-lg bg-gradient-to-br from-white to-gray-100 p-2 sm:p-3 shadow hover:shadow-md transition-all duration-200"
            >
              {bonus && bonus > 1 && (
                <span className="absolute top-1 right-1 bg-yellow-400 text-[10px] sm:text-xs font-bold text-gray-800 px-1.5 py-0.5 rounded-full shadow">
                  x{bonus}
                </span>
              )}
              <p
                className={`text-2xl sm:text-3xl tracking-wider font-extrabold ${
                  bonus && bonus > 1
                    ? "text-yellow-700"
                    : idx % 2 === 0
                    ? "text-blue-800"
                    : "text-red-700"
                }`}
                style={{
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {number !== null ? number.toString().padStart(2, "0") : "--"}
              </p>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-white bg-red-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded">
                {convert24to12(time)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JackpotGameResult;
