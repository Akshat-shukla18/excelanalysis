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
        {/* Logo */}
        <div className="navbar-logo">
          <Home size={24} />
          <span>Excel Analyzer</span>
        </div>

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
        <button className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
