const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateEventsTo40Seats() {
  try {
    // Find all events with more than 40 seats
    const events = await Event.find({
      $or: [
        { totalSeats: { $gt: 40 } },
        { availableSeats: { $gt: 40 } },
        { $where: 'this.seats.length > 40' }
      ]
    });

    console.log(`Found ${events.length} events that need to be updated`);

    for (const event of events) {
      console.log(`Updating event: ${event.name} (${event._id})`);
      console.log(`Current: totalSeats=${event.totalSeats}, availableSeats=${event.availableSeats}, seats.length=${event.seats?.length || 0}`);
      
      // Update to exactly 40 seats
      event.totalSeats = 40;
      
      // Calculate available seats (can't be more than 40)
      const bookedSeats = event.seats?.filter(s => s.isBooked).length || 0;
      event.availableSeats = Math.min(40 - bookedSeats, 40);
      
      // Trim seats array to 40 if needed
      if (event.seats && event.seats.length > 40) {
        event.seats = event.seats.slice(0, 40);
      }
      
      // If no seats array exists, create one with 40 available seats
      if (!event.seats || event.seats.length === 0) {
        event.seats = Array.from({ length: 40 }, (_, i) => ({
          seatNumber: i + 1,
          isBooked: false
        }));
        event.availableSeats = 40;
      }
      
      await event.save();
      console.log(`Updated: totalSeats=${event.totalSeats}, availableSeats=${event.availableSeats}, seats.length=${event.seats.length}`);
    }
    
    console.log('All events updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
}

updateEventsTo40Seats();
