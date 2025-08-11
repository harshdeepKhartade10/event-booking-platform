const mongoose = require('mongoose');

const seatInfoSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true },
  price: { type: Number, required: true },
  isCancelled: { type: Boolean, default: false },
  cancellationDate: { type: Date }
});

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  seats: [seatInfoSchema],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  paymentId: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  bookedAt: { 
    type: Date, 
    default: Date.now 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
