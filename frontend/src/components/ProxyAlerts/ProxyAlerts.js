import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Check, X, RefreshCw, Smartphone, Users } from 'lucide-react';
import { getProxyAlerts, dismissProxyAlert } from '../../services/api';
import './ProxyAlerts.css';

const ProxyAlerts = () => {
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [newAlerts, setNewAlerts] = useState(new Set());

  const lastAlertsRef = useRef([]);

  const fetchAlerts = useCallback(async (isInitial = false) => {
    try {
      const res     = await getProxyAlerts();
      const fetched = res.data || [];

      if (!isInitial) {
        const prevKeys    = new Set(lastAlertsRef.current.map(a => `${a.deviceID}-${a.sessionID}`));
        const freshAlerts = fetched.filter(a => !prevKeys.has(`${a.deviceID}-${a.sessionID}`));

        if (freshAlerts.length > 0) {
          setNewAlerts(prev => {
            const next = new Set(prev);
            freshAlerts.forEach(a => next.add(`${a.deviceID}-${a.sessionID}`));
            return next;
          });
          if (Notification.permission === 'granted') {
            new Notification('Suspicious Attendance!', {
              body: `${freshAlerts.length} new proxy detection(s) found.`,
            });
          }
        }
      }

      setAlerts(fetched);
      lastAlertsRef.current = fetched;
    } catch (err) {
      console.error('Failed to fetch proxy alerts:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(true);
    const timer = setInterval(() => fetchAlerts(false), 10000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  const handleDismiss = async (deviceID, sessionID) => {
    try {
      await dismissProxyAlert(deviceID, sessionID);
      setAlerts(prev => prev.filter(a => !(a.deviceID === deviceID && a.sessionID === sessionID)));
      setNewAlerts(prev => {
        const next = new Set(prev);
        next.delete(`${deviceID}-${sessionID}`);
        return next;
      });
    } catch {
      alert('Failed to delete alert.');
    }
  };

  if (loading) {
    return (
      <div className="proxy-loading glass-card">
        <RefreshCw size={15} className="spin" />&nbsp; Checking detections…
      </div>
    );
  }

  return (
    <motion.div
      className={`proxy-card-v2 glass-card ${alerts.length > 0 ? 'has-alerts' : ''}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="proxy-header-v2">
        <div className="proxy-title-group">
          <h3>Proxy Alerts ({alerts.length})</h3>
          {alerts.length > 0 && <AlertTriangle size={17} className="warning-icon" />}
        </div>
      </div>

      <div className="proxy-list-v2">
        {alerts.length === 0 ? (
          <div className="proxy-empty-v2">
            <Shield size={24} color="var(--accent-green)" />
            <p>No suspicious activity detected</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert) => {
              const alertKey  = `${alert.deviceID}-${alert.sessionID}`;
              const students  = alert.students || [];
              const highRisk  = students.length > 2;
              const riskLabel = highRisk ? 'High Risk' : 'Med Risk';
              const riskCls   = highRisk ? 'high-risk' : 'med-risk';
              const shortDevice = alert.deviceID
                ? String(alert.deviceID).slice(0, 10) + '…'
                : 'Unknown';

              return (
                <motion.div
                  key={alertKey}
                  className="proxy-item-v2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="proxy-item-left">
                    {/* Top row: device + session + risk */}
                    <div className="alert-meta-row">
                      <div className="device-badge">
                        <Smartphone size={12} />
                        <span>{shortDevice}</span>
                      </div>
                      <span className="separator">|</span>
                      <span className="room">Session&nbsp;{alert.sessionID}</span>
                      <span className="separator">|</span>
                      <span className={`risk-tag ${riskCls}`}>{riskLabel}</span>
                    </div>

                    {/* All students on this device */}
                    <div className="students-label">
                      <Users size={12} />
                      <span>{students.length} student{students.length !== 1 ? 's' : ''} from same device:</span>
                    </div>
                    <div className="students-row">
                      {students.map((s, idx) => (
                        <span key={idx} className="student-chip">{s}</span>
                      ))}
                    </div>

                    {/* Timestamp */}
                    <div className="time-stamp">
                      Detected at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="proxy-item-right">
                    <div className="action-buttons">
                      <button
                        className="action-btn resolve"
                        onClick={() => handleDismiss(alert.deviceID, alert.sessionID)}
                        title="Resolve — mark as reviewed"
                      >
                        <Check size={13} />
                        <span>Resolve</span>
                      </button>
                      <button
                        className="action-btn dismiss"
                        onClick={() => handleDismiss(alert.deviceID, alert.sessionID)}
                        title="Dismiss"
                      >
                        <X size={13} />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default ProxyAlerts;
