// Role-based access control middleware
const isAdmin = (req, res, next) => {
  // Check if user exists and has admin role or isAdmin flag
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

const isUser = (req, res, next) => {
  // Check if user exists and is a regular user
  if (req.user && req.user.role === 'user') {
    return next();
  }
  return res.status(403).json({ message: 'User access required' });
};

module.exports = {
  isAdmin,
  isUser
};