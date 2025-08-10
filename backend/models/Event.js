const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  bookingDate: { type: Date, default: null }
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  totalSeats: { 
    type: Number, 
    required: true,
    default: 40,
    min: 1,
    max: 40
  },
  seats: [seatSchema],
  availableSeats: { 
    type: Number, 
    required: true,
    default: 40,
    min: 0,
    max: 40
  },
  image: { type: String },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
