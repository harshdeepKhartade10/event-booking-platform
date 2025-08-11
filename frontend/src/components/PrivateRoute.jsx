import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow Redux state to update
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading || isChecking) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    // Redirect to login and save the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.isAdmin) {
    // Optionally, you could show an unauthorized message here
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
