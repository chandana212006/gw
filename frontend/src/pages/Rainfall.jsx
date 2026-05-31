import { useEffect, useState } from 'react';
import api from '../api/axios';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function Rainfall() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ district: '', rainfall_amount: '', rainfall_date: '' });
  
  // Advanced States
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState('rainfall_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const role = localStorage.getItem('role') || 'viewer';
  const isAdmin = role.toLowerCase() === 'admin';
  const isOperator = role.toLowerCase() === 'operator';
  const canAdd = isAdmin || isOperator;

  const load = () => {
    api.get(`/rainfall?show_deleted=${showDeleted}`).then((r) => setRows(r.data));
  };

  useEffect(() => {
    load();
  }, [showDeleted]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canAdd) return;
    await api.post('/rainfall', form);
    setForm({ district: '', rainfall_amount: '', rainfall_date: '' });
    load();
  };

  const del = async (id) => {
    if (!isAdmin) return;
    if (confirm('Delete this rainfall entry?')) {
      await api.delete(`/rainfall/${id}`);
      load();
    }
  };

  const restore = async (id) => {
    if (!isAdmin) return;
    if (confirm('Do you want to restore this entry?')) {
      await api.put(`/rainfall/${id}/restore`);
      load();
    }
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  // Searching, Filtering & Sorting logic
  const filteredRows = rows
    .filter(row => {
      const matchSearch = row.district.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'rainfall_date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const handleExportCSV = () => {
    const exportData = filteredRows.map(({ rainfall_id, district, rainfall_amount, rainfall_date, is_deleted }) => ({
      ID: rainfall_id,
      District: district,
      'Amount (mm)': rainfall_amount,
      Date: rainfall_date,
      Status: is_deleted ? 'Archived' : 'Active'
    }));
    exportToCSV(exportData, 'rainfall_report');
  };

  const handleExportPDF = () => {
    const headers = ['ID', 'District', 'Rainfall Amount (mm)', 'Recorded Date', 'Status'];
    const dataRows = filteredRows.map(row => [
      row.rainfall_id,
      row.district,
      row.rainfall_amount + ' mm',
      new Date(row.rainfall_date).toLocaleDateString(),
      row.is_deleted ? 'Archived' : 'Active'
    ]);
    const summaryStats = {
      'Total Records': filteredRows.length,
      'Max Rainfall': filteredRows.length > 0 ? Math.max(...filteredRows.map(r => r.rainfall_amount)) + ' mm' : '—',
      'Average Rainfall': filteredRows.length > 0 ? (filteredRows.reduce((a, b) => a + b.rainfall_amount, 0) / filteredRows.length).toFixed(2) + ' mm' : '—'
    };
    const filters = {
      'Search district': search || 'All',
      'Show Archived': showDeleted ? 'Yes' : 'No'
    };
    exportToPDF('Rainfall Report', headers, dataRows, summaryStats, filters);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark">Rainfall Management</h1>
          <p className="text-secondary small">Add, search, and filter recorded daily rainfall data.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm fw-semibold shadow-sm px-3" onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm fw-semibold shadow-sm px-3" onClick={handleExportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Add Rainfall Form */}
      {canAdd && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
          <h5 className="fw-bold mb-3 text-secondary">Record Rainfall Entry</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold">District</label>
              <input placeholder="e.g. Coimbatore" className="form-control" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Rainfall amount (mm)</label>
              <input type="number" step="0.01" className="form-control" placeholder="e.g. 12.5" value={form.rainfall_amount}
                onChange={(e) => setForm({ ...form, rainfall_amount: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Date</label>
              <input type="date" className="form-control" value={form.rainfall_date}
                onChange={(e) => setForm({ ...form, rainfall_date: e.target.value })} required />
            </div>
          </div>
          <div className="mt-3"><button className="btn btn-primary px-4 fw-semibold">Save Entry</button></div>
        </form>
      )}

      {/* Filters bar */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search district..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          {isAdmin && (
            <div className="col-md-8 d-flex justify-content-md-end align-items-center gap-2 mt-md-0 mt-2">
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="showDeletedRain" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setCurrentPage(1); }} />
                <label className="form-check-label small fw-bold text-secondary" htmlFor="showDeletedRain">Show Archived (Soft-Deleted) Entries</label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rainfall table */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('rainfall_id')}>ID {sortField === 'rainfall_id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('district')}>District {sortField === 'district' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('rainfall_amount')}>Amount {sortField === 'rainfall_amount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('rainfall_date')}>Date {sortField === 'rainfall_date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center py-4 text-muted">No rainfall records found.</td>
                </tr>
              ) : (
                currentRows.map((r) => (
                  <tr key={r.rainfall_id} className={r.is_deleted ? 'table-secondary text-muted' : ''}>
                    <td>{r.rainfall_id}</td>
                    <td className="fw-bold">{r.district}</td>
                    <td><span className="badge bg-success px-3 py-1.5">{r.rainfall_amount} mm</span></td>
                    <td>{new Date(r.rainfall_date).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        {!r.is_deleted ? (
                          <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => del(r.rainfall_id)}>Delete</button>
                        ) : (
                          <button className="btn btn-sm btn-success fw-semibold" onClick={() => restore(r.rainfall_id)}>Restore</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
            <span className="small text-muted">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRows.length)} of {filteredRows.length} logs
            </span>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
