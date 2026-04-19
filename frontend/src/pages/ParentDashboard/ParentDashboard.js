import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  RefreshCw,
  Calendar,
  ShieldAlert,
  TrendingUp,
  History as HistoryIcon,
  Award
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { getMyAttendance } from '../../services/api';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const rollNo = localStorage.getItem('rollNo'); 
  const parentName = localStorage.getItem('name') || 'Parent';
  const childName = localStorage.getItem('childName') || 'Child';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!rollNo) return;
    setLoading(true);
    try {
      const res = await getMyAttendance(rollNo);
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to load child attendance:", err);
    }
    setLoading(false);
  }, [rollNo]);

  useEffect(() => { load(); }, [load]);

  // Analytics
  const totalClasses = records.length;
  const proxyRecords = records.filter(r => r.proxyDetected);
  const validRecords = records.filter(r => !r.proxyDetected);
  
  const attendanceTarget = 40; // Example target
  const attendancePct = Math.min(100, Math.round((validRecords.length / attendanceTarget) * 100)) || 0;

  const chartData = [
    { name: 'Present', value: attendancePct },
    { name: 'Remaining', value: 100 - attendancePct },
  ];

  // Dynamic Weekly Participation Data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
  
  validRecords.forEach(r => {
    let ts = Number(r.timestamp);
    if (ts && ts < 1e11) ts *= 1000;
    const d = new Date(ts);
    const dayName = days[d.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName]++;
    }
  });

  const barData = Object.keys(dayCounts).map(day => ({
    name: day,
    count: dayCounts[day]
  }));

  const fmt = (ts) => {
    let t = Number(ts);
    if (t && t < 1e11) t *= 1000;
    return t ? new Date(t).toLocaleDateString() + ' ' + new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="parent" />

      <main className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <span className="section-label">PARENT PORTAL</span>
            <h1 className="dashboard-title">Welcome, {parentName}</h1>
            <p className="subtitle">Monitoring attendance for <strong>{childName}</strong> ({rollNo})</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <Link to="/parent/history" className="btn-primary">Full History</Link>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Summary Cards */}
          <div className="col-4">
            <div className="stat-card glass-card">
              <Award size={24} color="var(--primary)" />
              <div className="stat-info">
                <p>Attendance</p>
                <h3>{attendancePct}%</h3>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card glass-card">
              <TrendingUp size={24} color="var(--accent-green)" />
              <div className="stat-info">
                <p>Total Presence</p>
                <h3>{validRecords.length} Classes</h3>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card glass-card">
              <ShieldAlert size={24} color={proxyRecords.length > 0 ? "var(--error)" : "var(--text-muted)"} />
              <div className="stat-info">
                <p>Proxy Alerts</p>
                <h3>{proxyRecords.length} Detected</h3>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="col-5">
            <div className="visual-card glass-card">
              <h3>Yearly Progress</h3>
              <div className="chart-wrapper" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={80} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="var(--primary)" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center">
                   <span className="big-val">{attendancePct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-7">
            <div className="visual-card glass-card">
              <h3>Weekly Participation</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                    itemStyle={{ color: '#00D2FF' }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent List */}
          <div className="col-12">
             <section className="history-section-v2 glass-card">
                <div className="section-header">
                   <h3><HistoryIcon size={18} /> Recent Attendance Sessions</h3>
                </div>
                <div className="history-table-wrapper">
                   <table className="history-table">
                      <thead>
                         <tr>
                            <th>DATE & TIME</th>
                            <th>SESSION</th>
                            <th>TEACHER</th>
                            <th>STATUS</th>
                            <th>BLOCKCHAIN</th>
                         </tr>
                      </thead>
                      <tbody>
                         {records.slice(0, 5).map((r, i) => (
                           <tr key={i}>
                              <td>{fmt(r.timestamp)}</td>
                              <td>{r.sessionID || 'Lecture'}</td>
                              <td>{r.teacherName || 'Faculty'}</td>
                              <td>
                                 <span className={`status-badge ${r.proxyDetected ? 'danger' : 'success'}`}>
                                    {r.proxyDetected ? 'INVALID' : 'PRESENT'}
                                 </span>
                              </td>
                              <td>
                                 <code className="tx-hash">#{r.blockNumber || 'LOCAL'}</code>
                              </td>
                           </tr>
                         ))}
                         {records.length === 0 && (
                           <tr>
                              <td colSpan="5" className="empty-row">No records found for this student.</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;
