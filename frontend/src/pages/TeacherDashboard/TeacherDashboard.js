import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Database, PlayCircle, History, RefreshCw, Network,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import Sidebar from '../../components/Sidebar/Sidebar';
import ProxyAlerts from '../../components/ProxyAlerts/ProxyAlerts';
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

  const unique = [...new Set(records.filter(r => !r.proxyDetected).map(r => r.studentID))].length;
  const validRecords = records.filter(r => !r.proxyDetected);
  const totalStudents = 10; // Target total for percentage calculation

  // 1. Weekly Bar Data
  const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
  
  validRecords.forEach(r => {
    let ts = Number(r.timestamp);
    if (ts && ts < 1e11) ts *= 1000;
    const d = new Date(ts);
    const dayName = daysArr[d.getDay()];
    if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
  });

  const barData = Object.keys(dayCounts).map(day => ({
    day,
    value: Math.min(100, Math.round((dayCounts[day] / totalStudents) * 100))
  }));

  // 2. Trend Line Data (Most recent session's markers over time)
  const lineData = useMemo(() => {
    if (validRecords.length === 0) return [];
    return [...validRecords]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((r, i) => {
        let ts = Number(r.timestamp);
        if (ts && ts < 1e11) ts *= 1000;
        return {
          time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(((i + 1) / totalStudents) * 100)
        };
      });
  }, [validRecords]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />

      <main className="dashboard-content">
        {/* ════ Header ════ */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">TEACHER DASHBOARD</h1>
            <div className="header-info">
              <span>{dateStr}</span>
              <span className="separator">|</span>
              <span>{timeStr}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-text">
                <span className="welcome">Welcome,</span>
                <span className="name">{name}</span>
              </div>
              <div className="avatar">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00D2FF&color=000&size=80`}
                  alt="Avatar"
                />
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ marginLeft: 12 }}
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* ════ Stat Tiles ════ */}
          <div className="col-3">
            <div className="stat-card glass-card">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{loading ? '…' : validRecords.length}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="stat-card glass-card">
              <div className="stat-label">Unique Students</div>
              <div className="stat-value">{loading ? '…' : unique}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="stat-card glass-card">
              <div className="stat-label">Block Number</div>
              <div className="stat-value">#{loading ? '…' : blockNumber}</div>
            </div>
          </div>
          <div className="col-3">
            <div className="stat-card glass-card blockchain-status">
              <div className="status-header">
                <div className="stat-label">Blockchain Status</div>
                <div className="status-dot online" />
              </div>
              <div className="status-info">
                <span className="status-text green">Synced</span>
                <span className="node-id">| Chain #{loading ? '…' : chainId}</span>
              </div>
              <div className="last-block">Block: #{blockNumber}</div>
            </div>
          </div>

          {/* ════ Charts ════ */}
          <div className="col-6">
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h3>Live Attendance Trend</h3>
                <span className="chart-subtitle">Real-time occupancy</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00D2FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D2FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#1A1F2B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#00D2FF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00D2FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#00D2FF', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-6">
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h3>Weekly Attendance Summary</h3>
                <span className="chart-subtitle">Average per day (%)</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#1A1F2B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={i === 2 ? '#00F260' : 'rgba(0,242,96,0.35)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ════ Session preview ════ */}
          <div className="col-6">
            <div className="session-card-preview glass-card">
              <div className="session-info-main">
                <h3>
                  Session: CS301A |{' '}
                  <span className="status-open">Open</span>
                </h3>
                <Link to="/teacher/session" className="open-pill">
                  <span className="dot" />
                  OPEN
                </Link>
              </div>
              <div className="session-details-row">
                <span>Start: 09:30 AM</span>
                <span className="separator">|</span>
                <span>Active for 12 mins</span>
              </div>
              <div className="session-actions">
                <Link to="/teacher/session" className="btn-primary">Manage Session</Link>
              </div>
            </div>
          </div>

          {/* ════ Proxy Alerts ════ */}
          <div className="col-6">
            <ProxyAlerts />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
