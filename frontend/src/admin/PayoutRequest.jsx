// src/admin/PayOutRequest.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PayOutRequest = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/payout/requests`);
      setRequests(data);
    } catch (err) {
      console.error('❌ Fetch requests error:', err);
    }
  };

  const handleUpdate = async (id, status) => {
    try {
      await axios.post(`${BACKEND_URL}/api/payout/update`, { id, status });
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error('❌ Update error:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payout Requests</h2>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">User ID</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Bank Name</th>
            <th className="border p-2">Account Number</th>
            <th className="border p-2">IFSC Code</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="text-sm">
              <td className="border p-2">{req.user_id}</td>
              <td className="border p-2">{req.phone || 'N/A'}</td>
              <td className="border p-2">{req.bank_name}</td>
              <td className="border p-2">{req.bank_account_number}</td>
              <td className="border p-2">{req.ifsc_code}</td>
              <td className="border p-2">₹{req.amount}</td>
              <td className="border p-2">{req.status}</td>
              <td className="border p-2">{new Date(req.created_at).toLocaleString()}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleUpdate(req.id, 'approved')}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleUpdate(req.id, 'rejected')}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayOutRequest;



