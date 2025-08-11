import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, adminLogin } from '../slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

// Import icons (you may need to install @heroicons/react)
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isAdminLogin ? adminLogin : login;
    const res = await dispatch(action(form));
    
    if (res.meta.requestStatus === 'fulfilled') {
      navigate(isAdminLogin ? '/admin/dashboard' : '/dashboard');
    }
  };

  return (
    <div className={`login-container ${isMounted ? 'mounted' : ''}`}>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            {isAdminLogin ? (
              <ShieldCheckIcon className="admin-icon" />
            ) : (
              <UserIcon className="user-icon" />
            )}
          </div>
          <h1>{isAdminLogin ? 'Admin Portal' : 'Welcome Back'}</h1>
          <p>{isAdminLogin ? 'Sign in to access the admin dashboard' : 'Sign in to your account'}</p>
        </div>
        
        <div className="toggle-container">
          <button
            className={`toggle-option ${!isAdminLogin ? 'active' : ''}`}
            type="button"
            onClick={() => setIsAdminLogin(false)}
            disabled={loading}
          >
            <UserIcon className="icon" />
            <span>User</span>
          </button>
          <button
            className={`toggle-option ${isAdminLogin ? 'active' : ''}`}
            type="button"
            onClick={() => setIsAdminLogin(true)}
            disabled={loading}
          >
            <ShieldCheckIcon className="icon" />
            <span>Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <div className="input-group">
              <EnvelopeIcon className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-group">
              <LockClosedIcon className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          {/* <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="#forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div> */}

          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="button-loader"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRightOnRectangleIcon className="button-icon" />
              </>
            )}
          </button>

          {error && (
            <div className="error-message">
              <span className="error-icon">!</span>
              {error}
            </div>
          )}
        </form>

        <div className="login-footer">
          {isAdminLogin ? (
            <p className="switch-mode">
              User account?{' '}
              <button 
                type="button" 
                onClick={() => !loading && setIsAdminLogin(false)}
                className="switch-button"
              >
                Switch to User Login
              </button>
            </p>
          ) : (
            <p className="switch-mode">
              Don't have an account?{' '}
              <Link to="/register" className="switch-button">
                Sign up now
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
