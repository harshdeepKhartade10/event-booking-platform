const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to process seat booking
exports.bookSeats = async (req, res) => {
  try {
    const { eventId, selectedSeats, paymentId } = req.body;
    const userId = req.user.id;
    
    // Input validation
    if (!eventId || !selectedSeats?.length || !paymentId) {
      return res.status(400).json({ success: false, message: 'Invalid booking request' });
    }

    // Get event with seat details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Enforce strict 40-seat maximum
    if (event.totalSeats > 40) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event exceeds maximum allowed seats (40). Please contact administrator.' 
      });
    }
    
    // Initialize seats if not already done (all events ≤40 seats)
    if (!event.seats || event.seats.length === 0) {
      const seats = [];
      for (let i = 1; i <= Math.min(event.totalSeats, 40); i++) {
        seats.push({
          seatNumber: i,
          isBooked: false,
          bookedBy: null,
          bookingDate: null
        });
      }
      event.seats = seats;
      await event.save();
    }

    // Check seat availability and prepare seat updates
    const seatsToBook = [];
    const seatNumbers = [];
    const now = new Date();

    for (const seatNum of selectedSeats) {
      // Validate seat number is within range
      if (seatNum < 1 || seatNum > event.totalSeats) {
        return res.status(400).json({ 
          success: false, 
          message: `Seat ${seatNum} is out of range. Valid seats are 1-${event.totalSeats}` 
        });
      }

      // Enforce 40-seat maximum validation
      if (seatNum > 40) {
        return res.status(400).json({ 
          success: false, 
          message: `Seat ${seatNum} exceeds maximum allowed seat number (40)` 
        });
      }
      
      // Find the seat in the array
      const seat = event.seats.find(s => s.seatNumber === seatNum);
      
      if (!seat) {
        return res.status(400).json({ 
          success: false, 
          message: `Seat ${seatNum} does not exist for this event` 
        });
      }
      
      if (seat.isBooked) {
        return res.status(400).json({ 
          success: false, 
          message: `Seat ${seatNum} is already booked` 
        });
      }
      
      seatsToBook.push({
        seatNumber: seatNum,
        price: event.price,
        isCancelled: false
      });
      
      seatNumbers.push(seatNum);
    }

    // Calculate total amount
    const totalAmount = seatsToBook.reduce((sum, seat) => sum + seat.price, 0);

    // Create booking
    const booking = new Booking({
      user: userId,
      event: eventId,
      seats: seatsToBook,
      totalAmount,
      paymentId,
      status: 'confirmed',
      paymentStatus: 'completed'
    });

    await booking.save();

    // Update seats as booked (all events ≤40 seats)
    for (const seatNum of selectedSeats) {
      const seat = event.seats.find(s => s.seatNumber === seatNum);
      if (seat) {
        seat.isBooked = true;
        seat.bookedBy = userId;
        seat.bookingDate = now;
      }
    }

    // Update available seats
    event.availableSeats -= seatNumbers.length;
    event.bookings.push(booking._id);
    await event.save();

    // Update user's bookings
    await User.findByIdAndUpdate(
      userId,
      { $push: { bookings: booking._id } },
      { new: true }
    );

    // Prepare response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('event', 'name date venue');

    res.status(201).json({
      success: true,
      message: 'Booking successful',
      booking: {
        _id: booking._id,
        event: {
          _id: event._id,
          name: event.name,
          date: event.date,
          venue: event.venue
        },
        seats: seatNumbers,
        totalAmount,
        status: 'confirmed',
        paymentStatus: 'completed',
        bookedAt: booking.createdAt
      },
      ticket: {
        bookingId: booking._id,
        eventName: event.name,
        date: event.date,
        time: event.time,
        venue: event.venue,
        seats: seatNumbers,
        totalAmount,
        bookingDate: booking.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get all bookings for the logged-in user
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'event',
        select: 'name date time venue image category'
      })
      .select('-__v')
      .sort('-createdAt');

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No bookings found for this user'
      });
    }

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      event: {
        _id: booking.event._id,
        name: booking.event.name,
        date: booking.event.date,
        time: booking.event.time,
        venue: booking.event.venue,
        category: booking.event.category,
        image: booking.event.image
      },
      seats: booking.seats.map(seat => ({
        seatNumber: seat.seatNumber,
        price: seat.price,
        isCancelled: seat.isCancelled,
        cancellationDate: seat.cancellationDate
      })),
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      bookedAt: booking.bookedAt,
      createdAt: booking.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings
    });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'event',
        select: 'name date time venue image category'
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if the user is authorized to view this booking
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    const response = {
      _id: booking._id,
      user: {
        _id: booking.user._id,
        name: booking.user.name,
        email: booking.user.email
      },
      event: {
        _id: booking.event._id,
        name: booking.event.name,
        date: booking.event.date,
        time: booking.event.time,
        venue: booking.event.venue,
        category: booking.event.category,
        image: booking.event.image
      },
      seats: booking.seats.map(seat => ({
        seatNumber: seat.seatNumber,
        price: seat.price,
        isCancelled: seat.isCancelled,
        cancellationDate: seat.cancellationDate
      })),
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      bookedAt: booking.bookedAt,
      createdAt: booking.createdAt
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('Error fetching booking:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if the user is authorized to cancel this booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Get the associated event
    const event = await Event.findById(booking.event);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Associated event not found'
      });
    }

    // Update seat status in the event
    const now = new Date();
    const seatNumbers = booking.seats.map(seat => seat.seatNumber);
    
    for (const seatNum of seatNumbers) {
      const seatIndex = event.seats.findIndex(s => s.seatNumber === seatNum);
      if (seatIndex !== -1) {
        event.seats[seatIndex].isBooked = false;
        event.seats[seatIndex].bookedBy = null;
        event.seats[seatIndex].bookingDate = null;
      }
    }

    // Update available seats count
    event.availableSeats += seatNumbers.length;
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = now;
    
    // Update seat cancellation status
    booking.seats = booking.seats.map(seat => ({
      ...seat.toObject(),
      isCancelled: true,
      cancellationDate: now
    }));

    // Save changes
    await Promise.all([
      event.save(),
      booking.save()
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: booking._id,
        status: 'cancelled',
        cancelledAt: now,
        refundAmount: booking.paymentStatus === 'completed' ? booking.totalAmount : 0
      }
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error cancelling booking:', err);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
exports.getAllBookings = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by event
    if (req.query.eventId) {
      query.event = req.query.eventId;
    }
    
    // Filter by user
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    // Execute query with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate({
          path: 'user',
          select: 'name email'
        })
        .populate({
          path: 'event',
          select: 'name date time venue'
        })
        .select('-__v')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    // Format response
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      user: {
        _id: booking.user._id,
        name: booking.user.name,
        email: booking.user.email
      },
      event: {
        _id: booking.event._id,
        name: booking.event.name,
        date: booking.event.date,
        time: booking.event.time,
        venue: booking.event.venue
      },
      seats: booking.seats.map(seat => ({
        seatNumber: seat.seatNumber,
        price: seat.price,
        isCancelled: seat.isCancelled,
        cancellationDate: seat.cancellationDate
      })),
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      bookedAt: booking.bookedAt,
      createdAt: booking.createdAt
    }));

    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      total,
      page,
      pages,
      hasNextPage,
      hasPreviousPage,
      data: formattedBookings
    });
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
