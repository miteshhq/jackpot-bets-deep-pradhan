import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const Admins = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create', 'edit'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
    role: "admin",
  });

  const fetchAdmins = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdmins(res.data);
      setFilteredAdmins(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch admins:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.phone || !formData.password || !formData.name) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BACKEND_URL}/api/admin/create`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Admin created successfully");
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (err) {
      alert(
        "❌ Failed to create admin: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    // Create update payload with only changed fields
    const updateData = {};
    if (formData.phone && formData.phone !== selectedAdmin.phone) {
      updateData.phone = formData.phone;
    }
    if (formData.password) {
      updateData.password = formData.password;
    }
    if (formData.name && formData.name !== selectedAdmin.name) {
      updateData.name = formData.name;
    }
    if (formData.role && formData.role !== selectedAdmin.role) {
      updateData.role = formData.role;
    }

    if (Object.keys(updateData).length === 0) {
      alert("No changes detected");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BACKEND_URL}/api/admin/update/${selectedAdmin.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("✅ Admin updated successfully");
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (err) {
      alert(
        "❌ Failed to update admin: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDeleteAdmin = async (adminId, phone) => {
    const confirmMessage = `Are you sure you want to delete admin ${phone}?\n\nThis action cannot be undone!`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/admin/delete/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Admin deleted successfully");
      fetchAdmins();
    } catch (err) {
      alert(
        "❌ Failed to delete admin: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const openModal = (type, admin = null) => {
    setModalType(type);
    setSelectedAdmin(admin);
    if (type === "edit" && admin) {
      setFormData({
        phone: admin.phone,
        password: "", // Don't pre-fill password for security
        name: admin.name,
        role: admin.role,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      phone: "",
      password: "",
      name: "",
      role: "admin",
    });
    setSelectedAdmin(null);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Search Handler
  useEffect(() => {
    const filtered = admins.filter(
      (admin) =>
        (admin.phone || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (admin.name || "").toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredAdmins(filtered);
  }, [searchText, admins]);

  // Define Columns
  const columns = [
    { name: "ID", selector: (row) => row.id, sortable: true, width: "70px" },
    { name: "Phone", selector: (row) => row.phone || "N/A", sortable: true },
    { name: "Name", selector: (row) => row.name || "N/A", sortable: true },
    {
      name: "Role",
      selector: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.role === "super"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {row.role === "super" ? "🔴 Super Admin" : "🔵 Admin"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Created By",
      selector: (row) => row.created_by_name || "System",
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openModal("edit", row)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
            title="Edit Admin"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => handleDeleteAdmin(row.id, row.phone)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
            title="Delete Admin"
          >
            🗑️ Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  if (loading) return <p>Loading admins...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <div style={{ padding: "20px" }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2>👑 Admin Management</h2>
            <p className="text-sm text-gray-600">
              Create and manage admin accounts
            </p>
          </div>
          <button
            onClick={() => openModal("create")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Create New Admin
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Search by phone or name..."
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
          data={filteredAdmins}
          pagination
          highlightOnHover
          responsive
          striped
          noDataComponent="No admins found"
        />
      </div>

      {/* Modal for Creating/Editing Admin */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {modalType === "create" ? "➕ Create New Admin" : "✏️ Edit Admin"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password{" "}
                  {modalType === "edit" && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter admin name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">🔵 Admin</option>
                  <option value="super">🔴 Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={
                  modalType === "create" ? handleCreateAdmin : handleUpdateAdmin
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {modalType === "create" ? "➕ Create Admin" : "✏️ Update Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Admins;
