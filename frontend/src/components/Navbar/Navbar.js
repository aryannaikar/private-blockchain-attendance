import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setIsOpen(false), [location]);

  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}
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
          <Link to="/login" className="btn-login hidden-mobile">Login</Link>
          {isLanding ? (
            <Link to="/login" className="btn-primary">Get Started</Link>
          ) : (
            <Link to="/" className="btn-login">Home</Link>
          )}
          
          <button 
            className="menu-btn" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="mobile-menu-content">
              {isLanding && (
                <>
                  <a href="#features" className="mobile-nav-item">Features</a>
                  <a href="#technology" className="mobile-nav-item">Technology</a>
                  <a href="#architecture" className="mobile-nav-item">Architecture</a>
                </>
              )}
              <Link to="/login" className="mobile-nav-item">Login</Link>
              <Link to="/login" className="mobile-btn-primary">Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
