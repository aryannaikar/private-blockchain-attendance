import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Database, PlayCircle, History, RefreshCw, Network } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import StatsCard from '../../components/StatsCard/StatsCard';
import { getAllAttendance, getNetworkStatus, teacherAPI } from '../../services/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const name = localStorage.getItem('name') || 'Teacher';

  const [records,     setRecords]     = useState([]);
  const [blockNumber, setBlockNumber] = useState('—');
  const [chainId,     setChainId]     = useState('—');
  const [loading,     setLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, netRes] = await Promise.all([
        getAllAttendance(),
        getNetworkStatus(teacherAPI),
      ]);
      setRecords(attRes.data);
      setBlockNumber(netRes.data.blockNumber);
      setChainId(netRes.data.chainId);
    } catch { /* show placeholders */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unique  = [...new Set(records.map(r => r.studentID))].length;
  const recent  = [...records].reverse().slice(0, 3);

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard — {name}</h1>
            <p>Manage classes and monitor blockchain attendance records.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-icon" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <Link to="/admin/users" className="btn-primary-icon">
              <Users size={18} /> Manage Users
            </Link>
          </div>
        </header>

        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatsCard title="Total Records"    value={loading ? '…' : records.length} icon={UserCheck} color="#22C55E" />
          <StatsCard title="Unique Students"  value={loading ? '…' : unique}          icon={Users}     color="#6366F1" />
          <StatsCard title="Block Number"     value={loading ? '…' : `#${blockNumber}`} icon={Database} color="#F59E0B" />
          <StatsCard title="Chain ID"         value={loading ? '…' : chainId}          icon={Network}   color="#8B5CF6" />
        </motion.div>

        <div className="teacher-grid">
          <section className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <div className="action-grid">
              <Link to="/teacher/session" className="action-box bg-indigo">
                <PlayCircle size={32} />
                <span>Start Session</span>
              </Link>
              <Link to="/teacher/history" className="action-box bg-green">
                <History size={32} />
                <span>View Records</span>
              </Link>
            </div>
          </section>

          <section className="todays-classes">
            <h2 className="section-title">Recent Blockchain Entries</h2>
            <div className="recent-list">
              {recent.length === 0 && !loading && (
                <p style={{ color: '#9CA3AF', padding: '8px' }}>No records yet.</p>
              )}
              {recent.map((r, i) => (
                <div key={i} className="recent-item">
                  <div className="recent-icon"><Database size={16} /></div>
                  <div className="recent-info">
                    <h4>{r.studentID}</h4>
                    <span>Block #{r.blockNumber}</span>
                  </div>
                  <div className="recent-stat">
                    {r.timestamp ? new Date(r.timestamp * 1000).toLocaleTimeString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
