import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.get('/users')
      .then((r) => setUsers(r.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess('');
    try {
      await api.post('/users', form);
      setForm({ username: '', password: '', role: 'viewer' });
      setSuccess('User registered successfully!');
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Registration failed.');
    }
  };

  const deleteUser = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        setSuccess('User account deleted.');
        load();
      } catch (e) {
        setErr(e.response?.data?.error || 'Failed to delete user.');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-danger text-light';
      case 'operator': return 'bg-warning text-dark';
      default: return 'bg-secondary text-light';
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold mb-1 text-dark">Users Management</h1>
        <p className="text-secondary small">Register, manage, and delete user accounts.</p>
      </div>

      <div className="row g-4">
        {/* Register form */}
        <div className="col-lg-4">
          <form onSubmit={submit} className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold text-secondary mb-3">Add New User</h5>

            {err && <div className="alert alert-danger py-2 px-3 small">{err}</div>}
            {success && <div className="alert alert-success py-2 px-3 small">{success}</div>}

            <div className="mb-3">
              <label className="form-label small fw-bold">Username</label>
              <input 
                className="form-control" 
                placeholder="e.g. jsmith" 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Length of 6+ chars recommended" 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Role</label>
              <select 
                className="form-select" 
                value={form.role} 
                onChange={(e) => setForm({ ...form, role: e.target.value })} 
                required
              >
                <option value="viewer">Viewer (Read Only)</option>
                <option value="operator">Operator (Add Data)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold py-2 mt-2">
              Add User Account
            </button>
          </form>
        </div>

        {/* Users list grid */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white py-3 border-bottom border-light">
              <strong className="fs-6 text-secondary">User Accounts</strong>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-bottom border-light">
                      <td>{u.user_id}</td>
                      <td className="fw-bold">{u.username}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(u.role)} px-3 py-1.5 text-uppercase fw-semibold`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(u.created_at).toLocaleString()}</td>
                      <td>
                        {u.username === 'admin' ? (
                          <span className="text-muted small">Root Account</span>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-danger fw-semibold px-2 py-1"
                            onClick={() => deleteUser(u.user_id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
