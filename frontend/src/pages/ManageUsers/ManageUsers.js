import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, X, RefreshCw, User, ShieldCheck, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { createUser, getUsers } from '../../services/api';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users,       setUsers]      = useState([]);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ name: '', rollNo: '', password: '', role: 'student' });
  const [msg,         setMsg]         = useState('');
  const [msgType,     setMsgType]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(false);
  const [activeTab,    setActiveTab]    = useState('all'); // all | student | teacher

  const [errorStatus, setErrorStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    setErrorStatus(false);
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setErrorStatus(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await createUser(form);
      setMsgType('success');
      setMsg(`✅ ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} "${form.name}" registered.`);
      setForm({ name: '', rollNo: '', password: '', role: 'student' });
      setShowForm(false);
      fetchUsers(); // Refresh list
    } catch (err) {
      setMsgType('error');
      setMsg('❌ ' + (err?.response?.data?.error || 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : [])
    .filter(u => {
      if (activeTab === 'all') return true;
      return u.role === activeTab;
    })
    .filter(u => 
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.rollNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.role === 'student' && b.role === 'student') {
        return (a.rollNo || "").localeCompare(b.rollNo || "", undefined, { numeric: true });
      }
      return 0;
    });

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />

      <main className="dashboard-content">
        <header className="dashboard-header mb-0">
          <div>
            <h1>Manage Users</h1>
            <p>Monitor and register teachers/students in the system.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary-icon" onClick={fetchUsers} disabled={fetching}>
              <RefreshCw size={18} className={fetching ? 'spin' : ''} />
            </button>
            <button className="btn-primary-icon" onClick={() => setShowForm(true)}>
              <UserPlus size={18} /> Add User
            </button>
          </div>
        </header>

        {errorStatus && (
          <div className="status-banner error" style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>Connection Error: Unable to reach the Admin Server (Port 5000). Please ensure <code>npm run servernode</code> is running.</span>
          </div>
        )}

        {msg && (
          <div className={`status-banner ${msgType}`} style={{ margin: '16px 0', padding: '10px 16px', borderRadius: '8px', background: msgType === 'success' ? '#D1FAE5' : '#FEE2E2', color: msgType === 'success' ? '#065F46' : '#991B1B' }}>
            {msg}
          </div>
        )}

        {/* Add User Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Register New User</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio" name="role" value="student"
                      checked={form.role === 'student'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    />
                    Student
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio" name="role" value="teacher"
                      checked={form.role === 'teacher'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    />
                    Teacher
                  </label>
                </div>

                <input
                  type="text" placeholder="Full Name" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="modal-input"
                />
                <input
                  type="text" placeholder={form.role === 'student' ? 'Roll Number (e.g. STU001)' : 'Teacher ID (e.g. TEACH01)'} required
                  value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value.toUpperCase() })}
                  className="modal-input"
                />
                <input
                  type="text" placeholder="Initial Password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="modal-input"
                />
                <button type="submit" className="btn-primary-icon" disabled={loading}>
                  {loading ? 'Registering…' : `Register ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="users-card">
          <div className="users-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '10px' }}>
              {['all', 'student', 'teacher'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
                    color: activeTab === tab ? '#111827' : '#6B7280',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                </button>
              ))}
            </div>

            <div className="search-wrapper border" style={{ maxWidth: '100%', width: '100%' }}>
              <Search size={18} className="search-icon" />
              <input
                type="text" placeholder="Search by name, ID or role…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>ID / Roll No</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={`user-avatar ${user.role}`}>
                            {user.role === 'teacher' ? <ShieldCheck size={16} /> : <User size={16} />}
                          </div>
                          <span style={{ fontWeight: 500 }}>{user.name}</span>
                        </div>
                      </td>
                      <td className="mono">{user.rollNo}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '13px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                          Active
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;
