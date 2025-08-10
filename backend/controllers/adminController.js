const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get all users with booking counts
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    const users = await User.find().select('-password');
    console.log(`Found ${users.length} users`);
    
    // Return the array of users directly
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      message: 'Error fetching users',
      error: err.message 
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId }).populate('event');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEventStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $group: { _id: "$event", bookings: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSeatLimit = async (req, res) => {
  try {
    const { eventId, totalSeats } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.totalSeats = totalSeats;
    if (event.availableSeats > totalSeats) event.availableSeats = totalSeats;
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get booking analytics with enhanced logging and diagnostics
exports.getBookingAnalytics = async (req, res) => {
  console.log('=== ANALYTICS ENDPOINT CALLED ===');
  console.log('Fetching booking analytics...');
  
  try {
    // Get total users
    console.log('Counting total users...');
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    
    // Get total confirmed bookings with diagnostics
    console.log('Counting confirmed bookings...');
    const totalBookings = await Booking.countDocuments({ 
      status: 'confirmed',
      paymentStatus: 'completed' 
    });
    console.log('Total confirmed bookings:', totalBookings);
    
    // Get total revenue with detailed logging
    console.log('Calculating total revenue...');
    const revenueResult = await Booking.aggregate([
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
          count: { $sum: 1 }
        } 
      }
    ]);
    
    console.log('Raw revenue result:', JSON.stringify(revenueResult, null, 2));
    
    // Calculate stats with fallback to 0 if no data
    const totalRevenue = revenueResult.length > 0 ? Number(revenueResult[0].total) : 0;
    const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;
    
    // Get recent bookings for the dashboard
    const recentBookings = await Booking.find({ 
      status: 'confirmed',
      paymentStatus: 'completed'
    })
    .sort({ bookedAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .populate('event', 'name date');
    
    // Prepare response data with all required fields
    const responseData = {
      totalUsers,
      totalBookings,
      totalRevenue,
      avgBookingValue,
      recentBookings: recentBookings.map(booking => ({
        id: booking._id,
        userName: booking.user?.name || 'Unknown User',
        eventName: booking.event?.name || 'Unknown Event',
        eventDate: booking.event?.date || new Date(),
        totalAmount: booking.totalAmount,
        bookedAt: booking.bookedAt
      })),
      // For charts - last 7 days data
      dates: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      }),
      bookings: Array(7).fill(0), // Placeholder for daily bookings
      revenue: Array(7).fill(0),   // Placeholder for daily revenue
    };
    
    console.log('Sending analytics response with stats:', { 
      totalUsers,
      totalBookings, 
      totalRevenue,
      avgBookingValue,
      recentBookingsCount: responseData.recentBookings.length
    });
    
    // Return the response
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching analytics',
      error: err.message 
    });
  }
};
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('event', 'name date venue')
      .populate('user', 'name email')
      .sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('event', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking status' });
  }
};

// Get all users with booking counts
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'user',
          as: 'bookings'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          bookingCount: { $size: '$bookings' },
          bookings: {
            $map: {
              input: '$bookings',
              as: 'booking',
              in: {
                _id: '$$booking._id',
                event: '$$booking.event',
                seats: '$$booking.seats',
                amount: '$$booking.amount',
                status: '$$booking.status'
              }
            }
          }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    // Populate event details in user bookings
    const usersWithPopulatedBookings = await User.populate(users, {
      path: 'bookings.event',
      select: 'name date'
    });

    res.json(usersWithPopulatedBookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user status' });
  }
};

// Get booking analytics
// exports.getBookingAnalytics = async (req, res) => {
//   try {
//     // Last 30 days data
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     // Get bookings count and revenue by day
//     const dailyStats = await Booking.aggregate([
//       {
//         $match: {
//           bookedAt: { $gte: thirtyDaysAgo },
//           status: 'confirmed' // Only count confirmed bookings
//         }
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookedAt' } },
//           count: { $sum: 1 },
//           revenue: { $sum: '$amount' }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     // Format data for chart
//     const dates = [];
//     const bookingsData = [];
//     const revenueData = [];
    
//     // Fill in missing dates with 0 values
//     const currentDate = new Date(thirtyDaysAgo);
//     while (currentDate <= new Date()) {
//       const dateStr = currentDate.toISOString().split('T')[0];
//       const stat = dailyStats.find(s => s._id === dateStr) || { count: 0, revenue: 0 };
      
//       dates.push(dateStr);
//       bookingsData.push(stat.count);
//       revenueData.push(stat.revenue);
      
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     // Get summary stats
//     const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
//     const totalRevenue = (await Booking.aggregate([
//       { $match: { status: 'confirmed' } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]))[0]?.total || 0;

//     const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

//     res.json({
//       dates,
//       bookings: bookingsData,
//       revenue: revenueData,
//       totalBookings,
//       totalRevenue,
//       avgBookingValue
//     });
//   } catch (err) {
//     console.error('Error fetching analytics:', err);
//     res.status(500).json({ message: 'Error fetching analytics' });
//   }
// };