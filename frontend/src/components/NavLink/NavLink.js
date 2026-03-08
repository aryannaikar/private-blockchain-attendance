import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import './NavLink.css';

const NavLink = ({ to, icon: Icon, children }) => {
  return (
    <RouterNavLink 
      to={to} 
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    >
      {Icon && <Icon className="link-icon" size={20} />}
      <span className="link-text">{children}</span>
    </RouterNavLink>
  );
};

export default NavLink;
