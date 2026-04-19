import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, X, RefreshCw, User, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { createUser, getUsers, deleteUser } from '../../services/api';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users,       setUsers]      = useState([]);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ 
    name: '', 
    rollNo: '', 
    password: '', 
    role: 'student',
    parentName: '',
    parentEmail: '',
    parentID: '',
    parentPassword: ''
  });
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
      setForm({ 
        name: '', rollNo: '', password: '', role: 'student',
        parentName: '', parentEmail: '', parentID: '', parentPassword: ''
      });
      setShowForm(false);
      fetchUsers(); // Refresh list
    } catch (err) {
      setMsgType('error');
      setMsg('❌ ' + (err?.response?.data?.error || 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rollNo) => {
    if (!window.confirm(`Are you sure you want to delete user ${rollNo}? This action cannot be undone.`)) return;
    
    setLoading(true);
    setMsg('');
    try {
      await deleteUser(rollNo);
      setMsgType('success');
      setMsg(`✅ User ${rollNo} removed successfully.`);
      fetchUsers(); // Refresh list
    } catch (err) {
      setMsgType('error');
      setMsg('❌ ' + (err?.response?.data?.error || 'Failed to delete user'));
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#fff' }}>
                <h2>Register New User</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }} onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}>
                    <input
                      type="radio" name="role" value="student"
                      checked={form.role === 'student'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    Student
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}>
                    <input
                      type="radio" name="role" value="teacher"
                      checked={form.role === 'teacher'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
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

                {form.role === 'student' && (
                  <>
                    <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
                    <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800', marginBottom: '4px' }}>PARENT DETAILS</p>
                    <input
                      type="text" placeholder="Parent Name" required
                      value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })}
                      className="modal-input"
                    />
                    <input
                      type="email" placeholder="Parent Email" required
                      value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })}
                      className="modal-input"
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text" placeholder="Parent ID" required
                        value={form.parentID} onChange={e => setForm({ ...form, parentID: e.target.value })}
                        className="modal-input"
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text" placeholder="Parent Pass" required
                        value={form.parentPassword} onChange={e => setForm({ ...form, parentPassword: e.target.value })}
                        className="modal-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary-icon" disabled={loading}>
                  {loading ? 'Registering…' : `Register ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="users-card">
          <div className="users-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
              {['all', 'student', 'teacher'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                    color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                    boxShadow: activeTab === tab ? '0 0 15px var(--primary-glow)' : 'none'
                  }}
                >
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) + 's'}
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
                  <th>Actions</th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '13px', fontWeight: 600 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green-glow)' }}></div>
                          Active
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(user.rollNo)}
                          title="Delete User"
                          style={{
                            background: 'rgba(255, 78, 80, 0.1)',
                            border: '1px solid rgba(255, 78, 80, 0.2)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 78, 80, 0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        >
                          <Trash2 size={18} />
                        </button>
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
