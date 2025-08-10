import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { FaHome, FaCalendarAlt, FaUsers, FaTicketAlt, FaSignOutAlt, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Nav items with icons
  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { to: '/admin/events', label: 'Events', icon: <FaCalendarAlt /> },
    { to: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <FaTicketAlt /> },
  ];

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        <div className="admin-navbar-brand">
          <NavLink to="/admin/dashboard" className="brand-link">
            <span className="brand-logo">🎭</span>
            <span className="brand-text">EventHub Admin</span>
          </NavLink>
          <button className="mobile-menu-button" onClick={() => document.body.classList.toggle('sidebar-open')}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <div className="admin-nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
              end
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="admin-nav-user" ref={dropdownRef}>
          {user && (
            <div 
              className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="user-info">
                <FaUserCircle className="user-avatar" />
                <div className="user-details">
                  <span className="user-name">{user.name || 'Admin User'}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <NavLink 
                    to="/admin/profile" 
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FaUserCircle /> Profile
                  </NavLink>
                  <button 
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
