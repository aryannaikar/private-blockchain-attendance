import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { createStudent } from '../../services/api';
import './ManageUsers.css';

const ManageUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ name: '', rollNo: '', password: '' });
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await createStudent(form);
      setMsgType('success');
      setMsg(`✅ Student "${form.name}" (${form.rollNo}) registered successfully.`);
      setForm({ name: '', rollNo: '', password: '' });
      setShowForm(false);
    } catch (err) {
      setMsgType('error');
      setMsg('❌ ' + (err?.response?.data?.error || 'Failed to create student'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />

      <main className="dashboard-content">
        <header className="dashboard-header mb-0">
          <div>
            <h1>Manage Users</h1>
            <p>Register new students and manage blockchain access.</p>
          </div>
          <button className="btn-primary-icon" onClick={() => setShowForm(true)}>
            <UserPlus size={18} /> Add Student
          </button>
        </header>

        {msg && (
          <div className={`status-banner ${msgType}`} style={{ margin: '16px 0', padding: '10px 16px', borderRadius: '8px', background: msgType === 'success' ? '#D1FAE5' : '#FEE2E2', color: msgType === 'success' ? '#065F46' : '#991B1B' }}>
            {msg}
          </div>
        )}

        {/* Add Student Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Register New Student</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text" placeholder="Full Name" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="modal-input"
                />
                <input
                  type="text" placeholder="Roll Number (e.g. STU002)" required
                  value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value.toUpperCase() })}
                  className="modal-input"
                />
                <input
                  type="text" placeholder="Initial Password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="modal-input"
                />
                <button type="submit" className="btn-primary-icon" disabled={loading}>
                  {loading ? 'Registering…' : 'Register Student'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="users-card">
          <div className="users-header">
            <div className="search-wrapper border">
              <Search size={18} className="search-icon" />
              <input
                type="text" placeholder="Search…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <p style={{ padding: '20px', color: '#6B7280' }}>
            User list is stored in <code>backend/data/users.json</code>. Use the "Add Student" button to register new students via the blockchain admin API.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;
