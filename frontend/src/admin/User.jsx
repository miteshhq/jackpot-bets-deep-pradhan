import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const User = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add' or 'remove'
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, phone) => {
    const confirmMessage = `Are you sure you want to delete user ${phone} (ID: ${userId})?\n\nThis will permanently delete:\n- User account\n- All bets\n- All transactions\n- All withdrawal/deposit requests\n- All referral data\n\nThis action cannot be undone!`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/auth/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ User deleted successfully");
      fetchUsers(); // Refresh user list
    } catch (err) {
      alert(
        "❌ Failed to delete user: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleCoinOperation = async () => {
    if (!selectedUser || !amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const endpoint =
      modalType === "add"
        ? `${BACKEND_URL}/api/wallet/admin/add-coins`
        : `${BACKEND_URL}/api/wallet/admin/remove-coins`;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        endpoint,
        {
          userId: selectedUser.id,
          amount: Number(amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`✅ ${response.data.message}`);
      setShowModal(false);
      setAmount("");
      setSelectedUser(null);
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error(`❌ Error ${modalType}ing coins:`, err);
      alert(err.response?.data?.message || `Failed to ${modalType} coins`);
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search Handler
  useEffect(() => {
    const filtered = users.filter((user) =>
      (user.phone || "").toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  // Define Columns with admin actions
  const columns = [
    { name: "ID", selector: (row) => row.id, sortable: true, width: "70px" },
    { name: "Phone", selector: (row) => row.phone || "N/A", sortable: true },
    {
      name: "Balance (₹)",
      selector: (row) => `₹${Number(row.balance).toFixed(2)}`,
      sortable: true,
    },
    {
      name: "Registered At",
      selector: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
    {
      name: "Admin Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openModal(row, "add")}
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
            title="Add Coins"
          >
            ➕ Add
          </button>
          <button
            onClick={() => openModal(row, "remove")}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
            title="Remove Coins"
          >
            ➖ Remove
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: "Delete",
      cell: (row) => (
        <button
          onClick={() => handleDeleteUser(row.id, row.phone)}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
          title="Delete User"
        >
          🗑 Delete
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <div style={{ padding: "20px" }}>
        <h2>👥 All Registered Users</h2>
        <p className="text-sm text-gray-600 mb-4">
          Admin can manually add/remove coins and delete users
        </p>

        <input
          type="text"
          placeholder="🔍 Search by phone number..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            marginBottom: "10px",
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "100%",
            maxWidth: "300px",
          }}
        />

        <DataTable
          columns={columns}
          data={filteredUsers}
          pagination
          highlightOnHover
          responsive
          striped
          noDataComponent="No users found"
        />
      </div>

      {/* Modal for Adding/Removing Coins */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {modalType === "add" ? "➕ Add Coins" : "➖ Remove Coins"}
              {selectedUser && ` - User ${selectedUser.id}`}
            </h3>

            {selectedUser && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p>
                  <strong>Phone:</strong> {selectedUser.phone}
                </p>
                <p>
                  <strong>Current Balance:</strong> ₹
                  {Number(selectedUser.balance).toFixed(2)}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="0.01"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAmount("");
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCoinOperation}
                className={`px-4 py-2 text-white rounded hover:opacity-90 ${
                  modalType === "add"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {modalType === "add" ? "➕ Add Coins" : "➖ Remove Coins"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default User;
