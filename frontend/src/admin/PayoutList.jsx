// src/admin/PayoutList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const PayoutList = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [payouts, setPayouts] = useState([]);

  const fetchPayouts = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/payout/approved`);
      setPayouts(data);
    } catch (err) {
      console.error("❌ Fetch payouts error:", err);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Approved Payout List</h2>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">User</th>
            <th className="border p-2">Bank Name</th>
            <th className="border p-2">Account Number</th>
            <th className="border p-2">IFSC Code</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id} className="text-sm">
              <td className="border p-2">
                Phone: {p.phone || "N/A"} (ID: {p.user_id})
              </td>
              <td className="border p-2">{p.bank_name}</td>
              <td className="border p-2">{p.bank_account_number}</td>
              <td className="border p-2">{p.ifsc_code}</td>
              <td className="border p-2">💎{p.amount}</td>
              <td className="border p-2">
                {new Date(p.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutList;
