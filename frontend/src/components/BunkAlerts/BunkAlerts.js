import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, RefreshCw, AlertCircle } from 'lucide-react';
import { getBunkAlerts } from '../../services/api';
import './BunkAlerts.css';

const BunkAlerts = () => {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBunkAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch bunk alerts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  if (alerts.length === 0 && !loading) return null;

  return (
    <motion.section 
      className="bunk-alerts-section"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="bunk-alerts-header">
        <div className="bunk-alerts-title">
          <UserMinus size={20} className="bunk-icon" />
          <h2>Bunking Detection Alerts</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-secondary-icon" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <span className="bunk-badge">{alerts.length} Flagged</span>
        </div>
      </div>

      <div className="bunk-card">
        <p className="bunk-description">
          The following students were marked present in the <strong>previous session</strong> but are currently missing from the <strong>active class</strong>.
        </p>

        <div className="bunk-list">
          <AnimatePresence>
            {alerts.map((alert, idx) => (
              <motion.div 
                key={idx} 
                className="bunk-item"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="bunk-avatar">
                  <AlertCircle size={20} />
                </div>
                <div className="bunk-info">
                  <h4>{alert.studentID}</h4>
                  <p>
                    {alert.prevSlot} ➜ <strong>Missing in {alert.currentSlot}</strong>
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};

export default BunkAlerts;

