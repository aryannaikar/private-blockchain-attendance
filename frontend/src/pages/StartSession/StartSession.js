import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Square, Bluetooth, Users, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { markAttendanceTeacher } from '../../services/api';
import './StartSession.css';

const SESSION_DURATION = 180; // seconds

const StartSession = () => {
  const [sessionActive,     setSessionActive]     = useState(false);
  const [timeLeft,          setTimeLeft]          = useState(SESSION_DURATION);
  const [manualRollNo,      setManualRollNo]      = useState('');
  const [statusMsg,         setStatusMsg]         = useState('');
  const [msgType,           setMsgType]           = useState(''); // success | error

  const timerRef = useRef(null);

  // Derive ESP32 display status from session state
  // (Browser cannot use Bluetooth Classic — teacher controls ESP32 via Serial Monitor)
  const espStatus = sessionActive ? 'OPEN (BT)' : 'STANDBY';

  // Session countdown
  useEffect(() => {
    if (sessionActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0) {
      setSessionActive(false);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, timeLeft]);

  const toggleSession = () => {
    if (!sessionActive) {
      setTimeLeft(SESSION_DURATION);
      setSessionActive(true);
    } else {
      clearInterval(timerRef.current);
      setSessionActive(false);
    }
  };


  // Teacher manually marks a student on Teacher Node
  const markManual = async () => {
    if (!manualRollNo.trim()) return;
    try {
      const res = await markAttendanceTeacher(manualRollNo.trim());
      setMsgType('success');
      setStatusMsg(`✅ Marked ${manualRollNo}  TX: ${(res.data.txHash || '').slice(0, 14)}…`);
      setManualRollNo('');
    } catch (err) {
      setMsgType('error');
      setStatusMsg('❌ ' + (err?.response?.data?.error || 'Failed to mark attendance'));
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />

      <main className="dashboard-content session-content">
        <div className="session-card">
          <div className="session-header">
            <h2>Start Attendance Session</h2>
            <p>Broadcast network for students to verify presence.</p>
          </div>

          <div className="session-body">
            <div className="instructions-box">
              <h3><Bluetooth size={20} /> ESP32 Mode: <strong style={{ color: '#6366F1' }}>BLUETOOTH</strong></h3>
              <ol className="instructions-list">
                <li>Power on the ESP32 and open <strong>Serial Monitor</strong> in Arduino IDE.</li>
                <li>Type <strong>OPEN</strong> in Serial Monitor to start accepting attendance.</li>
                <li>Click <em>Start Session</em> below — students have 3 minutes to mark via their phones.</li>
                <li>Or use the manual form to mark a student by Roll No.</li>
              </ol>
            </div>

            <motion.div
              className={`timer-circle ${sessionActive ? 'active' : ''}`}
              animate={{
                boxShadow: sessionActive
                  ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 30px rgba(34, 197, 94, 0)']
                  : '0 0 0 0 rgba(0,0,0,0)',
              }}
              transition={{ repeat: sessionActive ? Infinity : 0, duration: 2 }}
            >
              <span className="time-display">{formatTime(timeLeft)}</span>
              <span className="time-label">{sessionActive ? 'Session Running' : 'Ready'}</span>
            </motion.div>

            <div className="live-stats">
              <div className="stat-pill">
                <Bluetooth size={18} />
                <span>ESP32: <strong style={{ color: sessionActive ? '#22C55E' : '#6B7280' }}>{espStatus}</strong></span>
              </div>
              <div className="stat-pill">
                <Clock size={18} />
                <span>{sessionActive ? 'Session Running' : 'Session Idle'}</span>
              </div>
            </div>

            <button
              className={`btn-session ${sessionActive ? 'btn-end' : 'btn-start'}`}
              onClick={toggleSession}
            >
              {sessionActive ? <><Square size={20} /> End Session</> : <><PlayCircle size={20} /> Start 3-Min Session</>}
            </button>

            {/* Manual mark section */}
            <div style={{ marginTop: '28px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Manual Mark by Roll No</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. STU001"
                  value={manualRollNo}
                  onChange={e => setManualRollNo(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                />
                <button className="btn-primary-small" onClick={markManual} style={{ whiteSpace: 'nowrap' }}>
                  Mark
                </button>
              </div>
              {statusMsg && (
                <p style={{ marginTop: '8px', fontSize: '13px', color: msgType === 'success' ? '#22C55E' : '#EF4444' }}>
                  {statusMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartSession;
