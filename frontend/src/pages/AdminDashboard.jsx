import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  FaUsers, 
  FaTicketAlt, 
  FaDollarSign, 
  FaPlus, 
  FaSpinner,
  FaCalendarAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import AddEvent from './admin/AddEvent';
import './AdminDashboard.css';

// StatCard component for displaying statistics
const StatCard = ({ title, value, icon, color, loading = false, description = '', isCurrency = false }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ 
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      color: 'white'
    }}>
      {icon}
    </div>
    <div className="stat-info">
      <h3>{title}</h3>
      {loading ? (
        <div className="stat-loading">Loading...</div>
      ) : (
        <p className={isCurrency ? 'currency-value' : ''}>
          {value}
          {description && <span className="stat-description">{description}</span>}
        </p>
      )}
    </div>
  </div>
);

// QuickAction component for dashboard actions
const QuickAction = ({ title, icon, to, onClick }) => (
  <Link to={to} className="quick-action" onClick={onClick}>
    <div className="quick-action-icon">
      {icon}
    </div>
    <span className="quick-action-text">{title}</span>
  </Link>
);

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Redirect to admin login if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch dashboard statistics with retry logic
  const fetchStats = useCallback(async () => {
    if (!user?.isAdmin || !token) {
      console.log('User is not admin or token is missing');
      return;
    }
    
    console.log('Fetching dashboard statistics...');
    
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      // Get all stats from the analytics endpoint
      console.log('Fetching analytics...');
      const analyticsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Analytics response:', {
        totalUsers: analyticsRes.data?.totalUsers,
        totalBookings: analyticsRes.data?.totalBookings,
        totalRevenue: analyticsRes.data?.totalRevenue
      });

      const statsData = {
        totalUsers: analyticsRes.data?.totalUsers || 0,
        totalBookings: analyticsRes.data?.totalBookings || 0,
        totalRevenue: analyticsRes.data?.totalRevenue || 0,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Setting stats data:', statsData);
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching dashboard stats:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers ? Object.keys(err.config.headers) : 'no headers'
        }
      });
      
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load dashboard statistics',
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [user, token]);

  // Initial fetch and setup refresh interval
  useEffect(() => {
    if (user?.isAdmin && token) {
      fetchStats();
      
      // Refresh stats every 5 minutes
      const interval = setInterval(fetchStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchStats, user, token]);
  
  // Log stats changes for debugging
  useEffect(() => {
    console.log('Stats updated:', JSON.stringify(stats, null, 2));
    console.log('Total revenue:', stats.totalRevenue, 'Formatted:', formatCurrency(stats.totalRevenue));
  }, [stats]);

  if (!user?.isAdmin) {
    return null;
  }

  // Format currency in Indian Rupees (INR)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (dateString, relative = false) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (relative) {
      const diffInSeconds = Math.floor((now - date) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
    }
    
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Handle refresh stats
  const handleRefresh = (e) => {
    e.preventDefault();
    fetchStats();
  };

  const quickActions = [
    {
      title: 'Add a new event to a platform',
      description: 'Create and release a new event.',
      icon: <FaPlus />,
      to: '#',
      onClick: (e) => {
        e.preventDefault();
        setShowAddEventForm(true);
      }
    },
    {
      title: 'View Bookings',
      description: 'See all user bookings and details.',
      icon: <FaTicketAlt />,
      to: '/admin/bookings'
    },
    {
      title: 'Manage Events',
      description: 'Update or remove existing events.',
      icon: <FaCalendarAlt />,
      to: '/admin/events'
    }
  ];

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isDashboard = currentPath === '/admin/dashboard' || currentPath === '/admin';
  const isAddEvent = currentPath === '/admin/add-event';

  // Render the dashboard home content
  const renderDashboardHome = () => (
    <>
      <section className="admin-stats-section">
        <div className="section-header">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            {stats.lastUpdated && !stats.loading && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDate(stats.lastUpdated, true)}
              </p>
            )}
          </div>
          <button style={{color:'white'}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleRefresh}
            disabled={stats.loading}
            title="Refresh dashboard data"
          >
            {stats.loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <>
                <span>⟳</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
        
        {stats.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {stats.error} <button onClick={handleRefresh} className="text-blue-600 hover:underline">Retry</button>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<FaUsers className="text-white text-xl" />}
            color="#4f46e5"
            loading={stats.loading}
            description="Registered users"
          />
          
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings.toLocaleString()}
            icon={<FaTicketAlt className="text-white text-xl" />}
            color="#f59e0b"
            loading={stats.loading}
            description="Completed bookings"
          />
          
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<FaDollarSign className="text-white text-xl" />}
            color="#10b981"
            loading={stats.loading}
            description="Total earnings"
            isCurrency={true}
          />
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              to={action.to}
              key={index}
              onClick={action.onClick}
              className="group block p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer"
            >
              <div className="flex items-center">
                <div className="p-4 bg-green-100 text-green-600 rounded-full mr-4 text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      
    </>
  );

  // Show AddEvent form if requested
  if (showAddEventForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <AddEvent onCancel={() => setShowAddEventForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="max-w-7xl mx-auto p-6">
        {renderDashboardHome()}
      </div>
    </div>
  );
};

export default AdminDashboard;
