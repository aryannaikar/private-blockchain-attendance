import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileQuestion, AlertCircle } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <motion.div 
        className="not-found-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="icon-404">
          <AlertCircle size={80} />
        </div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The attendance record or specific page you're searching for does not exist or you don't have access to it.</p>
        
        <Link to="/" className="btn-primary mt-4">
          Go Back Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
