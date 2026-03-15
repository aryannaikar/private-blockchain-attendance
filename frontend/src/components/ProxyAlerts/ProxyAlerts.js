import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Trash2 } from 'lucide-react';
import { getProxyAlerts, dismissProxyAlert } from '../../services/api';
import './ProxyAlerts.css';

const ProxyAlerts = () => {
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState({});

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getProxyAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch proxy alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const toggle = (i) =>
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const handleDismiss = async (deviceID, sessionID) => {
    if (!window.confirm("Are you sure you want to delete this suspicious detection record?")) return;
    
    try {
      await dismissProxyAlert(deviceID, sessionID);
      // Optimistic update
      setAlerts(prev => prev.filter(a => !(a.deviceID === deviceID && a.sessionID === sessionID)));
    } catch (err) {
      alert("Failed to delete alert. Please try again.");
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <motion.section
      className="proxy-alerts-section"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="proxy-alerts-header">
        <div className="proxy-alerts-title">
          <AlertTriangle size={20} className="proxy-icon" />
          <h2>Suspicious Attendance Detected</h2>
        </div>
        <span className="proxy-badge">{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
      </div>

      <div className="proxy-alerts-list">
        <AnimatePresence>
          {alerts.map((alert, i) => (
            <motion.div
              key={`${alert.deviceID}-${alert.sessionID}`}
              className="proxy-alert-card"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="proxy-alert-row">
                <div className="proxy-alert-left" onClick={() => toggle(i)}>
                  <Shield size={16} className="proxy-shield" />
                  <div>
                    <p className="proxy-device-label">Device Fingerprint</p>
                    <p className="proxy-device-id">{alert.deviceID}</p>
                  </div>
                </div>
                
                <div className="proxy-alert-actions">
                  <div className="proxy-alert-right" onClick={() => toggle(i)}>
                    <span className="proxy-student-count">
                      {alert.students.length} student{alert.students.length > 1 ? 's' : ''}
                    </span>
                    {expanded[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  
                  <button 
                    className="btn-delete-alert" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.deviceID, alert.sessionID);
                    }}
                    title="Delete Detection"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded[i] && (
                  <motion.div
                    className="proxy-students-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="proxy-session-info">
                      <p className="proxy-session-label">
                        Active Session: <strong>{alert.sessionID}</strong>
                      </p>
                    </div>

                    <p className="proxy-students-header">Suspicious IDs Used:</p>
                    <div className="proxy-student-tags">
                      {alert.students.map((s, j) => (
                        <span key={j} className="proxy-student-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default ProxyAlerts;
