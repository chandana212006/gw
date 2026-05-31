import { useEffect, useState } from 'react';
import api from '../api/axios';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const blank = { well_name: '', district: '', taluk: '', latitude: '', longitude: '', threshold_level: '' };

export default function Wells() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);

  // Advanced States
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState('well_id');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(8);

  // Location detection states
  const [locLoading, setLocLoading] = useState(false);
  const [locSuccess, setLocSuccess] = useState('');
  const [locError, setLocError] = useState('');

  const role = localStorage.getItem('role') || 'viewer';
  const isAdmin = role.toLowerCase() === 'admin';
  const isOperator = role.toLowerCase() === 'operator';
  const canAdd = isAdmin || isOperator;

  const load = () => {
    api.get(`/wells?show_deleted=${showDeleted}`)
      .then((r) => setRows(r.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, [showDeleted]);

  // Geolocation Handler
  const detectLocation = () => {
    setLocLoading(true);
    setLocSuccess('');
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setLocSuccess('Location detected successfully!');
        setLocLoading(false);
      },
      (err) => {
        setLocError(`Failed to fetch location: ${err.message}. Please input coordinates manually.`);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canAdd) return;
    if (editId) await api.put(`/wells/${editId}`, form);
    else await api.post('/wells', form);
    setForm(blank); setEditId(null); load();
  };

  const edit = (w) => { setEditId(w.well_id); setForm({ ...w }); };
  
  const del = async (id) => { 
    if (confirm('Are you sure you want to soft delete this well? (Its data will be archived)')) { 
      await api.delete(`/wells/${id}`); 
      load(); 
    } 
  };

  const restore = async (id) => {
    if (confirm('Do you want to restore this well?')) {
      await api.put(`/wells/${id}/restore`);
      load();
    }
  };

  // Sorting handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  // Unique districts for filter dropdown
  const uniqueDistricts = [...new Set(rows.map(r => r.district))];

  // Filtering, Searching & Sorting calculations
  const filteredRows = rows
    .filter(row => {
      const matchSearch = 
        row.well_name.toLowerCase().includes(search.toLowerCase()) ||
        row.district.toLowerCase().includes(search.toLowerCase()) ||
        row.taluk.toLowerCase().includes(search.toLowerCase());
      
      const matchDistrict = districtFilter ? row.district === districtFilter : true;
      return matchSearch && matchDistrict;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  // Export handlers
  const handleExportCSV = () => {
    const exportData = filteredRows.map(({ well_id, well_name, district, taluk, latitude, longitude, threshold_level, is_deleted }) => ({
      ID: well_id,
      Name: well_name,
      District: district,
      Taluk: taluk,
      Latitude: latitude,
      Longitude: longitude,
      Threshold: threshold_level,
      Status: is_deleted ? 'Soft Deleted' : 'Active'
    }));
    exportToCSV(exportData, 'wells_report');
  };

  const handleExportPDF = () => {
    const headers = ['Well ID', 'Well Name', 'District', 'Taluk', 'Latitude', 'Longitude', 'Threshold level', 'Status'];
    const dataRows = filteredRows.map(row => [
      row.well_id,
      row.well_name,
      row.district,
      row.taluk,
      row.latitude,
      row.longitude,
      row.threshold_level + 'm',
      row.is_deleted ? 'Archived (Soft-Deleted)' : 'Active'
    ]);
    const summaryStats = {
      'Total Registered': filteredRows.length,
      'Active Wells': filteredRows.filter(r => !r.is_deleted).length,
      'Archived Wells': filteredRows.filter(r => r.is_deleted).length
    };
    const filters = {
      'Query Search': search || 'None',
      'District filter': districtFilter || 'All',
      'Show Archived': showDeleted ? 'Yes' : 'No'
    };
    exportToPDF('Wells Report', headers, dataRows, summaryStats, filters);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark">Wells Management</h1>
          <p className="text-secondary small">Add, update, search, and filter registered groundwater monitoring wells.</p>
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

      {/* Admin Add/Edit Form */}
      {canAdd && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
          <h5 className="fw-bold mb-3 text-secondary">{editId ? 'Edit Well' : 'Add New Well'}</h5>
          
          {locSuccess && <div className="alert alert-success py-2 px-3 small">{locSuccess}</div>}
          {locError && <div className="alert alert-warning py-2 px-3 small">{locError}</div>}

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Well Name</label>
              <input className="form-control" placeholder="e.g. Well-B3" value={form.well_name} onChange={(e) => setForm({ ...form, well_name: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">District</label>
              <input className="form-control" placeholder="e.g. Chennai" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Taluk</label>
              <input className="form-control" placeholder="e.g. Tambaram" value={form.taluk} onChange={(e) => setForm({ ...form, taluk: e.target.value })} required />
            </div>
            
            <div className="col-md-3">
              <label className="form-label small fw-bold">Threshold Level (depth limit, meters)</label>
              <input className="form-control" type="number" step="0.01" placeholder="e.g. 10.00" value={form.threshold_level} onChange={(e) => setForm({ ...form, threshold_level: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Latitude</label>
              <input className="form-control" type="number" step="0.000001" placeholder="Auto or manual input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Longitude</label>
              <input className="form-control" type="number" step="0.000001" placeholder="Auto or manual input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button type="button" className="btn btn-outline-info w-100 fw-semibold d-flex align-items-center justify-content-center gap-2" onClick={detectLocation} disabled={locLoading}>
                {locLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Detecting...
                  </>
                ) : (
                  'Detect My Location'
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary px-4 fw-semibold">{editId ? 'Update well details' : 'Register Well'}</button>
            {editId && <button type="button" className="btn btn-secondary px-3" onClick={() => { setEditId(null); setForm(blank); }}>Cancel</button>}
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search by name, district, taluk..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="col-md-5 d-flex justify-content-md-end justify-content-start align-items-center gap-2 mt-md-0 mt-2">
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="showDeletedSwitch" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setCurrentPage(1); }} />
                <label className="form-check-label small fw-bold text-secondary" htmlFor="showDeletedSwitch">Show Archived (Soft-Deleted) Wells</label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tables & Display */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('well_id')}>ID {sortField === 'well_id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('well_name')}>Name {sortField === 'well_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('district')}>District {sortField === 'district' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('taluk')}>Taluk {sortField === 'taluk' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('latitude')}>Lat {sortField === 'latitude' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('longitude')}>Lng {sortField === 'longitude' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('threshold_level')}>Threshold {sortField === 'threshold_level' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-4 text-muted">
                    No wells found matching the criteria.
                  </td>
                </tr>
              ) : (
                currentRows.map((w) => (
                  <tr key={w.well_id} className={w.is_deleted ? 'table-secondary text-muted' : ''}>
                    <td>{w.well_id}</td>
                    <td className="fw-bold">{w.well_name}</td>
                    <td>{w.district}</td>
                    <td>{w.taluk}</td>
                    <td>{w.latitude}</td>
                    <td>{w.longitude}</td>
                    <td><span className="badge bg-secondary">{w.threshold_level}m</span></td>
                    {isAdmin && (
                      <td>
                        {!w.is_deleted ? (
                          <>
                            <button className="btn btn-sm btn-outline-primary me-2 fw-semibold" onClick={() => edit(w)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => del(w.well_id)}>Delete</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-success fw-semibold" onClick={() => restore(w.well_id)}>Restore</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
            <span className="small text-muted">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRows.length)} of {filteredRows.length} wells
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
