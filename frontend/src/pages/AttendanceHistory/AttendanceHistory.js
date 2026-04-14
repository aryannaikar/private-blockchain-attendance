import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, ShieldCheck, Clock, Archive, Filter, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import AttendanceTable from '../../components/AttendanceTable/AttendanceTable';
import { getAllAttendance, getMyAttendance } from '../../services/api';
import './AttendanceHistory.css';

const AttendanceHistory = () => {
  const role   = localStorage.getItem('role')   || 'teacher';
  const rollNo = localStorage.getItem('rollNo')  || '';

  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  
  // Advanced Filters State
  const [filterTeacher, setFilterTeacher] = useState('All');
  const [filterClass,   setFilterClass]   = useState('All');
  const [filterDay,     setFilterDay]     = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (role === 'student') {
        res = await getMyAttendance(rollNo);
      } else {
        res = await getAllAttendance();
      }

      const formatted = res.data.map(r => {
        let ts = Number(r.timestamp);
        if (ts && ts < 100000000000) ts *= 1000; 

        return {
          studentID:      r.studentID,
          sessionID:      r.sessionID || '—',
          teacherName:    r.teacherName || '—',
          timestamp:      ts,
          blockNumber:    r.blockNumber || '—',
          deviceID:       r.deviceID || '—',
          markedBy:       r.markedBy,
          status:         r.status
        };
      });

      setRecords(formatted);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  }, [role, rollNo]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // Derive unique teachers and classes for filters
  const teachers = useMemo(() => ['All', ...new Set(records.map(r => r.teacherName).filter(n => n && n !== '—'))], [records]);
  const classes  = useMemo(() => ['All', ...new Set(records.map(r => r.sessionID).filter(s => s && s !== '—'))], [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchTeacher = filterTeacher === 'All' || r.teacherName === filterTeacher;
      const matchClass   = filterClass === 'All' || r.sessionID === filterClass;
      const matchDay     = !filterDay || (r.timestamp && new Date(r.timestamp).toLocaleDateString() === new Date(filterDay).toLocaleDateString());
      return matchTeacher && matchClass && matchDay;
    });
  }, [records, filterTeacher, filterClass, filterDay]);

  const onChainCount = filteredRecords.filter(r => r.blockNumber && r.blockNumber !== '—').length;
  const localCount   = filteredRecords.length - onChainCount;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />

      <main className="dashboard-content">
        <header className="dashboard-header mb-0">
          <div className="header-info">
            <div className="badge-row">
              <span className="portal-badge">{role.toUpperCase()} PORTAL</span>
            </div>
            <h1>Attendance History</h1>
            <p className="subtitle">
              {role === 'student'
                ? `Detailed logs for student ${rollNo}`
                : 'Manage and filter attendance by teacher, day, or class slot.'}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-premium-refresh" onClick={loadRecords} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Sync Data'}</span>
            </button>
          </div>
        </header>

        {/* Filter Toolbar */}
        <section className="filter-toolbar premium-shadow">
          {/* Only students see the Teacher filter (teachers always see only their own) */}
          {role === 'student' && (
            <div className="filter-group">
              <label><Filter size={12} /> Teacher</label>
              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                {teachers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label><Clock size={12} /> Day</label>
            <input type="date" value={filterDay} onChange={e => setFilterDay(e.target.value)} />
          </div>

          <div className="filter-group">
            <label><Archive size={12} /> Class Slot</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {(filterTeacher !== 'All' || filterClass !== 'All' || filterDay) && (
            <button className="btn-clear-filters" onClick={() => { setFilterTeacher('All'); setFilterClass('All'); setFilterDay(''); }}>
              <X size={14} /> Clear
            </button>
          )}
        </section>

        <div className="summary-stats-row">
          <div className="stat-pill-modern">
            <Archive size={16} />
            <span>Records: <strong>{filteredRecords.length}</strong></span>
          </div>
          <div className="stat-pill-modern blockchain">
            <ShieldCheck size={16} />
            <span>On-Chain: <strong>{onChainCount}</strong></span>
          </div>
          <div className="stat-pill-modern local">
            <Clock size={16} />
            <span>Local: <strong>{localCount}</strong></span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="history-main-container">
          <AttendanceTable data={filteredRecords} />
        </div>
      </main>
    </div>
  );
};

export default AttendanceHistory;
