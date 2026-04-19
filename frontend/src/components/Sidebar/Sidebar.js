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
  X,
  GraduationCap
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
        { to: '/student',         icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/mark',    icon: CheckSquare,     label: 'Mark Attendance' },
        { to: '/student/history', icon: Clock,           label: 'My Attendance' },
      ];
    }
    if (role === 'teacher') {
      return [
        { to: '/teacher',         icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/teacher/session', icon: PlayCircle,      label: 'Start Session' },
        { to: '/teacher/history', icon: History,         label: 'View Attendance' },
      ];
    }
    if (role === 'admin') {
      return [
        { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/users',     icon: Users,           label: 'Manage Users' },
        { to: '/admin/history',   icon: History,         label: 'All Attendance' },
      ];
    }
    if (role === 'parent') {
      return [
        { to: '/parent',         icon: LayoutDashboard, label: 'Child Dashboard' },
        { to: '/parent/history', icon: Clock,           label: 'Child History' },
      ];
    }
    return [];
  };

  return (
    <>
      {/* Mobile hamburger */}
      {!mobileOpen && (
        <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
          <Menu size={22} color="#FFF" />
        </button>
      )}

      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <GraduationCap size={20} color="#00D2FF" />
            </div>
            <h2 className="sidebar-role">{role?.toUpperCase()}</h2>
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
            <X size={22} color="#94A3B8" />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="nav-label">MAIN MENU</p>
          {getLinks().map((link) => (
            <div key={link.to} onClick={() => setMobileOpen(false)}>
              <NavLink to={link.to} icon={link.icon}>
                {link.label}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
