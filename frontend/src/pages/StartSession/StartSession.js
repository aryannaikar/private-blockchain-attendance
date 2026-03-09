import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Square, Bluetooth, Users, Clock, AlertCircle, Usb } from 'lucide-react';
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
  
  // Serial API States
  const [port, setPort] = useState(null);
  const [serialError, setSerialError] = useState('');

  const timerRef = useRef(null);

  // Derive ESP32 display status from session state
  const espStatus = sessionActive 
    ? 'BROADCASTING' 
    : port ? 'USB CONNECTED' : 'DISCONNECTED';

  // Check if Web Serial is supported
  const isSerialSupported = 'serial' in navigator;

  // Session countdown
  useEffect(() => {
    if (sessionActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0) {
      if (sessionActive) {
        // Automatically close when time runs out
        endSession();
      }
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, timeLeft]);

  // Auto-reconnect to previously authorized ports on load
  useEffect(() => {
    if (isSerialSupported) {
      navigator.serial.getPorts().then(async (ports) => {
        if (ports.length > 0) {
          try {
            const autoPort = ports[0];
            await autoPort.open({ baudRate: 115200 });
            setPort(autoPort);
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
      await selectedPort.open({ baudRate: 115200 }); // Standard ESP32 baud rate
      setPort(selectedPort);
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
        if (sessionActive) setSessionActive(false);
      } catch (err) {
        setSerialError('Failed to disconnect: ' + err.message);
      }
    }
  };

  // Helper to send a string command to the ESP32
  const sendSerialCommand = async (command) => {
    if (!port) {
      setSerialError('ESP32 not connected. Please connect via USB first.');
      return false;
    }
    
    try {
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(encoder.encode(command + '\n'));
      writer.releaseLock();
      return true;
    } catch (err) {
      setSerialError('Error sending command: ' + err.message);
      return false;
    }
  };

  const startSession = async () => {
    setSerialError('');
    if (!port) {
        setSerialError("Please connect the ESP32 via USB first.");
        return;
    }
    const success = await sendSerialCommand("OPEN");
    if (success) {
      setTimeLeft(SESSION_DURATION);
      setSessionActive(true);
    }
  };

  const endSession = async () => {
    const success = await sendSerialCommand("CLOSE");
    if (success || !port) { // IF port was disconnected, force end session anyway
      clearInterval(timerRef.current);
      setSessionActive(false);
    }
  };

  const toggleSession = () => {
    if (!sessionActive) {
      startSession();
    } else {
      endSession();
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
            
            {/* Serial Connection Panel */}
            <div className="instructions-box" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>
                <Usb size={20} /> ESP32 Connection
              </h3>
              
              {!isSerialSupported && (
                <div style={{ color: '#EF4444', marginBottom: '10px', fontSize: '14px' }}>
                  ⚠ Your browser does not support the Web Serial API. Please use Chrome or Edge to connect to the ESP32.
                </div>
              )}

              {isSerialSupported && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {!port ? (
                    <button className="btn-primary-small" onClick={connectSerial}>
                      Connect ESP32 (USB)
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
              <span className="time-display">{formatTime(timeLeft)}</span>
              <span className="time-label">{sessionActive ? 'Session Running' : 'Ready'}</span>
            </motion.div>

            <div className="live-stats">
              <div className="stat-pill">
                <Bluetooth size={18} />
                <span>ESP32: <strong style={{ color: sessionActive ? '#22C55E' : (port ? '#6366F1' : '#6B7280') }}>{espStatus}</strong></span>
              </div>
              <div className="stat-pill">
                <Clock size={18} />
                <span>{sessionActive ? 'Session Running' : 'Session Idle'}</span>
              </div>
            </div>

            <button
              className={`btn-session ${sessionActive ? 'btn-end' : 'btn-start'}`}
              onClick={toggleSession}
              disabled={!port}
              style={{ opacity: !port ? 0.6 : 1, cursor: !port ? 'not-allowed' : 'pointer' }}
            >
              {sessionActive ? <><Square size={20} /> End Session</> : <><PlayCircle size={20} /> Start 3-Min Session</>}
            </button>
            
            {!port && (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '8px' }}>
                Connect the ESP32 via USB to start the session.
              </p>
            )}

            {/* Manual mark section */}
            <div style={{ marginTop: '28px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', width: '100%' }}>
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
