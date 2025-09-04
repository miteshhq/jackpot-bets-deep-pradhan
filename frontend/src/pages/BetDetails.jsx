import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // Correct import (without braces)
import { useNavigate } from 'react-router-dom';

const BetDetails = () => {
  const [bets, setBets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pending, setPending] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const navigate = useNavigate();
  const BACK = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No token found in localStorage");
      setPending(false);
      return;
    }

    try {
      const user = jwtDecode(token);
      console.log("Decoded user:", user);
      fetchUserBets(user.id || user.userId);
    } catch (err) {
      console.error("Invalid token:", err);
      setPending(false);
    }
  }, []);

  const fetchUserBets = async (uid) => {
    setPending(true);
    try {
      const res = await axios.get(`${BACK}/api/bets/user/${uid}`);
      console.log("Fetched bets:", res.data);
      setBets(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setBets([]);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    let temp = [...bets];

    if (date) {
      temp = temp.filter((b) => {
        if (!b.placedAt) {
          console.warn("No placedAt on bet:", b);
          return false;
        }
        const betDate = new Date(b.placedAt);
        if (isNaN(betDate.getTime())) {
          console.warn("Invalid date for bet:", b);
          return false;
        }
        return betDate.toISOString().slice(0, 10) === date;
      });
    }

    if (barcodeSearch) {
      temp = temp.filter((b) =>
        b.barcode && b.barcode.includes(barcodeSearch)
      );
    }

    console.log("Filtered bets:", temp);
    setFiltered(temp);
  }, [bets, date, barcodeSearch]);


  const handleCancel = async (bid) => {
    try {
      await axios.post(`${BACK}/api/report/cancel/${bid}`);

      alert('✅ Ticket cancelled');
      const user = jwtDecode(localStorage.getItem('token'));
      fetchUserBets(user.id || user.userId);
    } catch (e) {
      alert(e.response?.data?.msg || 'Error');
    }
  };

  const addMinutesToTime = (timeString, minutesToAdd) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0); // set time to the parsed hours and minutes
    const newHours = date.getHours();
    const newMinutes = date.getMinutes();
    return `${newHours}:${newMinutes.toString().padStart(2, '0')}`; // Format it as HH:mm
  };

  return (
    <div className="bg-yellow-100 min-h-screen p-4 text-sm">
      {/* 🔍 Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-bold">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={() => setDate(date)}
            className="border px-3 py-1 rounded bg-white"
          >
            View
          </button>
          <button
            onClick={() => {
              setBarcodeSearch('');
              setDate(new Date().toISOString().slice(0, 10));
            }}
            className="border px-3 py-1 rounded bg-white"
          >
            Unclaimed
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-bold">Barcode search:</label>
          <input
            type="text"
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            maxLength={7}
            className="border px-2 py-1 w-32 rounded"
            placeholder="Enter barcode"
          />
          <button
            onClick={() => setBarcodeSearch('')}
            className="border px-3 py-1 rounded bg-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-full text-center border-collapse">
          <thead className="bg-yellow-200 text-xs md:text-sm">
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Barcode</th>
              <th className="border px-2 py-1">Draw Time</th>
              <th className="border px-2 py-1">Mrp</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Number</th>
              <th className="border px-2 py-1">Win</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Cancel</th>
            </tr>
          </thead>


          <tbody>
            {pending ? (
              <tr>
                <td colSpan="10" className="py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-4 text-gray-500">
                  No bets found.
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => {
                const qty = parseFloat(b.stake).toFixed(0);
                const amount = b.stake * 2;
                const winAmount = b.status === "won" ? amount * 80 : 0;

                return (
                  <tr key={b.id || i} className="hover:bg-yellow-50 text-xs md:text-sm">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{b.barcode}</td>
                    <td className="border px-2 py-1">
                      {addMinutesToTime(b.roundTime, 5)}
                    </td>
                    <td className="border px-2 py-1">2.00</td>
                    <td className="border px-2 py-1">{qty}</td>
                    <td className="border px-2 py-1">₹{amount.toFixed(2)}</td>
                    <td className="border px-2 py-1">
                      {String(b.number).padStart(2, "0")}
                    </td>
                    <td className="border px-2 py-1 text-green-700">₹{winAmount.toFixed(0)}</td>
                    <td className="border px-2 py-1 capitalize">{b.status}</td>
                    <td className="border px-2 py-1">
                      {b.status === "pending" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>


        </table>
      </div>

      {/* 🔘 Bottom Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Re-Print
        </button>
        <button
          onClick={() => alert('Cancel Claim not implemented yet')}
          className="px-4 py-2 bg-blue-700 text-white rounded"
        >
          Tkt. Cancel
        </button>
        <button
          onClick={() => alert('Claim feature upcoming')}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Tkt. Claim
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-black rounded"
        >
          Refresh from server
        </button>
        <button
          onClick={() => navigate('/game')}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BetDetails;



















