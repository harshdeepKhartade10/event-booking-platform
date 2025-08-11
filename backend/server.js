require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://harshdeep-khartade-event-booking-plt.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.send('Event Booking Platform API');
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const eventRoutes = require('./routes/event');
app.use('/api/events', eventRoutes);
const bookingRoutes = require('./routes/booking');
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', require('./routes/payment'));
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
