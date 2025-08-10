import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import './Register.css';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      return;
    }
    
    const res = await dispatch(register(form));
    if (res.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      setForm({ name: '', email: '', password: '' });
      setAcceptedTerms(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className={`register-container ${isMounted ? 'mounted' : ''}`}>
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <UserCircleIcon className="user-icon" />
          </div>
          <h1>Create Your Account</h1>
          <p>Join our community today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" autoComplete="off">
          <div className="form-group">
            <div className="input-group">
              <UserCircleIcon className="input-icon" />
              <input
                id="reg-name"
                name="name"
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <EnvelopeIcon className="input-icon" />
              <input
                id="reg-email"
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
                id="reg-password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="terms-conditions">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="terms">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </label>
          </div>

          <button 
            type="submit" 
            className={`register-button ${loading ? 'loading' : ''}`}
            disabled={loading || !acceptedTerms}
          >
            {loading ? (
              <span className="button-loader"></span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRightOnRectangleIcon className="button-icon" />
              </>
            )}
          </button>

          {!acceptedTerms && form.name && form.email && form.password && (
            <div className="error-message">
              <XCircleIcon className="error-icon" />
              Please accept the terms and conditions
            </div>
          )}

          {error && (
            <div className="error-message">
              <XCircleIcon className="error-icon" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <CheckCircleIcon className="success-icon" />
              {successMessage}
            </div>
          )}
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
export default Register;
