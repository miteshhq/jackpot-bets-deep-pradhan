import React, { useEffect, useState } from "react";
import axios from "axios";

const DepositRequests = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${BACKEND_URL}/api/wallet/admin/deposits`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(data);
    } catch (err) {
      console.error("❌ Fetch deposit requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/wallet/admin/deposits/approve`,
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Deposit approved and coins added to user wallet");
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("❌ Approve error:", err);
      alert("❌ Error approving deposit request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/wallet/admin/deposits/reject`,
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Deposit request rejected");
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("❌ Reject error:", err);
      alert("❌ Error rejecting deposit request");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p>Loading deposit requests...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">💰 Deposit Requests</h2>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Process:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Contact user on WhatsApp using their phone number</li>
          <li>2. Collect payment via UPI/Bank transfer</li>
          <li>
            3. After payment verification, click "Approve" to add coins to user
            wallet
          </li>
          <li>4. Click "Reject" if payment is not received or cancelled</li>
        </ol>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">Request ID</th>
            <th className="border p-2">User ID</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Amount (₹)</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="text-sm">
              <td className="border p-2">{req.id}</td>
              <td className="border p-2">{req.user_id}</td>
              <td className="border p-2">
                <a
                  href={`https://wa.me/91${req.phone_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  {req.phone_number}
                </a>
              </td>
              <td className="border p-2">₹{req.amount}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    req.status === "pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : req.status === "approved"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {req.status.toUpperCase()}
                </span>
              </td>
              <td className="border p-2">
                {new Date(req.created_at).toLocaleString()}
              </td>
              <td className="border p-2 space-x-2">
                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Approve & Add Coins
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No deposit requests found.
        </p>
      )}
    </div>
  );
};

export default DepositRequests;
