import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
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

      // Normalise to table format
      const formatted = res.data.map(r => ({
        studentId:      r.studentID,
        date:           r.timestamp ? new Date(r.timestamp * 1000).toLocaleDateString() : '—',
        time:           r.timestamp ? new Date(r.timestamp * 1000).toLocaleTimeString() : '—',
        teacherAddress: r.markedBy  || '—',
        blockNumber:    r.blockNumber?.toString() || '—',
      }));

      setRecords(formatted);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch records from blockchain.');
    } finally {
      setLoading(false);
    }
  }, [role, rollNo]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />

      <main className="dashboard-content">
        <header className="dashboard-header mb-0">
          <div>
            <h1>Attendance Records</h1>
            <p>
              {role === 'student'
                ? `Immutable records for ${rollNo} from the smart contract.`
                : 'Full attendance ledger exported from the smart contract.'}
            </p>
          </div>
          <button className="btn-secondary-icon" onClick={loadRecords} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="history-wrapper">
          {records.length === 0 && !loading && !error ? (
            <p className="empty-msg">No records found on the blockchain yet.</p>
          ) : (
            <AttendanceTable data={records} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AttendanceHistory;
