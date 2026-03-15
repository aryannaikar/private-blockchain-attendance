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
  const recent = [...records].slice(0, 3); // Backend already sorts by timestamp desc

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Welcome, {name}</h1>
            <p>Your attendance overview — from server & blockchain.</p>
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
          <StatsCard title="Recorded Sessions" value={loading ? '…' : total}  icon={UserCheck} color="#22C55E" />
          <StatsCard title="Roll No"           value={rollNo}                  icon={BookOpen}  color="#6366F1" />
          <StatsCard title="Last Status"
            value={recent[0]?.status || '—'}
            icon={Percent} color="#F59E0B" />
        </motion.div>

        <section className="recent-activity">
          <div className="section-title-row">
            <h2>Recent Activity</h2>
            <Link to="/student/history" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="activity-card">
            {recent.length === 0 && !loading && (
              <p style={{ color: '#9CA3AF', padding: '16px' }}>No records found yet.</p>
            )}
            {recent.map((r, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon bg-success"><UserCheck size={20} /></div>
                <div className="activity-details">
                  <h4>{r.sessionID || 'Class Session'}</h4>
                  <p>Status: {r.status || 'Verified'} • {r.blockNumber ? `Block #${r.blockNumber}` : 'Local'}</p>
                </div>
                <div className="activity-time">
                  {(() => {
                    let ts = Number(r.timestamp);
                    if (ts && ts < 100000000000) ts *= 1000;
                    return ts ? new Date(ts).toLocaleString() : '—';
                  })()}
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