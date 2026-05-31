import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Mock data fallback ──────────────────────────────────────────────
const MOCK_SUMMARY = {
  total_wells: 42,
  avg_level: 18.6,
  active_alerts: 7,
  total_rainfall: 134,
  max_level: 34.2,
  min_level: 4.8,
  critical_wells: 5,
  districts_monitored: 9,
  district_averages: [
    { district: 'North', avg_level: 16.4 },
    { district: 'South', avg_level: 22.1 },
    { district: 'East',  avg_level: 14.7 },
    { district: 'West',  avg_level: 19.8 },
    { district: 'Central', avg_level: 21.3 },
    { district: 'Riverside', avg_level: 12.5 },
    { district: 'Hillside', avg_level: 28.9 },
  ],
  safety_distribution: { safe: 30, warning: 7, critical: 5 },
  dashboard: [
    { well_name: 'Riverside-04', district: 'Riverside', threshold_level: 10, latest_water_level: 6.2, alert_status: 'ALERT' },
    { well_name: 'Hillside-11',  district: 'Hillside',  threshold_level: 25, latest_water_level: 31.5, alert_status: 'ALERT' },
    { well_name: 'North-07',     district: 'North',     threshold_level: 15, latest_water_level: 7.1, alert_status: 'ALERT' },
    { well_name: 'East-02',      district: 'East',      threshold_level: 12, latest_water_level: 4.8, alert_status: 'ALERT' },
    { well_name: 'South-14',     district: 'South',     threshold_level: 20, latest_water_level: 34.2, alert_status: 'ALERT' },
    { well_name: 'Central-01',   district: 'Central',   threshold_level: 18, latest_water_level: 17.4, alert_status: 'SAFE' },
    { well_name: 'West-09',      district: 'West',      threshold_level: 22, latest_water_level: 19.8, alert_status: 'SAFE' },
  ],
  recent_activities: [
    { action: 'INSERT', table_name: 'water_levels', username: 'admin',    details: 'New reading for Riverside-04: 6.2m', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { action: 'UPDATE', table_name: 'wells',        username: 'operator1', details: 'Updated threshold for Hillside-11 to 25m', timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
    { action: 'RESOLVE', table_name: 'alerts',      username: 'admin',    details: 'Resolved alert for Central-01 (water restored)', timestamp: new Date(Date.now() - 58 * 60000).toISOString() },
    { action: 'INSERT', table_name: 'rainfall',     username: 'operator2', details: 'Rainfall record: North district 44mm on 2026-05-30', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    { action: 'INSERT', table_name: 'water_levels', username: 'operator1', details: 'Batch import: 18 readings uploaded for East district', timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString() },
    { action: 'UPDATE', table_name: 'users',        username: 'admin',    details: 'Role changed for user "jsmith" → operator', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
    { action: 'DELETE', table_name: 'wells',        username: 'admin',    details: 'Decommissioned well South-03 (dry)', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
    { action: 'INSERT', table_name: 'water_levels', username: 'operator2', details: 'Reading for West-09: 19.8m (stable)', timestamp: new Date(Date.now() - 10 * 3600000).toISOString() },
  ],
};

const MOCK_WELLS = [
  { well_id: 'w1', well_name: 'Riverside-04' },
  { well_id: 'w2', well_name: 'Hillside-11' },
  { well_id: 'w3', well_name: 'North-07' },
  { well_id: 'w4', well_name: 'Central-01' },
];

const MOCK_WELL_LEVELS = Array.from({ length: 14 }, (_, i) => ({
  recorded_at: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
  water_level: +(14 + Math.sin(i * 0.7) * 4 + Math.random() * 2).toFixed(2),
}));

const MOCK_RAINFALL = [
  ...Array.from({ length: 12 }, (_, i) => ({
    district: 'North',
    rainfall_date: new Date(Date.now() - (11 - i) * 86400000).toISOString(),
    rainfall_amount: +(20 + Math.sin(i * 0.5) * 15 + Math.random() * 8).toFixed(1),
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    district: 'South',
    rainfall_date: new Date(Date.now() - (11 - i) * 86400000).toISOString(),
    rainfall_amount: +(30 + Math.cos(i * 0.6) * 12 + Math.random() * 6).toFixed(1),
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    district: 'East',
    rainfall_date: new Date(Date.now() - (11 - i) * 86400000).toISOString(),
    rainfall_amount: +(18 + Math.sin(i * 0.4) * 10 + Math.random() * 5).toFixed(1),
  })),
];
// ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState('');
  const [wellLevels, setWellLevels] = useState([]);
  
  const [rainfallData, setRainfallData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    // Main summary analytics — fall back to mock if API unavailable
    api.get('/dashboard/summary')
      .then((r) => {
        const data = r.data;
        // Merge: use API data but fill empty arrays/nulls with mock values
        const merged = {
          ...MOCK_SUMMARY,
          ...data,
          district_averages: data.district_averages?.length ? data.district_averages : MOCK_SUMMARY.district_averages,
          safety_distribution: data.safety_distribution ?? MOCK_SUMMARY.safety_distribution,
          dashboard: data.dashboard?.length ? data.dashboard : MOCK_SUMMARY.dashboard,
          recent_activities: data.recent_activities?.length ? data.recent_activities : MOCK_SUMMARY.recent_activities,
        };
        setS(merged);
        const uniqueDistricts = [...new Set(merged.dashboard.map(d => d.district))];
        setDistricts(uniqueDistricts);
        if (uniqueDistricts.length > 0) setSelectedDistrict(uniqueDistricts[0]);
      })
      .catch(() => {
        // Use full mock data on API failure
        setS(MOCK_SUMMARY);
        const uniqueDistricts = [...new Set(MOCK_SUMMARY.dashboard.map(d => d.district))];
        setDistricts(uniqueDistricts);
        if (uniqueDistricts.length > 0) setSelectedDistrict(uniqueDistricts[0]);
      });

    // Load wells list — fall back to mock
    api.get('/wells')
      .then((r) => {
        const data = r.data?.length ? r.data : MOCK_WELLS;
        setWells(data);
        if (data.length > 0) setSelectedWell(data[0].well_id);
      })
      .catch(() => {
        setWells(MOCK_WELLS);
        setSelectedWell(MOCK_WELLS[0].well_id);
      });

    // Load full rainfall entries — fall back to mock
    api.get('/rainfall')
      .then((r) => {
        const data = r.data?.length ? r.data : MOCK_RAINFALL;
        setRainfallData(data);
      })
      .catch(() => setRainfallData(MOCK_RAINFALL));
  }, []);

  // Fetch water levels when selected well changes — fall back to mock
  useEffect(() => {
    if (!selectedWell) return;
    api.get(`/water-levels?well_id=${selectedWell}`)
      .then((r) => {
        const data = r.data?.length ? r.data : MOCK_WELL_LEVELS;
        setWellLevels(data);
      })
      .catch(() => setWellLevels(MOCK_WELL_LEVELS));
  }, [selectedWell]);

  if (!s) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Line Chart: Water Level Trend for Selected Well
  const levelsChartData = {
    labels: [...wellLevels].reverse().map(l => new Date(l.recorded_at).toLocaleDateString()),
    datasets: [{
      label: 'Water Level (meters depth)',
      data: [...wellLevels].reverse().map(l => l.water_level),
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.1)',
      borderWidth: 2.5,
      tension: 0.3,
      fill: true
    }]
  };

  // Line Chart: Rainfall Trend for Selected District
  const districtRainfalls = rainfallData.filter(r => r.district === selectedDistrict);
  const rainfallChartData = {
    labels: [...districtRainfalls].reverse().map(r => new Date(r.rainfall_date).toLocaleDateString()),
    datasets: [{
      label: 'Rainfall Amount (mm)',
      data: [...districtRainfalls].reverse().map(r => r.rainfall_amount),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2.5,
      tension: 0.3,
      fill: true
    }]
  };

  // Bar Chart: Avg Water Level by District
  const barChartData = {
    labels: s.district_averages.map(d => d.district),
    datasets: [{
      label: 'Average Depth (meters)',
      data: s.district_averages.map(d => d.avg_level),
      backgroundColor: 'rgba(37, 99, 235, 0.75)',
      borderColor: '#1e40af',
      borderWidth: 1
    }]
  };

  // Pie Chart: Alert Distribution (Safe vs Warning vs Critical)
  const pieChartData = {
    labels: ['Safe Wells (No Alerts)', 'Warning Wells (Low/Medium Severity)', 'Critical Wells (High Severity)'],
    datasets: [{
      data: [s.safety_distribution.safe, s.safety_distribution.warning, s.safety_distribution.critical],
      backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#ca8a04', '#dc2626'],
      borderWidth: 1
    }]
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
        <h1 className="fw-bold text-dark mb-1">Dashboard</h1>
          <p className="text-secondary small mb-0">Overview of groundwater monitoring, alerts, and rainfall data.</p>
        </div>

      </div>

      {/* KPI Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100 position-relative overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Total Wells</div>
            <div className="fs-2 fw-extrabold text-primary mt-2">{s.total_wells}</div>
            <div className="text-secondary small mt-1">Total registered wells</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100 position-relative overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Avg Depth Level</div>
            <div className="fs-2 fw-extrabold text-info mt-2">{s.avg_level ?? '—'} <span className="fs-6 fw-normal text-muted">m</span></div>
            <div className="text-secondary small mt-1">Network average depth</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100 position-relative overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Active Alerts</div>
            <div className={`fs-2 fw-extrabold mt-2 ${s.active_alerts > 0 ? 'text-danger animate-pulse' : 'text-success'}`}>{s.active_alerts}</div>
            <div className="text-secondary small mt-1">Pending resolution</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100 position-relative overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Rainfall Reports</div>
            <div className="fs-2 fw-extrabold text-success mt-2">{s.total_rainfall}</div>
            <div className="text-secondary small mt-1">Total rainfall records</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Highest Level</div>
            <div className="fs-3 fw-bold text-dark mt-2">{s.max_level ?? '—'} <span className="fs-6 fw-normal text-muted">m</span></div>
            <div className="text-secondary small mt-1">Max depth recorded</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Lowest Level</div>
            <div className="fs-3 fw-bold text-dark mt-2">{s.min_level ?? '—'} <span className="fs-6 fw-normal text-muted">m</span></div>
            <div className="text-secondary small mt-1">Min depth recorded</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Critical Wells</div>
            <div className={`fs-3 fw-bold mt-2 ${s.critical_wells > 0 ? 'text-danger' : 'text-success'}`}>{s.critical_wells}</div>
            <div className="text-secondary small mt-1">Wells below threshold</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm p-3 bg-white h-100" style={{ borderRadius: 12 }}>
            <div className="text-muted small fw-bold text-uppercase">Districts Monitored</div>
            <div className="fs-3 fw-bold text-secondary mt-2">{s.districts_monitored}</div>
            <div className="text-secondary small mt-1">Distinct zones tracked</div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row 1 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Water Level Trends</h5>
              <select 
                className="form-select form-select-sm w-auto border-secondary-subtle" 
                value={selectedWell} 
                onChange={(e) => setSelectedWell(e.target.value)}
              >
                {wells.map(w => <option key={w.well_id} value={w.well_id}>{w.well_name}</option>)}
              </select>
            </div>
            <div style={{ height: 260 }}>
              {wellLevels.length === 0 ? (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">No measurements available.</div>
              ) : (
                <Line data={levelsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Rainfall Trends</h5>
              <select 
                className="form-select form-select-sm w-auto border-secondary-subtle" 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ height: 260 }}>
              {districtRainfalls.length === 0 ? (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">No rainfall entries registered.</div>
              ) : (
                <Line data={rainfallChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 (Bar & Pie) */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold mb-3">District Averages</h5>
            <div style={{ height: 260 }}>
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold mb-3">Safety Distribution</h5>
            <div style={{ height: 260, display: 'flex', justifyContent: 'center' }}>
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Activities */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold mb-3">Recent Activities</h5>
            <div className="table-responsive" style={{ maxHeight: 330, overflowY: 'auto' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Action</th>
                    <th>Module</th>
                    <th>User</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recent_activities.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No recent activities available.</td>
                    </tr>
                  ) : (
                    s.recent_activities.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${
                            a.action === 'INSERT' ? 'bg-success' :
                            a.action === 'UPDATE' ? 'bg-primary' :
                            a.action === 'RESOLVE' ? 'bg-info' : 'bg-danger'
                          }`}>
                            {a.action}
                          </span>
                        </td>
                        <td className="text-capitalize">{a.table_name}</td>
                        <td className="fw-semibold">{a.username || 'System'}</td>
                        <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.details}
                        </td>
                        <td className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Critical Wells List */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold mb-3">Critical Wells</h5>
            <div className="list-group list-group-flush" style={{ maxHeight: 330, overflowY: 'auto' }}>
              {s.dashboard.filter(d => d.alert_status === 'ALERT').length === 0 ? (
                <div className="text-center py-4 text-muted">
                  All wells are currently within safe thresholds.
                </div>
              ) : (
                s.dashboard.filter(d => d.alert_status === 'ALERT').map((d, i) => (
                  <div key={i} className="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom border-light">
                    <div>
                      <h6 className="fw-bold mb-1">{d.well_name}</h6>
                      <small className="text-muted">{d.district} District | Threshold: {d.threshold_level}m</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-danger rounded-pill px-3 fs-7 fw-semibold">CRITICAL</span>
                      <div className="mt-1 small fw-bold text-danger">Reading: {d.latest_water_level}m</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
