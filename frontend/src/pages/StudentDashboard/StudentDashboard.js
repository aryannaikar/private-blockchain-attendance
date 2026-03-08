import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, UserCheck, Percent, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import StatsCard from '../../components/StatsCard/StatsCard';
import { getMyAttendance } from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const rollNo = localStorage.getItem('rollNo') || '';
  const name   = localStorage.getItem('name')   || rollNo;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!rollNo) return;
    setLoading(true);
    try {
      const res = await getMyAttendance(rollNo);
      setRecords(res.data);
    } catch { /* show zeros */ }
    setLoading(false);
  }, [rollNo]);

  useEffect(() => { load(); }, [load]);

  const total  = records.length;
  const recent = [...records].reverse().slice(0, 3);

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Welcome, {name}</h1>
            <p>Your attendance overview — sourced directly from the blockchain.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-icon" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <Link to="/student/mark" className="btn-primary">Mark Attendance</Link>
          </div>
        </header>

        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatsCard title="Recorded On-Chain" value={loading ? '…' : total}  icon={UserCheck} color="#22C55E" />
          <StatsCard title="Roll No"           value={rollNo}                  icon={BookOpen}  color="#6366F1" />
          <StatsCard title="Last Block"
            value={recent[0]?.blockNumber ? `#${recent[0].blockNumber}` : '—'}
            icon={Percent} color="#F59E0B" />
        </motion.div>

        <section className="recent-activity">
          <div className="section-title-row">
            <h2>Recent Blockchain Records</h2>
            <Link to="/student/history" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="activity-card">
            {recent.length === 0 && !loading && (
              <p style={{ color: '#9CA3AF', padding: '16px' }}>No blockchain records found yet.</p>
            )}
            {recent.map((r, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon bg-success"><UserCheck size={20} /></div>
                <div className="activity-details">
                  <h4>{rollNo}</h4>
                  <p>Block #{r.blockNumber} • {(r.markedBy || '').slice(0, 14)}…</p>
                </div>
                <div className="activity-time">
                  {r.timestamp ? new Date(r.timestamp * 1000).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
