import React, { useEffect, useState } from "react";
import axios from "axios";

const PayOutRequest = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${BACKEND_URL}/api/wallet/admin/withdrawals`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(data);
    } catch (err) {
      console.error("❌ Fetch withdrawal requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (requestId, status) => {
    const statusText = status === "completed" ? "completed" : "rejected";

    if (
      status === "completed" &&
      !window.confirm(
        "Have you transferred the money to user account? This will deduct coins from user wallet."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/wallet/admin/withdrawals/process`,
        { requestId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Withdrawal request ${statusText} successfully`);
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("❌ Update error:", err);
      alert(`❌ Error ${statusText} withdrawal request`);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p>Loading withdrawal requests...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">💳 Withdrawal Requests</h2>

      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 Process:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Transfer money to user's provided bank account manually</li>
          <li>
            2. After successful transfer, click "Complete" to deduct coins from
            user wallet
          </li>
          <li>3. Click "Reject" if unable to process the withdrawal</li>
        </ol>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">Request ID</th>
            <th className="border p-2">User ID</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Bank Name</th>
            <th className="border p-2">Account Number</th>
            <th className="border p-2">IFSC Code</th>
            <th className="border p-2">Amount (💎)</th>
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
                  {req.phone_number || "N/A"}
                </a>
              </td>
              <td className="border p-2">{req.bank_name}</td>
              <td className="border p-2">{req.bank_account_number}</td>
              <td className="border p-2">{req.ifsc_code}</td>
              <td className="border p-2">💎{req.amount}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    req.status === "pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : req.status === "completed"
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
                      onClick={() => handleUpdate(req.id, "completed")}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdate(req.id, "rejected")}
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
          No withdrawal requests found.
        </p>
      )}
    </div>
  );
};

export default PayOutRequest;
