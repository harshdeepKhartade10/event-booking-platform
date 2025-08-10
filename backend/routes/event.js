const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const seedController = require('../controllers/seedController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

// Protected routes (require authentication)
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);

// Seed management routes (admin only)
router.post('/update-seed', auth, (req, res, next) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, seedController.updateSeedFile);

router.get('/seed-data', auth, (req, res, next) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, seedController.getSeedData);

module.exports = router;
