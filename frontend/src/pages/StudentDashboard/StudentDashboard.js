import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ArrowRight,
  RefreshCw,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { getMyAttendance } from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const rollNo = localStorage.getItem('rollNo') || 'S10450';
  const name   = localStorage.getItem('name')   || 'Student';

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

  const totalPossible  = 40;
  const totalPresent   = records.length;
  const attendancePct  = totalPossible
    ? Math.min(100, Math.round((totalPresent / totalPossible) * 100))
    : 0;

  const chartData = [
    { name: 'Present',   value: attendancePct },
    { name: 'Remaining', value: 100 - attendancePct },
  ];

  const recent = [...records].slice(0, 5);

  const fmt = (ts) => {
    let t = Number(ts);
    if (t && t < 1e11) t *= 1000;
    return t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />

      <main className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <span className="section-label" style={{ display: 'block', marginBottom: '6px', color: 'var(--primary)' }}>WELCOME, {name}</span>
            <h1 className="dashboard-title">STUDENT PORTAL</h1>
            <p className="subtitle">Track your blockchain-verified attendance</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <Link to="/student/mark" className="btn-primary">Mark Attendance</Link>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* ── Attendance Ring ─── */}
          <div className="col-4">
            <div className="progress-card glass-card">
              <h3>Overall Attendance</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={80} outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      startAngle={90} endAngle={-270}
                    >
                      <Cell fill="var(--primary)" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center">
                  <span className="percent-val">{attendancePct}%</span>
                  <span className="percent-label">Present</span>
                </div>
              </div>
              <div className="attendance-footer">
                <div className="footer-stat">
                  <span>{totalPresent}</span>
                  <p>Classes</p>
                </div>
                <div className="footer-stat">
                  <span>{Math.max(0, totalPossible - totalPresent)}</span>
                  <p>Absences</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Info Grid + Timeline ─── */}
          <div className="col-8">
            {/* Info boxes */}
            <div className="student-info-grid">
              <div className="info-box-v2 glass-card">
                <BookOpen size={22} color="var(--primary)" />
                <div className="box-content">
                  <p>Roll No</p>
                  <h4>{rollNo}</h4>
                </div>
              </div>
              <div className="info-box-v2 glass-card">
                <ShieldCheck size={22} color="var(--accent-green)" />
                <div className="box-content">
                  <p>Blockchain</p>
                  <h4>Verified Node</h4>
                </div>
              </div>
              <div className="info-box-v2 glass-card">
                <Calendar size={22} color="var(--warn)" />
                <div className="box-content">
                  <p>Semester</p>
                  <h4>Spring 2024</h4>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <section className="timeline-section glass-card">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <Link to="/student/history" className="view-all">
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="timeline-container">
                {recent.length === 0 && !loading && (
                  <p className="empty-timeline">No attendance records found yet.</p>
                )}
                {recent.map((r, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-left">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-content">
                      <div className="activity-info">
                        <h4>{r.sessionID || 'Class Session'}</h4>
                        <p>ESP32 Node • Block #{r.blockNumber || 'Local'}</p>
                      </div>
                      <div className="activity-right">
                        <div className="status-chip success">VERIFIED</div>
                        <span className="time">{fmt(r.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
