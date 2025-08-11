const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Book seats
router.post('/', auth, bookingController.bookSeats);
// User's booking history
router.get('/my', auth, bookingController.getUserBookings);
// Admin: all bookings
router.get('/', auth, bookingController.getAllBookings);

module.exports = router;
