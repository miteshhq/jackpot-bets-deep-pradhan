import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';

const Transactions = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/razorpay/transactions`);
        setTransactions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions');
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  const columns = [
    {
      name: 'User ID',
      selector: row => row.user_id,
      sortable: true,
      width: '100px',
    },
    {
      name: 'Amount (₹)',
      selector: row => row.amount,
      sortable: true,
      right: true,
      width: '120px',
    },
    {
      name: 'Payment ID',
      selector: row => row.payment_id,
      sortable: false,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Order ID',
      selector: row => row.order_id,
      sortable: false,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '100px',
      cell: row => (
        <span style={{ color: row.status === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Date',
      selector: row => new Date(row.created_at).toLocaleString(),
      sortable: true,
      grow: 2,
    },
  ];

  if (loading) return <p>Loading transactions...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>All Transactions (Admin View)</h2>
      <DataTable
        columns={columns}
        data={transactions}
        pagination
        highlightOnHover
        dense
        noHeader
        defaultSortField="created_at"
        defaultSortAsc={false}
        persistTableHead
        striped
      />
    </div>
  );
};

export default Transactions;






