import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Wells from './pages/Wells.jsx';
import WaterLevels from './pages/WaterLevels.jsx';
import Rainfall from './pages/Rainfall.jsx';
import Alerts from './pages/Alerts.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';

function Protected({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-area">
        <Navbar />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const role = localStorage.getItem('role') || 'viewer';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/wells" element={<Protected><Wells /></Protected>} />
      <Route path="/water-levels" element={<Protected><WaterLevels /></Protected>} />
      <Route path="/rainfall" element={<Protected><Rainfall /></Protected>} />
      <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
      
      {role.toLowerCase() === 'admin' && (
        <>
          <Route path="/users" element={<Protected><Users /></Protected>} />
          <Route path="/audit-logs" element={<Protected><AuditLogs /></Protected>} />
        </>
      )}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

