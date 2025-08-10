import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Seat = ({ seat, isSelected, isBooked, onClick }) => {
  const getSeatColor = () => {
    if (isBooked) return 'bg-gray-300 border-gray-400';
    if (isSelected) return 'bg-green-600 border-green-700 hover:bg-green-700';
    return 'bg-green-100 border-green-300 hover:bg-green-200';
  };

  return (
    <motion.button
      whileHover={!isBooked ? { scale: 1.05 } : {}}
      whileTap={!isBooked ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isBooked}
      className={`
        w-8 h-8 m-1 rounded flex items-center justify-center text-xs font-medium
        border-2 transition-colors duration-200
        ${getSeatColor()}
        ${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
    >
      {seat.seatNumber}
    </motion.button>
  );
};

const SeatSelector = ({ 
  seats = [], 
  selectedSeats = [], 
  bookedSeats = [],
  onSelect, 
  maxSelections = 10,
  price = 0
}) => {
  const seatsPerRow = 10;
  const totalRows = 10;
  const totalSeats = seatsPerRow * totalRows;
  const [availableSeats, setAvailableSeats] = useState(totalSeats - bookedSeats.length);
  const [seatGrid, setSeatGrid] = useState([]);
  const [error, setError] = useState('');

  // Initialize seat grid
  useEffect(() => {
    const initializeSeats = () => {
      const grid = [];
      
      // Create 10 rows of 10 seats each
      for (let row = 1; row <= totalRows; row++) {
        const rowSeats = [];
        const rowLetter = String.fromCharCode(64 + row);
        
        for (let col = 1; col <= seatsPerRow; col++) {
          const seatNumber = `${rowLetter}${col}`;
          
          rowSeats.push({
            seatNumber,
            row: rowLetter,
            number: col
          });
        }
        
        grid.push(rowSeats);
      }
      
      setSeatGrid(grid);
      setAvailableSeats(totalSeats - bookedSeats.length);
    };
    
    initializeSeats();
  }, [bookedSeats, totalRows, seatsPerRow, totalSeats]);

  // Handle seat selection
  const handleSeatClick = (seat) => {
    if (bookedSeats.includes(seat.seatNumber)) return;
    
    const isAlreadySelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
    
    if (isAlreadySelected) {
      // Deselect seat
      onSelect(selectedSeats.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      // Check max selection limit
      if (selectedSeats.length >= maxSelections) {
        setError(`You can select maximum ${maxSelections} seats`);
        return;
      }
      
      // Select new seat
      onSelect([...selectedSeats, seat]);
      setError('');
    }
  };

  // Calculate total price
  const totalPrice = selectedSeats.length * price;

  return (
    <div className="p-4">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-1">Select Your Seats</h3>
        <div className="flex justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-1"></div>
            <span>Available ({availableSeats})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 border-2 border-green-700 rounded mr-1"></div>
            <span>Selected ({selectedSeats.length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded mr-1"></div>
            <span>Booked ({bookedSeats.length})</span>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {/* Screen */}
        <div className="w-3/4 h-2 mx-auto mb-6 bg-gray-300 rounded-b-lg shadow-inner"></div>
        
        {/* Seats Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block mx-auto">
            {seatGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center">
                {row.map((seat, colIndex) => {
                  const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
                  const isBooked = bookedSeats.includes(seat.seatNumber);
                  
                  return (
                    <Seat
                      key={`${rowIndex}-${colIndex}`}
                      seat={seat}
                      isSelected={isSelected}
                      isBooked={isBooked}
                      onClick={() => handleSeatClick(seat)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Row Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Row A</span>
          <span>Row J</span>
        </div>
      </div>
      
      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Your Selection</h4>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Selected Seats ({selectedSeats.length}):</span>
              <span className="font-medium">
                {selectedSeats.map(s => s.seatNumber).join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Price per seat:</span>
              <span>₹{price}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total Amount:</span>
              <span>₹{totalPrice}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelector;
