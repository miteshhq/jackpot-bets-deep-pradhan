// src/admin/User.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';

const User = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔍 Search Handler (only phone)
  useEffect(() => {
    const filtered = users.filter((user) =>
      (user.phone || '').toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  // 📊 Define Columns without username
  const columns = [
    { name: 'ID', selector: (row) => row.id, sortable: true, width: '70px' },
    { name: 'Phone', selector: (row) => row.phone || 'N/A', sortable: true },
    { name: 'Balance (₹)', selector: (row) => row.balance, sortable: true },
    {
      name: 'Registered At',
      selector: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
  ];

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 All Registered Users</h2>

      <input
        type="text"
        placeholder="🔍 Search by phone number..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          marginBottom: '10px',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          width: '100%',
          maxWidth: '300px',
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
  );
};

export default User;



