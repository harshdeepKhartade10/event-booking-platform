const fs = require('fs');
const path = require('path');
const Event = require('../models/Event');

// Update the seed.js file with a new event
exports.updateSeedFile = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update seed file' });
    }

    const event = req.body;
    
    // Path to the seed file
    const seedFilePath = path.join(__dirname, '..', 'seed', 'seed.js');
    
    // Read the current seed file
    let seedContent = fs.readFileSync(seedFilePath, 'utf8');
    
    // Find the events array in the seed file
    const eventsStartIndex = seedContent.indexOf('const events = [') + 'const events = ['.length;
    const eventsEndIndex = seedContent.indexOf('];', eventsStartIndex) + 1;
    
    // Extract the current events array
    const eventsArrayContent = seedContent.substring(eventsStartIndex, eventsEndIndex);
    
    // Parse the events array (remove the closing bracket and any trailing content)
    let events = [];
    try {
      // This is a simple approach - for a production app, you'd want a more robust parser
      const eventsStr = '[' + eventsArrayContent.replace(/\/\*.*?\*\//g, '').trim();
      // Remove trailing comma if exists
      const cleanEventsStr = eventsStr.endsWith(',') ? eventsStr.slice(0, -1) : eventsStr;
      events = eval(`(${cleanEventsStr})`);
    } catch (err) {
      console.error('Error parsing events array:', err);
      return res.status(500).json({ message: 'Error parsing seed file' });
    }
    
    // Add the new event to the beginning of the array
    events.unshift({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      category: event.category,
      price: event.price,
      totalSeats: 40,
      availableSeats: 40,
      image: event.image,
      seats: Array.from({ length: 40 }, (_, i) => ({
        seatNumber: i + 1,
        isBooked: false,
        bookedBy: null,
        bookingDate: null
      }))
    });
    
    // Convert events back to string with proper formatting
    const eventsString = JSON.stringify(events, null, 2)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/\n/g, '\n    ');
    
    // Rebuild the seed file content
    const newSeedContent = 
      seedContent.substring(0, eventsStartIndex) + 
      '\n    ' + 
      eventsString + 
      '\n  ' + 
      seedContent.substring(eventsEndIndex);
    
    // Write the updated content back to the seed file
    fs.writeFileSync(seedFilePath, newSeedContent, 'utf8');
    
    res.status(200).json({ message: 'Seed file updated successfully' });
  } catch (error) {
    console.error('Error updating seed file:', error);
    res.status(500).json({ message: 'Error updating seed file', error: error.message });
  }
};

// Get the current seed data
exports.getSeedData = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view seed data' });
    }
    
    // Path to the seed file
    const seedFilePath = path.join(__dirname, '..', 'seed', 'seed.js');
    
    // Read the current seed file
    const seedContent = fs.readFileSync(seedFilePath, 'utf8');
    
    res.status(200).json({ seedContent });
  } catch (error) {
    console.error('Error getting seed data:', error);
    res.status(500).json({ message: 'Error getting seed data', error: error.message });
  }
};
