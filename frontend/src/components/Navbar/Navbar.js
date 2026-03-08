import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import { Shield, Menu } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Shield className="logo-icon" size={28} />
          <span>BlockAttend</span>
        </Link>
        
        {isLanding && (
          <div className="navbar-center hidden-mobile">
            <a href="#features" className="nav-item">Features</a>
            <a href="#technology" className="nav-item">Technology</a>
            <a href="#architecture" className="nav-item">Architecture</a>
          </div>
        )}

        <div className="navbar-right">
          <Link to="/login" className="btn-login">Login</Link>
          {isLanding && <Link to="/login" className="btn-primary">Get Started</Link>}
          <button className="menu-btn"><Menu size={24} /></button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
