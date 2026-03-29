import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Database, Activity, RefreshCw, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Sidebar from '../../components/Sidebar/Sidebar';
import StatsCard from '../../components/StatsCard/StatsCard';
import { getAllAttendance, getNetworkStatus, teacherAPI } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [records,     setRecords]     = useState([]);
  const [blockNumber, setBlockNumber] = useState(0);
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
      setBlockNumber(Number(netRes.data.blockNumber) || 0);
      setChainId(netRes.data.chainId);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build chart data: group records by day of week
  const weeklyData = ['Mon','Tue','Wed','Thu','Fri'].map(day => ({
    name: day,
    records: records.filter(r => {
      if (!r.timestamp) return false;
      const d = new Date(r.timestamp * 1000).getDay();
      return { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5 }[day] === d;
    }).length,
  }));

  const uniqueStudents = [...new Set(records.map(r => r.studentID))].length;

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>System Overview</h1>
            <p>Admin control panel for BlockAttend infrastructure.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-icon" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <Link to="/admin/users" className="btn-primary-icon">
              <UserPlus size={18} /> Add User
            </Link>
          </div>
        </header>

        <motion.div
          className="admin-stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatsCard title="Unique Students"  value={loading ? '…' : uniqueStudents}  icon={GraduationCap} color="#00D2FF" />
          <StatsCard title="Total Records"    value={loading ? '…' : records.length}  icon={Activity}      color="#00F260" />
          <StatsCard title="Chain ID"         value={loading ? '…' : chainId}         icon={Database}      color="#FBBF24" />
          <StatsCard title="Latest Block"     value={loading ? '…' : `#${blockNumber}`} icon={Database}    color="#FF4E50" />
        </motion.div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Records by Day of Week</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00D2FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name"    axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0D14', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#00D2FF' }}
                  />
                  <Area type="monotone" dataKey="records" stroke="#00D2FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Blockchain Block Progress</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[{ name: 'Current Block', blocks: blockNumber }]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 242, 96, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0A0D14', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#00F260' }}
                  />
                  <Bar dataKey="blocks" fill="#00F260" radius={[4, 4, 0, 0]} barSize={80} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
