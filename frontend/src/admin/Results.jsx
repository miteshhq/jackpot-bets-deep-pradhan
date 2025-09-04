import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';

const Result = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/results`);
        if (!res.ok) throw new Error('Failed to fetch results');
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const columns = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Time',
      selector: row => row.time,
      sortable: true,
    },
    {
      name: 'Number',
      selector: row => row.number,
      sortable: true,
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#2563eb', // Tailwind blue-600
        color: 'white',
        fontSize: '16px',
        fontWeight: '700',
        letterSpacing: '0.05em',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        minHeight: '50px',
        cursor: 'default',
        '&:hover': {
          backgroundColor: '#bfdbfe', // Tailwind blue-200
        },
      },
    },
    cells: {
      style: {
        padding: '12px 15px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <h2 className="text-4xl font-bold text-blue-600 mb-8 tracking-wide">Result</h2>
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-md p-6">
        <DataTable
          columns={columns}
          data={results}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          noDataComponent={
            <div className="py-10 text-center text-gray-400 text-lg">
              No results found
            </div>
          }
          customStyles={customStyles}
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
          dense
        />
      </div>
    </div>
  );
};

export default Result;






