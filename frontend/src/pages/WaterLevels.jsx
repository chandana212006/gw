import { useEffect, useState } from 'react';
import api from '../api/axios';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function WaterLevels() {
  const [rows, setRows] = useState([]);
  const [wells, setWells] = useState([]);
  const [filter, setFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [form, setForm] = useState({ well_id: '', water_level: '' });
  
  // Advanced States
  const [sortField, setSortField] = useState('recorded_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const role = localStorage.getItem('role') || 'viewer';
  const isAdmin = role.toLowerCase() === 'admin';
  const isOperator = role.toLowerCase() === 'operator';
  const canAdd = isAdmin || isOperator;

  const load = () => {
    const q = filter ? `?well_id=${filter}&show_deleted=${showDeleted}` : `?show_deleted=${showDeleted}`;
    api.get(`/water-levels${q}`).then((r) => setRows(r.data));
  };

  useEffect(() => {
    api.get('/wells').then((r) => setWells(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [filter, showDeleted]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canAdd) return;
    await api.post('/water-levels', form);
    setForm({ well_id: '', water_level: '' });
    load();
  };

  const del = async (id) => {
    if (!isAdmin) return;
    if (confirm('Delete this reading? (This may affect historical alerts)')) {
      await api.delete(`/water-levels/${id}`);
      load();
    }
  };

  const restore = async (id) => {
    if (!isAdmin) return;
    if (confirm('Do you want to restore this reading?')) {
      await api.put(`/water-levels/${id}/restore`);
      load();
    }
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  // Filter/Sort rows
  const sortedRows = [...rows].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'recorded_at') {
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
  const currentRows = sortedRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  const handleExportCSV = () => {
    const exportData = sortedRows.map(({ measurement_id, well_name, district, water_level, recorded_at, is_deleted }) => ({
      ID: measurement_id,
      Well: well_name,
      District: district,
      Level: water_level,
      Timestamp: recorded_at,
      Status: is_deleted ? 'Archived' : 'Active'
    }));
    exportToCSV(exportData, 'water_levels_report');
  };

  const handleExportPDF = () => {
     const headers = ['ID', 'Well Name', 'District', 'Level (m)', 'Recorded At', 'Status'];
    const dataRows = sortedRows.map(row => [
      row.measurement_id,
      row.well_name,
      row.district,
      row.water_level + 'm',
      new Date(row.recorded_at).toLocaleString(),
      row.is_deleted ? 'Archived' : 'Active'
    ]);
    const summaryStats = {
      'Total Records': sortedRows.length,
      'Max Level': sortedRows.length > 0 ? Math.max(...sortedRows.map(r => r.water_level)) + 'm' : '—',
      'Min Level': sortedRows.length > 0 ? Math.min(...sortedRows.map(r => r.water_level)) + 'm' : '—'
    };
    const filters = {
       'Selected Well': filter ? wells.find(w => w.well_id == filter)?.well_name : 'All',
      'Show Archived': showDeleted ? 'Yes' : 'No'
    };
    exportToPDF('Water Levels Report', headers, dataRows, summaryStats, filters);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark">Water Levels</h1>
          <p className="text-secondary small">Record, search, and filter water depth readings.</p>
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

      {/* Insertion Form for Admins & Operators */}
      {canAdd && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
          <h5 className="fw-bold mb-3 text-secondary">Record Water Level</h5>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-bold">Select Well</label>
              <select className="form-select" value={form.well_id} onChange={(e) => setForm({ ...form, well_id: e.target.value })} required>
                <option value="">Select well...</option>
                {wells.filter(w => !w.is_deleted).map((w) => <option key={w.well_id} value={w.well_id}>{w.well_name} ({w.district})</option>)}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label small fw-bold">Water Level (meters)</label>
              <input type="number" step="0.01" className="form-control" placeholder="e.g. 8.45" value={form.water_level}
                onChange={(e) => setForm({ ...form, water_level: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100 fw-semibold">Insert Record</button>
            </div>
          </div>
          <small className="text-muted d-block mt-2">
            Note: Inserting a depth reading that exceeds the well threshold will automatically trigger an alert.
          </small>
        </form>
      )}

      {/* Advanced Filters */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <select className="form-select" value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Filter by Well: All Wells</option>
              {wells.map((w) => <option key={w.well_id} value={w.well_id}>{w.well_name}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="col-md-8 d-flex justify-content-md-end align-items-center gap-2 mt-md-0 mt-2">
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="showDeletedLevels" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setCurrentPage(1); }} />
                <label className="form-check-label small fw-bold text-secondary" htmlFor="showDeletedLevels">Show Archived (Soft-Deleted) Readings</label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table grid */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('measurement_id')}>ID {sortField === 'measurement_id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('well_name')}>Well Name {sortField === 'well_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('district')}>District {sortField === 'district' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('water_level')}>Level {sortField === 'water_level' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('recorded_at')}>Recorded At {sortField === 'recorded_at' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">
                    No readings found matching the filters.
                  </td>
                </tr>
              ) : (
                currentRows.map((r) => (
                  <tr key={r.measurement_id} className={r.is_deleted ? 'table-secondary text-muted' : ''}>
                    <td>{r.measurement_id}</td>
                    <td className="fw-bold">{r.well_name}</td>
                    <td>{r.district}</td>
                    <td><span className="badge bg-info text-dark fw-bold px-3 py-1.5">{r.water_level}m</span></td>
                    <td>{new Date(r.recorded_at).toLocaleString()}</td>
                    {isAdmin && (
                      <td>
                        {!r.is_deleted ? (
                          <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => del(r.measurement_id)}>Delete</button>
                        ) : (
                          <button className="btn btn-sm btn-success fw-semibold" onClick={() => restore(r.measurement_id)}>Restore</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
            <span className="small text-muted">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, sortedRows.length)} of {sortedRows.length} logs
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
