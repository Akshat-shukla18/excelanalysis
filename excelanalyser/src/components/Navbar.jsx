import React, { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { Home, Sun, Moon, Github, HelpCircle, Menu, X, LogOut } from "lucide-react";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

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

  const getInitials = (user) => {
    if (!user) return "?";

    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase();
    }

    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return "?";
  };

  return (
    <nav className={`navbar ${darkMode ? "dark" : "light"}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Home size={24} />
          <span>DATA-Sheet Analyzer</span>
        </div>

        {/* Desktop Menu */}
        <ul className="navbar-menu desktop-menu">
          {!user ? (
            <>
              <li><a href="/" className="nav-link">Login</a></li>
            </>
          ) : (
            <>
              <div className="navbar-quote">
                Analyze smarter, not harder.
              </div>
            </>
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          <button className="nav-btn secondary" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <a
            href="https://github.com/Akshat-shukla18/excelanalysis"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn"
          >
            <Github size={22} />
          </a>

          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                {getInitials(user)}
              </div>
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

