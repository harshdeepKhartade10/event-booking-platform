const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Apply auth and admin middleware to all routes
router.use(auth, isAdmin);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId/bookings', adminController.getUserBookings);
router.put('/users/:id/status', adminController.updateUserStatus);

// Booking Management
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// Event Management
router.get('/stats/events', adminController.getEventStats);
router.put('/events/seat-limit', adminController.updateSeatLimit);

// Analytics
router.get('/analytics', adminController.getBookingAnalytics);

module.exports = router;
