import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  LogOut, 
  PlayCircle, 
  Users, 
  History,
  Menu,
  X
} from 'lucide-react';
import NavLink from '../NavLink/NavLink';
import './Sidebar.css';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const getLinks = () => {
    if (role === 'student') {
      return [
        { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/mark', icon: CheckSquare, label: 'Mark Attendance' },
        { to: '/student/history', icon: Clock, label: 'My Attendance' },
      ];
    }
    if (role === 'teacher') {
      return [
        { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/teacher/session', icon: PlayCircle, label: 'Start Session' },
        { to: '/teacher/history', icon: History, label: 'View Attendance' },
      ];
    }
    if (role === 'admin') {
      return [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/users', icon: Users, label: 'Manage Users' },
        { to: '/admin/history', icon: History, label: 'All Attendance' },
      ];
    }
    return [];
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Hamburger Button - Only show when NOT open or rely on its own state */}
      {!mobileOpen && (
        <button className="mobile-toggle" onClick={toggleMobile}>
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        initial={false}
        animate={{ x: (window.innerWidth <= 768 && !mobileOpen) ? '-100%' : 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-role">{role?.charAt(0).toUpperCase() + role?.slice(1)} Portal</h2>
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="sidebar-nav">
          {getLinks().map((link) => (
            <div key={link.to} onClick={() => setMobileOpen(false)}>
              <NavLink to={link.to} icon={link.icon}>
                {link.label}
              </NavLink>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
