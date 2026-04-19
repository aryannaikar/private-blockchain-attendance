import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle, Square, Bluetooth, Users, Clock,
  AlertCircle, Usb, Trash2, Layers, CheckCircle2, Mail
} from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { markAttendanceTeacher, getActiveSession, setActiveSession, resetAttendance, sendAbsenteeEmails } from '../../services/api';
import './StartSession.css';

const CLASS_SLOTS = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];

const StartSession = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [manualRollNo,  setManualRollNo]  = useState('');
  const [statusMsg,     setStatusMsg]     = useState('');
  const [msgType,       setMsgType]       = useState('');
  const [activeSlot,    setActiveSlot]    = useState('Class 1');
  const [port,          setPort]          = useState(null);
  const [serialError,   setSerialError]   = useState('');
  const [mailLoading,   setMailLoading]   = useState(false);

  const isSerialSupported = 'serial' in navigator;

  /* ── Fetch current session state on mount ─── */
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getActiveSession();
        setActiveSlot(res.data.activeSlot || 'Class 1');
        setSessionActive(res.data.isOpen || false);
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };
    fetchSession();
  }, []);

  /* ── Auto-reconnect previously granted ports ── */
  useEffect(() => {
    if (!isSerialSupported) return;
    navigator.serial.getPorts().then(async (ports) => {
      if (ports.length > 0) {
        try {
          const autoPort = ports[0];
          await autoPort.open({ baudRate: 115200 });
          setPort(autoPort);
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    });
  }, [isSerialSupported]);

  /* ── Serial helpers ───────────────────────── */
  const connectSerial = async () => {
    setSerialError('');
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
    } catch (err) {
      setSerialError('Failed to connect: ' + err.message);
    }
  };

  const disconnectSerial = async () => {
    if (!port) return;
    try {
      await port.close();
      setPort(null);
    } catch (err) {
      setSerialError('Failed to disconnect: ' + err.message);
    }
  };

  const sendSerial = async (command) => {
    if (!port) return false;
    try {
      const writer = port.writable.getWriter();
      await writer.write(new TextEncoder().encode(command + '\n'));
      writer.releaseLock();
      return true;
    } catch {
      return false;
    }
  };

  /* ── Slot change ─────────────────────────── */
  const handleSlotChange = async (slot) => {
    if (sessionActive) return;
    try {
      const teacherID   = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      await setActiveSession({ activeSlot: slot, teacherID, teacherName, isOpen: false });
      setActiveSlot(slot);
    } catch {
      setStatusMsg('Failed to update slot.');
      setMsgType('error');
    }
  };

  /* ── Session toggle ──────────────────────── */
  const startSession = async () => {
    if (!port) { setSerialError('Connect the ESP32 via USB first.'); return; }
    try {
      const teacherID   = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      await setActiveSession({ activeSlot, teacherID, teacherName, isOpen: true });
      await sendSerial('OPEN');
      setSessionActive(true);
      setStatusMsg(`Session started for ${activeSlot}`);
      setMsgType('success');
    } catch (err) {
      console.error("Start Session Error:", err);
      const errorMsg = err.response && err.response.data && err.response.data.error 
        ? err.response.data.error 
        : err.message;
      setStatusMsg(`Failed to start session: ${errorMsg}`);
      setMsgType('error');
    }
  };

  const endSession = async () => {
    try {
      const teacherID   = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      await setActiveSession({ activeSlot, teacherID, teacherName, isOpen: false });
      await sendSerial('CLOSE');
      setSessionActive(false);
      setStatusMsg(`Session closed for ${activeSlot}`);
      setMsgType('success');
    } catch (err) {
      console.error("End Session Error:", err);
      setSessionActive(false);
      const errorMsg = err.response && err.response.data && err.response.data.error 
        ? err.response.data.error 
        : err.message;
      setStatusMsg(`Session ended with error: ${errorMsg}`);
    }
  };

  const toggleSession = () => (sessionActive ? endSession() : startSession());

  /* ── Reset ───────────────────────────────── */
  const handleReset = async () => {
    if (!window.confirm('Clear all local attendance records? Blockchain record stays.')) return;
    try {
      await resetAttendance();
      setStatusMsg('Local records reset.');
      setMsgType('success');
    } catch {
      setStatusMsg('Reset failed.');
      setMsgType('error');
    }
  };

  /* ── Manual mark ─────────────────────────── */
  const markManual = async () => {
    if (!manualRollNo.trim()) return;
    try {
      const res = await markAttendanceTeacher(manualRollNo.trim());
      setMsgType('success');
      setStatusMsg(`Marked ${manualRollNo}  TX: ${(res.data.txHash || '').slice(0, 14)}…`);
      setManualRollNo('');
    } catch (err) {
      setMsgType('error');
      setStatusMsg(err?.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleSendMails = async () => {
    if (!window.confirm('Send absentee emails to parents for this session?')) return;
    setMailLoading(true);
    setStatusMsg('Finding absentees and sending emails...');
    try {
      const teacherID = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      const res = await sendAbsenteeEmails({ teacherID, teacherName, sessionID: activeSlot });
      setMsgType('success');
      setStatusMsg(res.data.message);
    } catch (err) {
      setMsgType('error');
      setStatusMsg(err?.response?.data?.error || 'Failed to send emails');
    } finally {
      setMailLoading(false);
    }
  };

  /* ── Render ──────────────────────────────── */
  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />

      <main className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">SESSION CONTROL</h1>
            <p className="subtitle">Manage real-time attendance broadcasting</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleReset}>
              <Trash2 size={16} /> Reset Records
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Main toggle card */}
          <div className="col-8">
            <div className="control-main glass-card">
              <div className="session-status-header">
                <h2>
                  {activeSlot} |{' '}
                  <span className={sessionActive ? 'status-open' : 'status-closed'}>
                    {sessionActive ? 'Open' : 'Closed'}
                  </span>
                </h2>
                <div className="live-clock">
                  <Clock size={15} />
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <motion.button
                className={`big-toggle-btn ${sessionActive ? 'active' : ''}`}
                onClick={toggleSession}
                disabled={!port}
                whileHover={{ scale: port ? 1.05 : 1 }}
                whileTap={{  scale: port ? 0.95 : 1 }}
              >
                <div className="glow-dot" />
                {sessionActive ? 'OPEN' : 'START'}
              </motion.button>

              <div className="session-meta">
                <div className="meta-item">
                  <span className="label">Started</span>
                  <span className="value">{sessionActive ? '—' : '--:--'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Active for</span>
                  <span className="value">{sessionActive ? '—' : '0 min'}</span>
                </div>
              </div>

              <div className="control-actions" style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" disabled={!sessionActive}>
                  <CheckCircle2 size={17} /> Verify Now
                </button>
                {!sessionActive && (
                  <button 
                    className="btn-secondary" 
                    onClick={handleSendMails} 
                    disabled={mailLoading}
                    style={{ border: '1px solid var(--primary)', color: 'var(--primary)', gap: '8px' }}
                  >
                    <Mail size={17} /> {mailLoading ? 'Sending...' : 'Mail Absentees'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Config sidebar */}
          <div className="col-4">
            <div className="config-card glass-card">
              <h3>Hardware Config</h3>

              <div className="config-list">
                {!isSerialSupported && (
                  <p className="error-text">⚠ Web Serial API not supported in this browser.</p>
                )}

                {isSerialSupported && (
                  <div className="hw-status-row">
                    <div className="hw-info">
                      <Usb size={18} color={port ? 'var(--primary)' : 'var(--text-muted)'} />
                      <span>ESP32 USB</span>
                    </div>
                    {port
                      ? <button className="btn-connected" onClick={disconnectSerial}>Connected</button>
                      : <button className="btn-connect"    onClick={connectSerial}>Connect</button>
                    }
                  </div>
                )}

                {serialError && <p className="error-text">{serialError}</p>}
              </div>

              <div className="slot-selector">
                <p className="section-label">SELECT SLOT</p>
                <div className="slot-grid">
                  {CLASS_SLOTS.map(slot => (
                    <button
                      key={slot}
                      className={`slot-btn ${activeSlot === slot ? 'active' : ''}`}
                      disabled={sessionActive}
                      onClick={() => handleSlotChange(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Manual entry */}
          <div className="col-12">
            <div className="manual-entry-card glass-card">
              <h3>Manual Attendance Entry</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="ENTER STUDENT ROLL NO"
                  value={manualRollNo}
                  onChange={e => setManualRollNo(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && markManual()}
                />
                <button className="btn-primary" onClick={markManual}>
                  MARK PRESENT
                </button>
              </div>
              {statusMsg && <p className={`status-msg ${msgType}`}>{statusMsg}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartSession;
