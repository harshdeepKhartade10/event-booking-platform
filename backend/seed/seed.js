require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const bcrypt = require("bcryptjs");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/eventbooking";

const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    isAdmin: true,
    isVerified: true,
  },
  {
    name: "Regular User",
    email: "user@example.com",
    password: "User@123",
    isAdmin: false,
    isVerified: true,
  },
];

// Function to generate seats for an event
const generateSeats = (totalSeats) => {
  const seats = [];
  for (let i = 1; i <= totalSeats; i++) {
    seats.push({
      seatNumber: i,
      isBooked: false,
      bookedBy: null,
      bookingDate: null
    });
  }
  return seats;
};

const events = [
  {
    name: "IPL 2025 Final",
    description:
      "The grand finale of the Indian Premier League 2025. Experience the thrill of cricket with top teams battling for the trophy!",
    date: "2025-05-28",
    time: "19:30",
    venue: "Narendra Modi Stadium, Ahmedabad",
    category: "Sports",
    price: 2500,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/AsiaCup.jpeg",
  },
  {
    name: "Sunburn Goa 2025",
    description:
      "Asia's biggest electronic music festival returns to Goa with world-famous DJs, immersive stage designs, and a beach party vibe.",
    date: "2025-12-27",
    time: "16:00",
    venue: "Vagator Beach, Goa",
    category: "Music Festival",
    price: 4500,
    totalSeats: 40,
    availableSeats: 40,
    seats: generateSeats(40),
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/sunBornGoa.jpeg",
  },
  {
    name: "Jaipur Literature Festival 2025",
    description:
      "The world’s largest free literary festival, featuring celebrated authors, thinkers, and performers from India and around the globe.",
    date: "2025-01-23",
    time: "10:00",
    venue: "Diggi Palace, Jaipur",
    category: "Literature",
    price: 10,
    totalSeats: 5000,
    availableSeats: 5000,
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/JaipurFestival.png",
  },
  // --- Added Indian Events ---
  {
    name: "International Kite Festival",
    description:
      "Experience the sky filled with vibrant kites at the world-famous International Kite Festival in Ahmedabad. Join kite flyers from across the globe!",
    date: "2025-01-14",
    time: "09:00",
    venue: "Ahmedabad, Gujarat",
    category: "Festival",
    price: 50,
    totalSeats: 10000,
    availableSeats: 10000,
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/InternaltionalKiteFestival.jpeg",
  },
  {
    name: "India Art Fair",
    description:
      "India's premier modern and contemporary art fair, showcasing the best of Indian and international art at the heart of New Delhi.",
    date: "2025-01-30",
    time: "11:00",
    venue: "New Delhi",
    category: "Art",
    price: 600,
    totalSeats: 3000,
    availableSeats: 3000,
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/IndianArtFair.jpeg",
  },
  {
    name: "Chennai Music Season",
    description:
      "A grand celebration of Carnatic music and dance, the Chennai Music Season features legendary artists and upcoming talents from across India.",
    date: "2025-12-15",
    time: "17:00",
    venue: "Chennai, Tamil Nadu",
    category: "Music Festival",
    price: 800,
    totalSeats: 4000,
    availableSeats: 4000,
    image:
      "https://raw.githubusercontent.com/harshdeepKhartade10/event-images/main/events/ChennaiMusicSeason.jpeg",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    await Booking.deleteMany();
    await Event.deleteMany();
    await User.deleteMany();

    // Hash passwords and create users
    const userDocs = await Promise.all(
      users.map(async (u) => {
        const hash = await bcrypt.hash(u.password, 10);
        return new User({ ...u, password: hash });
      })
    );
    await User.insertMany(userDocs);
    const [admin, regular] = await User.find();

    // Create events
    const eventDocs = await Event.insertMany(
      events.map((e) => ({ ...e, createdBy: admin._id }))
    );

    // Create bookings
    const booking1 = new Booking({
      user: regular._id,
      event: eventDocs[0]._id,
      seats: 2,
    });
    await booking1.save();
    eventDocs[0].availableSeats -= 2;
    eventDocs[0].bookings.push(booking1._id);
    await eventDocs[0].save();
    regular.bookings.push(booking1._id);
    await regular.save();

    console.log("Seed data inserted!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
