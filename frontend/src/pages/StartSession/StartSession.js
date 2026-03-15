import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Square, Bluetooth, Users, Clock, AlertCircle, Usb, Trash2, Layers } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { markAttendanceTeacher, getActiveSession, setActiveSession, resetAttendance } from '../../services/api';
import './StartSession.css';

const CLASS_SLOTS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const StartSession = () => {
  const [sessionActive,     setSessionActive]     = useState(false);
  const [manualRollNo,      setManualRollNo]      = useState('');
  const [statusMsg,         setStatusMsg]         = useState('');
  const [msgType,           setMsgType]           = useState(''); // success | error
  const [activeSlot,        setActiveSlot]        = useState('Class 1');
  
  // Serial API States
  const [port, setPort] = useState(null);
  const [serialError, setSerialError] = useState('');

  // Derive ESP32 display status from session state
  const espStatus = sessionActive 
    ? 'BROADCASTING' 
    : port ? 'USB CONNECTED' : 'DISCONNECTED';

  // Check if Web Serial is supported
  const isSerialSupported = 'serial' in navigator;

  // Load active session status from backend on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getActiveSession();
        setActiveSlot(res.data.activeSlot || 'Class 1');
        setSessionActive(res.data.isOpen || false);
      } catch (err) {
        console.error("Failed to fetch session:", err);
      }
    };
    fetchSession();
  }, []);

  // Auto-reconnect to previously authorized ports on load
  useEffect(() => {
    if (isSerialSupported) {
      navigator.serial.getPorts().then(async (ports) => {
        if (ports.length > 0) {
          try {
            const autoPort = ports[0];
            await autoPort.open({ baudRate: 115200 });
            setPort(autoPort);
            // If session was active on backend, signal ESP to OPEN
            const res = await getActiveSession();
            if (res.data.isOpen) {
               // Send OPEN command to ESP just in case it was reset
               sendSerialToPort(autoPort, "OPEN");
            }
          } catch (err) {
            console.error("Auto-connect failed:", err);
          }
        }
      });
    }
  }, [isSerialSupported]);

  // Connect to ESP32 via USB
  const connectSerial = async () => {
    setSerialError('');
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      // Persist that we chose this port? (Browser handles this via getPorts usually)
    } catch (err) {
      setSerialError('Failed to connect: ' + err.message);
    }
  };

  // Disconnect from ESP32
  const disconnectSerial = async () => {
    if (port) {
      try {
        await port.close();
        setPort(null);
      } catch (err) {
        setSerialError('Failed to disconnect: ' + err.message);
      }
    }
  };

  // Helper to send a string command to the ESP32 (internal version)
  const sendSerialToPort = async (activePort, command) => {
    if (!activePort) return false;
    try {
      const encoder = new TextEncoder();
      const writer = activePort.writable.getWriter();
      await writer.write(encoder.encode(command + '\n'));
      writer.releaseLock();
      return true;
    } catch (err) {
      console.error('Serial send error:', err);
      return false;
    }
  };

  const sendSerialCommand = async (command) => {
    if (!port) {
      setSerialError('ESP32 not connected. Please connect via USB first.');
      return false;
    }
    return sendSerialToPort(port, command);
  };

  const handleSlotChange = async (slot) => {
    if (sessionActive) return;
    try {
      const teacherID = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      await setActiveSession({ 
        activeSlot: slot,
        teacherID,
        teacherName,
        isOpen: false // Slot change always starts with session closed
      });
      setActiveSlot(slot);
      setStatusMsg(`Success: ${slot} selected for Prof. ${teacherName}`);
      setMsgType('success');
    } catch (err) {
      setStatusMsg("Failed to update class slot.");
      setMsgType('error');
    }
  };

  const startSession = async () => {
    setSerialError('');
    if (!port) {
        setSerialError("Please connect the ESP32 via USB first.");
        return;
    }
    
    try {
      const teacherID = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');
      
      // Update backend BEFORE signaling ESP
      await setActiveSession({
        activeSlot,
        teacherID,
        teacherName,
        isOpen: true
      });

      const success = await sendSerialCommand("OPEN");
      if (success) {
        setSessionActive(true);
        setStatusMsg(`Attendance session started for ${activeSlot}`);
        setMsgType('success');
      }
    } catch (err) {
      setStatusMsg("Failed to start session on backend.");
      setMsgType('error');
    }
  };

  const endSession = async () => {
    try {
      const teacherID = localStorage.getItem('rollNo');
      const teacherName = localStorage.getItem('name');

      await setActiveSession({
        activeSlot,
        teacherID,
        teacherName,
        isOpen: false
      });

      await sendSerialCommand("CLOSE");
      setSessionActive(false);
      setStatusMsg(`Session closed for ${activeSlot}`);
      setMsgType('success');
    } catch (err) {
      // Even if serial fails, we end session on UI/Backend
      setSessionActive(false);
      setStatusMsg("Session ended (Serial sync may have failed).");
      setMsgType('error');
    }
  };

  const toggleSession = () => {
    if (!sessionActive) {
      startSession();
    } else {
      endSession();
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure? This will clear all local attendance records (the blockchain record remains).")) return;
    try {
      await resetAttendance();
      setStatusMsg("✅ Local records reset successfully.");
      setMsgType('success');
    } catch (err) {
      setStatusMsg("❌ Failed to reset records.");
      setMsgType('error');
    }
  };

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

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />

      <main className="dashboard-content session-content">
        <div className="session-card">
          <div className="session-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Attendance Session</h2>
                <p>Manage real-time attendance broadcasting.</p>
              </div>
              <button className="btn-secondary-icon" onClick={handleReset} title="Clear local records">
                <Trash2 size={16} /> Reset
              </button>
            </div>
          </div>

          <div className="session-body">
            
            {/* Class Slot Selection */}
            <div className="instructions-box" style={{ marginBottom: '24px', borderLeft: '4px solid #6366F1' }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#6366F1" /> Class Slot
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CLASS_SLOTS.map(slot => (
                  <button
                    key={slot}
                    disabled={sessionActive}
                    onClick={() => handleSlotChange(slot)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: sessionActive ? 'not-allowed' : 'pointer',
                      backgroundColor: activeSlot === slot ? '#6366F1' : '#F3F4F6',
                      color: activeSlot === slot ? '#FFFFFF' : '#4B5563',
                      border: 'none',
                      transition: 'all 0.2s',
                      opacity: sessionActive && activeSlot !== slot ? 0.5 : 1
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Serial Connection Panel */}
            <div className="instructions-box" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>
                <Usb size={20} /> ESP32 Status
              </h3>
              
              {!isSerialSupported && (
                <div style={{ color: '#EF4444', marginBottom: '10px', fontSize: '14px' }}>
                  ⚠ Web Serial API not supported in this browser.
                </div>
              )}

              {isSerialSupported && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {!port ? (
                    <button className="btn-primary-small" onClick={connectSerial}>
                      Connect ESP32
                    </button>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22C55E', fontWeight: '500' }}>
                        <Bluetooth size={16} /> USB Connected
                      </div>
                      <button className="btn-secondary-icon" onClick={disconnectSerial} style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              )}

              {serialError && (
                <div style={{ color: '#EF4444', marginTop: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> {serialError}
                </div>
              )}
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
              <Clock size={40} color={sessionActive ? '#22C55E' : '#6B7280'} />
              <span className="time-label" style={{ marginTop: '12px' }}>{sessionActive ? `${activeSlot} ON` : 'OFF'}</span>
            </motion.div>

            <div className="live-stats">
              <div className="stat-pill">
                <Bluetooth size={18} />
                <span>ESP: <strong style={{ color: sessionActive ? '#22C55E' : (port ? '#6366F1' : '#6B7280') }}>{espStatus}</strong></span>
              </div>
              <div className="stat-pill">
                <Users size={18} />
                <span>Slot: <strong>{activeSlot}</strong></span>
              </div>
            </div>

            <button
              className={`btn-session ${sessionActive ? 'btn-end' : 'btn-start'}`}
              onClick={toggleSession}
              disabled={!port}
              style={{ opacity: !port ? 0.6 : 1, cursor: !port ? 'not-allowed' : 'pointer' }}
            >
              {sessionActive ? <><Square size={20} /> End Session</> : <><PlayCircle size={20} /> Start Session</>}
            </button>
            
            {/* Manual mark section */}
            <div style={{ marginTop: '28px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', width: '100%' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Manual Attendance</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Student Roll No"
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
