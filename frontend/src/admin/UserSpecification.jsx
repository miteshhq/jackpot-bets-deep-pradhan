import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const UserSpecification = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfitLoss = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/bets/daily-profit-loss`);
        console.log("API response data:", res.data);

        if (Array.isArray(res.data)) {
          setData(res.data);
          setFilteredData(res.data);
          setError(null);
        } else {
          setError("Unexpected data format");
          setData([]);
          setFilteredData([]);
        }
      } catch (err) {
        setError("Failed to load profit/loss data");
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLoss();
  }, [BACKEND_URL]);

  // Optional: search/filter on date or profit/loss
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
    } else {
      const lowercasedFilter = searchText.toLowerCase();
      const filtered = data.filter((item) => {
        const profitLoss = (item.totalStake || 0) - (item.totalPayout || 0);
        return (
          item.date?.toLowerCase().includes(lowercasedFilter) ||
          profitLoss.toString().toLowerCase().includes(lowercasedFilter)
        );
      });
      setFilteredData(filtered);
    }
  }, [searchText, data]);

  const columns = [
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
      width: "150px",
    },
    {
      name: "Total Stake (₹)",
      selector: (row) => row.totalStake ?? 0,
      sortable: true,
      right: true,
      format: (row) => row.totalStake?.toLocaleString() ?? "0",
    },
    {
      name: "Total Payout (₹)",
      selector: (row) => row.totalPayout ?? 0,
      sortable: true,
      right: true,
      format: (row) => row.totalPayout?.toLocaleString() ?? "0",
    },
    {
      name: "Profit / Loss (₹)",
      selector: (row) => (row.totalStake || 0) - (row.totalPayout || 0),
      sortable: true,
      right: true,
      format: (row) => {
        const profitLoss = (row.totalStake || 0) - (row.totalPayout || 0);
        return profitLoss.toLocaleString();
      },
      cell: (row) => {
        const profitLoss = (row.totalStake || 0) - (row.totalPayout || 0);
        return (
          <span
            style={{
              color: profitLoss >= 0 ? "green" : "red",
              fontWeight: "600",
            }}
          >
            {profitLoss.toLocaleString()}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Daily Profit & Loss</h1>

      {loading && <p className="text-center text-blue-600">Loading data...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <input
            type="text"
            placeholder="Search by date or profit/loss..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mb-4 p-2 border rounded w-full"
          />

          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            pointerOnHover
            noDataComponent="No data available"
            striped
          />
        </>
      )}
    </div>
  );
};

export default UserSpecification;


