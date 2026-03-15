import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Search, Link as LinkIcon } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { markAttendanceStudent } from '../../services/api';
import { getDeviceId } from '../../services/fingerprint';
import './MarkAttendance.css';

const MarkAttendance = () => {
  const rollNo = localStorage.getItem('rollNo') || '';
  const [scanState,  setScanState]  = useState('idle'); // idle | scanning | found | verifying | success | error
  const [txHash,     setTxHash]     = useState('');
  const [sessionID, setSessionID] = useState('...');
  const [teacherName, setTeacherName] = useState('...');
  const [sessionOpen, setSessionOpen] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  // The Web Portal uses Node Verification, so we assume the session is open
  // and let the Blockchain/Student Node return an error if it's not.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { getActiveSession, getMyAttendance } = await import('../../services/api');
        const res = await getActiveSession();
        const slot = res.data.activeSlot;
        setSessionID(slot);
        setTeacherName(res.data.teacherName || 'Teacher');
        setSessionOpen(true);

        // Check if already marked for this session
        const historyRes = await getMyAttendance(rollNo);
        const alreadyPresent = historyRes.data.find(r => r.sessionID === slot);
        if (alreadyPresent) {
          setScanState('success');
          setTxHash(alreadyPresent.txHash || 'ALREADY_RECORDED');
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setSessionOpen(false);
      }
    };
    fetchSession();
  }, [rollNo]);

  const startScan = async () => {
    setScanState('scanning');
    setErrorMsg('');

    try {
      // 1. Check if Web Bluetooth API is available (only supported in Chrome/Edge, requires HTTPS or localhost)
      if (navigator.bluetooth) {
        
        // This will pop up a browser dialog asking the user to pair/select "Teacher_Attendance"
        // It acts as our 'scan' to prove the ESP32 is nearby in advertising mode
        await navigator.bluetooth.requestDevice({
          filters: [{ name: 'Teacher_Attendance' }],
          // acceptAllDevices: false
        });
        
        // If we reach here, they successfully found and selected it in the browser UI!
        setScanState('found');

      } else {
        // Fallback for Firefox/Safari etc: we just skip to Node Verification
        console.warn('Web Bluetooth API not supported on this browser. Proceeding to Node verification...');
        setScanState('found');
      }

    } catch (err) {
      // User cancelled the prompt, or no device found
      setScanState('error');
      setErrorMsg('Could not find Teacher_Attendance Bluetooth device. Make sure you are in the classroom.');
      return; // Stop here, do not mark
    }

    // 2. Small delay, then push the blockchain transaction
    setTimeout(async () => {
      setScanState('verifying');

      try {
        // Grab device fingerprint silently
        const deviceID = await getDeviceId();

        const res = await markAttendanceStudent(rollNo, deviceID, sessionID);
        setTxHash(res.data.txHash || '');
        setScanState('success');
      } catch (err) {
        const msg = err?.response?.data?.error || 'Failed to record attendance. Try again.';
        setErrorMsg(msg);
        setScanState('error');
      }
    }, 1500);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />

      <main className="dashboard-content attendance-content">
        <div className="attendance-scanner-card">
          <div className="scanner-header">
            <h2>IoT Attendance Verification</h2>
            <p>Connect to the classroom ESP32 device to verify your physical presence.</p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ padding: '6px 12px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#6366F1', fontWeight: '600', fontSize: '14px' }}>
                Slot: {sessionID}
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '12px', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: '600', fontSize: '14px' }}>
                With: {teacherName}
              </div>
            </div>
            {!sessionOpen && (
              <p style={{ color: '#EF4444', marginTop: '6px', fontSize: '14px' }}>
                ⚠ No active session detected. Session may not be open yet.
              </p>
            )}
          </div>

          <div className="scanner-body">
            <AnimatePresence mode="wait">

              {scanState === 'idle' && (
                <motion.div key="idle" className="state-content"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="pulse-button-wrapper">
                    <button className="scan-btn" onClick={startScan}>
                      <LinkIcon size={40} />
                    </button>
                  </div>
                  <h3>Tap to Verify Attendance</h3>
                  <p>Securely connect to your local Student Node to sign the blockchain transaction.</p>
                </motion.div>
              )}

              {scanState === 'scanning' && (
                <motion.div key="scanning" className="state-content"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="scanning-icon">
                    <Search size={48} color="#6366F1" />
                  </motion.div>
                  <h3>Connecting to Node...</h3>
                  <p>Establishing secure connection</p>
                </motion.div>
              )}

              {scanState === 'found' && (
                <motion.div key="found" className="state-content"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="network-found-box">
                    <CheckCircle2 size={24} color="#22C55E" />
                    <span className="network-name">NODE_CONNECTED</span>
                  </div>
                  <h3>Node Connected!</h3>
                  <p>Initiating handshake with Teacher Node...</p>
                </motion.div>
              )}

              {scanState === 'verifying' && (
                <motion.div key="verifying" className="state-content"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="blockchain-loader">
                    <LinkIcon size={32} />
                    <div className="loader-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </motion.div>
                  <h3>Recording to Blockchain</h3>
                  <p>Signing transaction via smart contract...</p>
                </motion.div>
              )}

              {scanState === 'success' && (
                <motion.div key="success" className="state-content success-state"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <CheckCircle2 size={64} className="success-icon" />
                  <h3>Attendance Marked!</h3>
                  <p>Your presence has been immutably recorded on the blockchain.</p>
                  <div className="transaction-details">
                    <div className="tx-row">
                      <span>Roll No:</span>
                      <span className="mono">{rollNo}</span>
                    </div>
                    {txHash && (
                      <div className="tx-row">
                        <span>Transaction Hash:</span>
                        <span className="mono">{txHash.slice(0,10)}…{txHash.slice(-6)}</span>
                      </div>
                    )}
                  </div>
                  <button className="btn-secondary mt-4" onClick={() => setScanState('idle')}>
                    Done
                  </button>
                </motion.div>
              )}

              {scanState === 'error' && (
                <motion.div key="error" className="state-content error-state"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <XCircle size={64} className="error-icon" />
                  <h3>Failed</h3>
                  <p>{errorMsg || 'Could not mark attendance. Try again.'}</p>
                  <button className="btn-primary mt-4" onClick={() => setScanState('idle')}>
                    Try Again
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarkAttendance;
