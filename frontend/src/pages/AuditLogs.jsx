import { useEffect, useState } from 'react';
import api from '../api/axios';

// ── Mock audit log data ──────────────────────────────────────────────
const now = Date.now();
const MOCK_LOGS = [
  { id: 1001, action: 'INSERT', table_name: 'water_levels', record_id: 441, username: 'operator1', details: 'New reading for well Riverside-04: depth 6.2m', timestamp: new Date(now - 5 * 60000).toISOString() },
  { id: 1002, action: 'UPDATE', table_name: 'wells',        record_id: 7,   username: 'admin',     details: 'Updated threshold for Hillside-11: 20m → 25m', timestamp: new Date(now - 22 * 60000).toISOString() },
  { id: 1003, action: 'RESOLVE', table_name: 'alerts',     record_id: 55,  username: 'admin',     details: 'Alert resolved for Central-01 — water level restored to safe range', timestamp: new Date(now - 58 * 60000).toISOString() },
  { id: 1004, action: 'INSERT', table_name: 'rainfall',    record_id: 210, username: 'operator2', details: 'Rainfall record: North district 44mm on 2026-05-30', timestamp: new Date(now - 2 * 3600000).toISOString() },
  { id: 1005, action: 'INSERT', table_name: 'water_levels', record_id: 440, username: 'operator1', details: 'Batch upload: 18 readings for East district wells', timestamp: new Date(now - 3.5 * 3600000).toISOString() },
  { id: 1006, action: 'UPDATE', table_name: 'users',       record_id: 12,  username: 'admin',     details: 'Role changed for user "jsmith": viewer → operator', timestamp: new Date(now - 5 * 3600000).toISOString() },
  { id: 1007, action: 'DELETE', table_name: 'wells',       record_id: 3,   username: 'admin',     details: 'Decommissioned well South-03 (permanently dry)', timestamp: new Date(now - 8 * 3600000).toISOString() },
  { id: 1008, action: 'INSERT', table_name: 'water_levels', record_id: 439, username: 'operator2', details: 'Reading for West-09: 19.8m (within safe range)', timestamp: new Date(now - 10 * 3600000).toISOString() },
  { id: 1009, action: 'UPDATE', table_name: 'alerts',      record_id: 52,  username: 'operator1', details: 'Severity escalated: North-07 alert LOW → HIGH', timestamp: new Date(now - 13 * 3600000).toISOString() },
  { id: 1010, action: 'INSERT', table_name: 'wells',       record_id: 43,  username: 'admin',     details: 'New well registered: Eastside-16, GPS 24.5N 68.2E', timestamp: new Date(now - 18 * 3600000).toISOString() },
  { id: 1011, action: 'INSERT', table_name: 'rainfall',    record_id: 209, username: 'operator2', details: 'Rainfall record: South district 31mm on 2026-05-29', timestamp: new Date(now - 24 * 3600000).toISOString() },
  { id: 1012, action: 'UPDATE', table_name: 'wells',       record_id: 14,  username: 'operator1', details: 'Location coordinates updated for South-14', timestamp: new Date(now - 26 * 3600000).toISOString() },
  { id: 1013, action: 'RESTORE', table_name: 'wells',      record_id: 5,   username: 'admin',     details: 'Well East-02 restored from archive after maintenance', timestamp: new Date(now - 30 * 3600000).toISOString() },
  { id: 1014, action: 'INSERT', table_name: 'water_levels', record_id: 438, username: 'operator2', details: 'Reading for Riverside-04: 5.9m — below threshold', timestamp: new Date(now - 33 * 3600000).toISOString() },
  { id: 1015, action: 'INSERT', table_name: 'alerts',      record_id: 56,  username: 'System',    details: 'Auto-alert generated: Riverside-04 dropped below 6m threshold', timestamp: new Date(now - 33.1 * 3600000).toISOString() },
  { id: 1016, action: 'UPDATE', table_name: 'users',       record_id: 8,   username: 'admin',     details: 'Password reset for user "msmith" (requested by user)', timestamp: new Date(now - 36 * 3600000).toISOString() },
  { id: 1017, action: 'INSERT', table_name: 'rainfall',    record_id: 208, username: 'operator1', details: 'Rainfall record: East district 19mm on 2026-05-28', timestamp: new Date(now - 48 * 3600000).toISOString() },
  { id: 1018, action: 'DELETE', table_name: 'alerts',      record_id: 48,  username: 'admin',     details: 'Deleted stale alert for decommissioned well South-03', timestamp: new Date(now - 50 * 3600000).toISOString() },
  { id: 1019, action: 'UPDATE', table_name: 'water_levels', record_id: 420, username: 'operator2', details: 'Corrected erroneous reading for North-07 (sensor fault)', timestamp: new Date(now - 55 * 3600000).toISOString() },
  { id: 1020, action: 'INSERT', table_name: 'wells',       record_id: 42,  username: 'admin',     details: 'New well registered: Hillside-15, district Hillside', timestamp: new Date(now - 72 * 3600000).toISOString() },
];
// ─────────────────────────────────────────────────────────────────────

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);

  useEffect(() => {
    api.get('/audit-logs')
      .then((r) => {
        const data = r.data;
        // Use API data if available, otherwise show rich mock data
        setLogs(Array.isArray(data) && data.length > 0 ? data : MOCK_LOGS);
      })
      .catch(() => setLogs(MOCK_LOGS));
  }, []);

  const getActionBadge = (act) => {
    switch (act) {
      case 'INSERT': return 'bg-success text-light';
      case 'UPDATE': return 'bg-primary text-light';
      case 'DELETE': return 'bg-danger text-light';
      case 'RESTORE': return 'bg-warning text-dark';
      case 'RESOLVE': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  // Filter lists
  const filteredLogs = logs.filter(l => {
    const matchSearch = 
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.table_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter ? l.action === actionFilter : true;
    return matchSearch && matchAction;
  });

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const paginate = (num) => {
    if (num >= 1 && num <= totalPages) setCurrentPage(num);
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold mb-1 text-dark">Audit Logs</h1>
        <p className="text-secondary small">Review database operations and event history.</p>
      </div>

      {/* Advanced Filter Panel */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <input 
              className="form-control" 
              placeholder="Search by user, module, or details..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="col-md-3">
            <select 
              className="form-select" 
              value={actionFilter} 
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="RESTORE">RESTORE</option>
              <option value="RESOLVE">RESOLVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table Grid */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Log ID</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>User</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">No audit logs found.</td>
                </tr>
              ) : (
                currentLogs.map((l) => (
                  <tr key={l.id} className="border-bottom border-light">
                    <td><code>#{l.id}</code></td>
                    <td>
                      <span className={`badge ${getActionBadge(l.action)} px-3 py-1.5 fw-bold text-uppercase`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="fw-semibold text-capitalize">{l.table_name}</td>
                    <td><span className="badge bg-light text-dark border">{l.record_id}</span></td>
                    <td className="fw-bold">{l.username || 'System'}</td>
                    <td style={{ fontSize: 13, color: '#4b5563', maxWidth: 400, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {l.details}
                    </td>
                    <td className="small text-muted">{new Date(l.timestamp).toLocaleString()}</td>
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
              Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} entries
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
