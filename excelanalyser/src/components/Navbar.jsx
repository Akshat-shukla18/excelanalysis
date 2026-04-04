import React, { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { Home, Download, Sun, Moon, Github, HelpCircle, Menu, X, LogOut, User } from "lucide-react";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={`navbar ${darkMode ? "dark" : "light"}`}>
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-logo">
          <Home size={24} />
          <span>Excel Analyzer</span>
        </div>

        {/* Desktop Menu */}
        <ul className="navbar-menu desktop-menu">
          {!user ? (
            <>
              <li><a href="/" className="nav-link">Login</a></li>
            </>
          ) : (
            <>
              <li><a href="/dashboard" className="nav-link active">Dashboard</a></li>
              <li><a href="#analytics" className="nav-link">Analytics</a></li>
              <li><a href="#charts" className="nav-link">Charts</a></li>
            </>
          )}
          <li>
            <button className="nav-link">Help</button>
          </li>
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          <button className="nav-btn secondary">
            <Download size={20} />
          </button>

          <button className="nav-btn secondary" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <a href="https://github.com" className="nav-btn secondary" target="_blank" rel="noreferrer">
            <Github size={20} />
          </a>

          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.email || user.displayName || 'User'}</span>
              <button className="nav-btn primary" onClick={handleLogout}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="nav-btn primary" onClick={() => navigate('/')}>
              <HelpCircle size={20} />
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
          {!user ? (
            <a href="/" onClick={toggleMenu}>Login</a>
          ) : (
            <>
              <a href="/dashboard" onClick={toggleMenu}>Dashboard</a>
              <a href="#analytics" onClick={toggleMenu}>Analytics</a>
              <a href="#charts" onClick={toggleMenu}>Charts</a>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
          <a href="#help" onClick={toggleMenu}>Help</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;