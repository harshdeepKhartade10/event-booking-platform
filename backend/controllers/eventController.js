const Event = require('../models/Event');
const Booking = require('../models/Booking');

exports.createEvent = async (req, res) => {
  try {
    const event = new Event({
  ...req.body,
  createdBy: req.user.id,
  bookedSeats: []
});
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { date, category, location, priceMin, priceMax, search } = req.query;
    let filter = {};
    if (date) filter.date = date;
    if (category) filter.category = category;
    if (location) filter.venue = { $regex: location, $options: 'i' };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (priceMin || priceMax) filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Optionally delete related bookings
    await Booking.deleteMany({ event: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
