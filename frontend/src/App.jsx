import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import AdminDashboard from './pages/AdminDashboard';
import ManageEvents from './pages/admin/ManageEvents';
import ViewBookings from './pages/admin/ViewBookings';
import EditEvent from './pages/admin/EditEvent';
import VerifyEmail from './pages/VerifyEmail';
import PrivateRoute from './components/PrivateRoute';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from './slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { token, user, loading } = useSelector(state => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  

  // Load user profile on initial load if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          await dispatch(fetchProfile()).unwrap();
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [dispatch, token]);

  // Show loading state while initializing
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Protected User Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <Navigate to="/admin/dashboard" replace />
          </PrivateRoute>
        } />
        <Route path="/admin/dashboard/*" element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/events" element={
          <PrivateRoute adminOnly={true}>
            <ManageEvents />
          </PrivateRoute>
        } />
        <Route path="/admin/events/edit/:id" element={
          <PrivateRoute adminOnly={true}>
            <EditEvent />
          </PrivateRoute>
        } />
        <Route path="/admin/bookings" element={
          <PrivateRoute adminOnly={true}>
            <ViewBookings />
          </PrivateRoute>
        } />
        
        {/* Event Details (Public) */}
        <Route path="/events/:id" element={<EventDetails />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
