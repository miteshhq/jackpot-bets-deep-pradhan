import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/results`;

const ResultR = () => {
  // ✅ Set today's date as default
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [resultData, setResultData] = useState([]);
  const navigate = useNavigate();

  const fetchResults = async (date) => {
    try {
      const formattedDate = date.toISOString().slice(0, 10);
      const { data } = await axios.get(`${API_URL}?date=${formattedDate}`);

      // ✅ Sort results in descending order (latest first)
      const sortedData = [...data].sort((a, b) => {
        if (a.time < b.time) return 1;  // descending
        if (a.time > b.time) return -1;
        return 0;
      });

      setResultData(sortedData);
    } catch (err) {
      console.error("Failed to fetch results", err);
      setResultData([]);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchResults(selectedDate);
    }
  }, [selectedDate]);

  return (
    <div className="w-full min-h-screen p-4 bg-yellow-100">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">📅 Jackpot Results</h1>
        <button
          onClick={() => navigate("/game")}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          Cancel
        </button>
      </div>

      {/* Date Picker */}
      <div className="flex justify-start items-center gap-4 mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select a date"
          className="border border-gray-400 px-3 py-2 rounded-md shadow text-sm w-[200px]"
          maxDate={new Date()}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        <button
          onClick={() => setSelectedDate(new Date())} // ✅ reset to today
          className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded-md"
        >
          Today
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-400 text-sm bg-yellow-50">
          <thead className="bg-gray-300 text-gray-900">
            <tr>
              <th className="border px-4 py-2 text-left">Time</th>
              <th className="border px-4 py-2 text-left">Result</th>
              <th className="border px-4 py-2 text-left">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {resultData.length > 0 ? (
              resultData.map((row, idx) => (
                <tr key={idx} className="hover:bg-yellow-200">
                  <td className="border px-4 py-2">{row.time}</td>
                  <td className="border px-4 py-2">{row.number}</td>
                  <td className="border px-4 py-2">{row.bonus || "1X"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultR;
