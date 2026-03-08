import React from 'react';
import { motion } from 'framer-motion';
import './StatsCard.css';

const StatsCard = ({ title, value, icon: Icon, trend, color }) => {
  return (
    <motion.div 
      className="stats-card"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="icon-wrapper" style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="card-body">
        <h2 className="card-value">{value}</h2>
        {trend && (
          <p className={`card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
