<<<<<<< HEAD
import React, { useState } from 'react';
import { Menu, X, Home, Download, Moon, Sun, Github, HelpCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
const Navbar = ({ darkMode, onDarkModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const navigate = useNavigate();
  const toggleDarkMode = () => {
    onDarkModeChange(!darkMode);
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="navbar-container">
=======
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

>>>>>>> c48e31e7ff8c2973a9e67cc79a3f534a5dc1068b
        {/* Logo */}
        <div className="navbar-logo">
          <Home size={24} />
          <span>Excel Analyzer</span>
        </div>

<<<<<<< HEAD
        {/* Desktop Nav */}
        <ul className="navbar-menu desktop-menu">
          <li><a href="#dashboard" className="nav-link active">Dashboard</a></li>
          <li><a href="#analytics" className="nav-link">Analytics</a></li>
          <li><a href="#charts" className="nav-link">Charts</a></li>
 <button 
    className="nav-link"
   // onClick={() => navigate("/help")}
  >
    Help
  </button>      </ul>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <button className="nav-btn secondary" title="Export Report">
            <Download size={20} />
          </button>
          <button 
            className="nav-btn secondary" 
            onClick={toggleDarkMode}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a href="https://github.com" className="nav-btn secondary" target="_blank" rel="noopener noreferrer" title="GitHub">
            <Github size={20} />
          </a>
<button className="nav-btn primary" onClick={() => document.getElementById('help-section')?.scrollIntoView({ behavior: 'smooth' })} title="Get Help">
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Mobile Menu Button */}
=======
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
              {/* <span className="user-name">{user.email || user.displayName || 'User'}</span> */}
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
>>>>>>> c48e31e7ff8c2973a9e67cc79a3f534a5dc1068b
        <button className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
<<<<<<< HEAD
          <a href="#dashboard" className="mobile-nav-link active" onClick={toggleMenu}>Dashboard</a>
          <a href="#analytics" className="mobile-nav-link" onClick={toggleMenu}>Analytics</a>
          <a href="#charts" className="mobile-nav-link" onClick={toggleMenu}>Charts</a>
          <a href="#help" className="mobile-nav-link" onClick={toggleMenu}>Help</a>
          <div className="mobile-actions">
            <button className="mobile-nav-btn" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <button className="mobile-nav-btn">
              <Download size={20} />
              Export
            </button>
          </div>
=======
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
>>>>>>> c48e31e7ff8c2973a9e67cc79a3f534a5dc1068b
        </div>
      )}
    </nav>
  );
};

<<<<<<< HEAD
export default Navbar;
=======
export default Navbar;
>>>>>>> c48e31e7ff8c2973a9e67cc79a3f534a5dc1068b
