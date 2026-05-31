import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const [unread, setUnread] = useState(0);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || 'viewer';

  // Live clock — ticks every second
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const loadNotifications = () => {
    api.get('/notifications/unread-count')
      .then((r) => setUnread(r.data.count))
      .catch(() => {});

    api.get('/notifications')
      .then((r) => setList(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => {
    api.put('/notifications/mark-as-read')
      .then(() => {
        setUnread(0);
        loadNotifications();
      })
      .catch(() => {});
  };

  const roleBadgeColor = (r) => {
    switch (r.toLowerCase()) {
      case 'admin':    return { background: '#dbeafe', color: '#1e3a8a' };
      case 'operator': return { background: '#fef3c7', color: '#92400e' };
      default:         return { background: '#f0f4ff', color: '#3b5bdb' };
    }
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <nav className="app-topbar">
      {/* Left: live clock + system status */}
      <div className="topbar-info">
        {/* System Online pill */}
        <div className="topbar-status-pill">
          <span className="topbar-status-dot" />
          System Online
        </div>
        {/* Live clock */}
        <div className="topbar-clock">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="topbar-clock-time">{timeStr}</span>
          <span className="topbar-clock-date">{dateStr}</span>
        </div>
      </div>

      {/* Right: notification bell + user */}
      <div className="topbar-right">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setOpen(!open)}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && <span className="topbar-badge">{unread}</span>}
          </button>

          {open && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <strong>Notifications</strong>
                {unread > 0 && (
                  <button className="notif-mark-btn" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="notif-list">
                {list.length === 0 ? (
                  <div className="notif-empty">No notifications.</div>
                ) : (
                  list.map((n) => (
                    <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`}>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User card */}
        <div className="topbar-user">
          <div className="topbar-avatar">{username[0].toUpperCase()}</div>
          <div className="topbar-user-info">
            <div className="topbar-user-name">{username}</div>
            <div className="topbar-user-email" style={roleBadgeColor(role)}>
              {role.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
