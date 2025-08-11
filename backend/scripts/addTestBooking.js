const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
require('dotenv').config();

async function addTestBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Find an existing event or create one if none exists
    let event = await Event.findOne();
    
    if (!event) {
      console.log('No events found, creating a test event...');
      event = new Event({
        name: 'Test Event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        venue: 'Test Venue',
        description: 'This is a test event',
        totalSeats: 100,
        availableSeats: 95,
        price: 500,
        image: 'https://via.placeholder.com/500x300?text=Test+Event'
      });
      await event.save();
      console.log('Created test event:', event);
    }

    // Create a test booking with all required fields
    const seatPrice = event.price || 500; // Default to 500 if event price is not set
    const testBooking = new Booking({
      user: new mongoose.Types.ObjectId(), // Random user ID
      event: event._id,
      seats: [
        { seatNumber: 1, price: seatPrice },
        { seatNumber: 2, price: seatPrice },
        { seatNumber: 3, price: seatPrice }
      ],
      totalAmount: seatPrice * 3, // 3 seats * price per seat
      paymentId: 'test_payment_' + Date.now(),
      status: 'confirmed',
      paymentStatus: 'completed',
      bookedAt: new Date()
    });

    await testBooking.save();
    console.log('Test booking created successfully:', testBooking);
    
    // Verify the booking was saved
    const bookingCount = await Booking.countDocuments();
    console.log(`Total bookings in database: ${bookingCount}`);
    
    // Log all confirmed bookings with their amounts
    const allBookings = await Booking.find({ status: 'confirmed' });
    console.log('All confirmed bookings in database:');
    allBookings.forEach(booking => {
      console.log(`- Booking ID: ${booking._id}, Total Amount: ${booking.totalAmount}, Status: ${booking.status}`);
    });
    
    // Test the analytics endpoint with detailed logging
    console.log('Testing analytics aggregation...');
    const analytics = await Booking.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          paymentStatus: 'completed'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
          bookings: { $push: '$$ROOT' }
        } 
      }
    ]);
    
    console.log('Analytics test result:', JSON.stringify(analytics, null, 2));
    
    // Test with a simpler query to check what fields are available
    console.log('Testing simple sum of totalAmount:');
    const simpleSum = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('Simple sum result:', JSON.stringify(simpleSum, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test booking:', error);
    process.exit(1);
  }
}

addTestBooking();
