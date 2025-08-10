import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';
import './Navbar.css';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    document.body.classList.remove('no-scroll');
  }, [location]);
  
  // Toggle body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    // Always navigate to login page after logout
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="logo-icon">🎭</span>
            <span className="logo-text">EventHub</span>
          </Link>
          
          <button 
            className={`menu-icon ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-links ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-home" />
                <span>Home</span>
              </Link>
            </li>
            
            {user ? (
              <>
                {user.isAdmin && (
                  <li className="nav-item">
                    <Link 
                      to="/admin/dashboard" 
                      className={`nav-links ${isAdminRoute ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className="fas fa-tachometer-alt" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}
                
                <li className="nav-item">
                  <Link 
                    to={user.isAdmin ? '/dashboard' : '/dashboard'} 
                    className={`nav-links ${!isAdminRoute && location.pathname === '/dashboard' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fas fa-user-circle" />
                    <span>{user.isAdmin ? 'User Dashboard' : 'My Dashboard'}</span>
                  </Link>
                </li>
                
                <li className="nav-item" ref={dropdownRef}>
                  <div 
                    className="nav-links user-menu" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className="user-avatar">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </span>
                    <div className="user-info">
                      <span className="user-name">{user.name || 'Account'}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} />
                  </div>
                  
                  <div className={`dropdown-menu ${dropdownOpen ? 'active' : ''}`}>
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="fas fa-user" /> Profile
                    </Link>
                    <button 
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt" /> Logout
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link 
                  to="/login" 
                  className="nav-links"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-sign-in-alt" />
                  <span>Login / Register</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
      <div className="navbar-spacer"></div>
    </>
  );
};

export default Navbar;
