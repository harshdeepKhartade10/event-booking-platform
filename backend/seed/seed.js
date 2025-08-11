require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

const MONGO_URI = process.env.MONGO_URI;

// Function to generate exactly 40 seats
const generateSeats = (totalSeats) =>
  Array.from({ length: totalSeats }, (_, i) => ({
    seatNumber: i + 1,
    isBooked: false,
    bookedBy: null,
    bookingDate: null
  }));

// Sample users data
const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    isAdmin: true,
    isVerified: true
  },
  {
    name: "Regular User",
    email: "user@example.com",
    password: "User@123",
    isAdmin: false,
    isVerified: true
  }
];

// Sample events data (6 events, all with exactly 40 seats)
const events = [
  {
    name: "IPL 2025 Final",
    description: "The grand finale of the Indian Premier League 2025 between Chennai Super Kings and Mumbai Indians",
    date: "2025-05-28",
    time: "19:30",
    venue: "Narendra Modi Stadium, Ahmedabad",
    category: "Sports",
    price: 2500,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/AsiaCup.jpeg"
  },
  {
    name: "Bollywood Night Live",
    description: "Live performance by top Bollywood singers including Arijit Singh and Shreya Ghoshal",
    date: "2025-06-15",
    time: "20:00",
    venue: "DY Patil Stadium, Mumbai",
    category: "Music",
    price: 3500,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/BollywoodNight.jpeg"
  },
  {
    name: "Tech Summit India",
    description: "India's largest technology conference with speakers from Google, Microsoft and Amazon",
    date: "2025-07-10",
    time: "09:00",
    venue: "Bangalore International Exhibition Centre",
    category: "Conference",
    price: 5000,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/TechSummit.jpeg"
  },
  {
    name: "Standup Comedy Special",
    description: "An evening of laughter with Zakir Khan, Biswa Kalyan Rath and Kanan Gill",
    date: "2025-08-20",
    time: "18:00",
    venue: "Jawaharlal Nehru Stadium, Delhi",
    category: "Comedy",
    price: 1500,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/ComedyNight.jpeg"
  },
  {
    name: "Food Festival International",
    description: "Experience cuisines from 50+ countries with live cooking demonstrations",
    date: "2025-09-05",
    time: "11:00",
    venue: "Phoenix Marketcity, Mumbai",
    category: "Food",
    price: 2000,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/FoodFestival.jpeg"
  },
  {
    name: "Marathon 2025",
    description: "Annual city marathon with 5km, 10km and half-marathon categories",
    date: "2025-10-12",
    time: "05:30",
    venue: "Marine Drive, Mumbai",
    category: "Sports",
    price: 1000,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image: "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/Marathon.jpeg"
  }
];

// Main seeding function
async function seed() {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("📡 Full connection string:", MONGO_URI);
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("Clearing existing data...");
    await Booking.deleteMany();
    await Event.deleteMany();
    await User.deleteMany();

    // Hash passwords and create users
    console.log("Creating users...");
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10)
      }))
    );

    const insertedUsers = await User.insertMany(hashedUsers);
    const admin = insertedUsers.find(u => u.isAdmin);
    const regular = insertedUsers.find(u => !u.isAdmin);

    // Create all 6 events
    console.log("Creating 6 events with 40 seats each...");
    const insertedEvents = await Event.insertMany(
      events.map(e => ({ ...e, createdBy: admin._id }))
    );

    // Create sample booking for first event
    console.log("Creating sample booking for IPL event...");
    const booking = await Booking.create({
      user: regular._id,
      event: insertedEvents[0]._id,
      seats: [
        { seatNumber: 1, price: insertedEvents[0].price },
        { seatNumber: 2, price: insertedEvents[0].price }
      ],
      totalAmount: insertedEvents[0].price * 2,
      paymentId: "seed_payment_" + Date.now(),
      status: "confirmed",
      paymentStatus: "completed"
    });

    // Update event with booking reference
    insertedEvents[0].availableSeats -= 2;
    insertedEvents[0].bookings.push(booking._id);
    await insertedEvents[0].save();

    // Update user with booking reference
    regular.bookings.push(booking._id);
    await regular.save();

    console.log("✅ Seeding completed successfully!");
    console.log("Created 6 events, all with exactly 40 seats");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

// Execute seeding
seed();

// require("dotenv").config({ path: "../.env" });
// const mongoose = require("mongoose");
// const User = require("../models/User");
// const Event = require("../models/Event");
// const Booking = require("../models/Booking");
// const bcrypt = require("bcryptjs");

// const MONGO_URI =
//   process.env.MONGO_URI || "mongodb://localhost:27017/eventbooking";

// const users = [
//   {
//     name: "Admin User",
//     email: "admin@example.com",
//     password: "Admin@123",
//     isAdmin: true,
//     isVerified: true,
//   },
//   {
//     name: "Regular User",
//     email: "user@example.com",
//     password: "User@123",
//     isAdmin: false,
//     isVerified: true,
//   },
// ];

// // Function to generate seats for an event
// const generateSeats = (totalSeats) => {
//   const seats = [];
//   for (let i = 1; i <= totalSeats; i++) {
//     seats.push({
//       seatNumber: i,
//       isBooked: false,
//       bookedBy: null,
//       bookingDate: null
//     });
//   }
//   return seats;
// };

// const events = [
//   {
//     name: "IPL 2025 Final",
//     description:
//       "The grand finale of the Indian Premier League 2025. Experience the thrill of cricket with top teams battling for the trophy!",
//     date: "2025-05-28",
//     time: "19:30",
//     venue: "Narendra Modi Stadium, Ahmedabad",
//     category: "Sports",
//     price: 2500,
//     totalSeats: 40,
//     availableSeats: 40,
//     seats: generateSeats(40),
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/AsiaCup.jpeg",
//   },
//   {
//     name: "Sunburn Goa 2025",
//     description:
//       "Asia's biggest electronic music festival returns to Goa with world-famous DJs, immersive stage designs, and a beach party vibe.",
//     date: "2025-12-27",
//     time: "16:00",
//     venue: "Vagator Beach, Goa",
//     category: "Music Festival",
//     price: 4500,
//     totalSeats: 40,
//     availableSeats: 40,
//     seats: generateSeats(40),
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/sunBornGoa.jpeg",
//   },
//   {
//     name: "Jaipur Literature Festival 2025",
//     description:
//       "The world’s largest free literary festival, featuring celebrated authors, thinkers, and performers from India and around the globe.",
//     date: "2025-01-23",
//     time: "10:00",
//     venue: "Diggi Palace, Jaipur",
//     category: "Literature",
//     price: 10,
//     totalSeats: 5000,
//     availableSeats: 5000,
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/JaipurFestival.png",
//   },
//   // --- Added Indian Events ---
//   {
//     name: "International Kite Festival",
//     description:
//       "Experience the sky filled with vibrant kites at the world-famous International Kite Festival in Ahmedabad. Join kite flyers from across the globe!",
//     date: "2025-01-14",
//     time: "09:00",
//     venue: "Ahmedabad, Gujarat",
//     category: "Festival",
//     price: 50,
//     totalSeats: 10000,
//     availableSeats: 10000,
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/InternaltionalKiteFestival.jpeg",
//   },
//   {
//     name: "India Art Fair",
//     description:
//       "India's premier modern and contemporary art fair, showcasing the best of Indian and international art at the heart of New Delhi.",
//     date: "2025-01-30",
//     time: "11:00",
//     venue: "New Delhi",
//     category: "Art",
//     price: 600,
//     totalSeats: 3000,
//     availableSeats: 3000,
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/IndianArtFair.jpeg",
//   },
//   {
//     name: "Chennai Music Season",
//     description:
//       "A grand celebration of Carnatic music and dance, the Chennai Music Season features legendary artists and upcoming talents from across India.",
//     date: "2025-12-15",
//     time: "17:00",
//     venue: "Chennai, Tamil Nadu",
//     category: "Music Festival",
//     price: 800,
//     totalSeats: 4000,
//     availableSeats: 4000,
//     image:
//       "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/ChennaiMusicSeason.jpeg",
//   },
// ];

// async function seed() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     await Booking.deleteMany();
//     await Event.deleteMany();
//     await User.deleteMany();

//     // Hash passwords and create users
//     const userDocs = await Promise.all(
//       users.map(async (u) => {
//         const hash = await bcrypt.hash(u.password, 10);
//         return new User({ ...u, password: hash });
//       })
//     );
//     await User.insertMany(userDocs);
//     const [admin, regular] = await User.find();

//     // Create events
//     const eventDocs = await Event.insertMany(
//       events.map((e) => ({ ...e, createdBy: admin._id }))
//     );

//     // Create bookings
//     const booking1 = new Booking({
//       user: regular._id,
//       event: eventDocs[0]._id,
//       seats: 2,
//     });
//     await booking1.save();
//     eventDocs[0].availableSeats -= 2;
//     eventDocs[0].bookings.push(booking1._id);
//     await eventDocs[0].save();
//     regular.bookings.push(booking1._id);
//     await regular.save();

//     console.log("Seed data inserted!");
//     process.exit();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// seed();


