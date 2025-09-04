import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const Bets = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/bets/all`);
        console.log("Bets fetched:", res.data);
        setBets(res.data);
        setFilteredBets(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch bets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  useEffect(() => {
    if (!searchText) {
      setFilteredBets(bets);
    } else {
      const lowercasedFilter = searchText.toLowerCase();
      const filteredData = bets.filter((item) => {
        return (
          String(item.id).includes(lowercasedFilter) ||
          String(item.number).includes(lowercasedFilter) ||
          String(item.stake).includes(lowercasedFilter) ||
          item.status?.toLowerCase().includes(lowercasedFilter) ||
          item.roundTime?.toLowerCase().includes(lowercasedFilter) ||
          new Date(item.placedAt).toLocaleString().toLowerCase().includes(lowercasedFilter)
        );
      });
      setFilteredBets(filteredData);
    }
  }, [searchText, bets]);

  const columns = [
    { name: "#ID", selector: (row) => row.id, sortable: true, width: "70px" },
    { name: "Number", selector: (row) => row.number, sortable: true },

    // Show stake * 2 as amount
    { name: "Stake", selector: (row) => `₹${row.amount ?? row.stake * 2}`, sortable: true },

    { name: "Round Time", selector: (row) => row.roundTime, sortable: true },
    {
      name: "Placed At",
      selector: (row) => {
        if (!row.placedAt) return "N/A";
        const date = new Date(row.placedAt);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
            row.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : row.status === "won"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        🎲 All Placed Bets
      </h1>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search by ID, number, stake, etc."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm shadow-sm"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <DataTable
          columns={columns}
          data={filteredBets}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          noDataComponent={<div className="text-gray-500 text-sm py-4">No matching bets found.</div>}
          progressComponent={<div className="text-blue-500 text-sm py-4">Loading bets...</div>}
        />
      </div>
    </div>
  );
};

export default Bets;





