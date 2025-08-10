import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./SeatSelector.css";

const Seat = ({ seat, isSelected, isBooked, onClick }) => {
  const getSeatClasses = () => {
    let classes = "seat";
    if (isBooked) classes += " booked";
    else if (isSelected) classes += " selected";
    else classes += " available";
    return classes;
  };

  return (
    <motion.button
      whileHover={!isBooked ? { scale: 1.05 } : {}}
      whileTap={!isBooked ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isBooked}
      className={getSeatClasses()}
      title={isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
    >
      {seat.displaySeatNumber || seat.seatNumber}
    </motion.button>
  );
};

const SeatSelector = ({
  seats = [],
  selectedSeats = [],
  bookedSeats = [],
  onSelect,
  maxSelections = 10,
  price = 0,
  maxSeats = 40,
}) => {
  const seatsPerRow = 10;
  const [availableSeats, setAvailableSeats] = useState(0);
  const [seatGrid, setSeatGrid] = useState([]);
  const [error, setError] = useState("");

  // Initialize seat grid from passed seats (strict 40-seat maximum)
  useEffect(() => {
    if (seats && seats.length > 0) {
      console.log(`Processing ${seats.length} seats in SeatSelector`);
      
      // Sort seats by seatNumber and take first 40
      const limitedSeats = [...seats]
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .slice(0, maxSeats);
      
      console.log(`Limited to first ${maxSeats} seats:`, limitedSeats.length);
      
      // Create grid with exactly 40 seats (4 rows of 10)
      const grid = [];
      const totalRows = 4; // Always 4 rows for 40 seats (4x10)
      
      for (let row = 0; row < totalRows; row++) {
        const rowSeats = [];
        
        for (let col = 0; col < seatsPerRow; col++) {
          const seatIndex = row * seatsPerRow + col;
          
          // Create seat object if it doesn't exist
          if (seatIndex < limitedSeats.length) {
            rowSeats.push(limitedSeats[seatIndex]);
          } else if (seatIndex < maxSeats) {
            // Fill remaining seats up to 40 with available seats
            const seatNumber = seatIndex + 1;
            const rowNum = Math.floor(seatIndex / seatsPerRow) + 1;
            const colNum = (seatIndex % seatsPerRow) + 1;
            
            rowSeats.push({
              seatNumber,
              displaySeatNumber: `${String.fromCharCode(64 + rowNum)}${colNum}`,
              price: price,
              seatType: 'standard',
              isBooked: false,
              row: rowNum,
              number: colNum
            });
          }
        }
        
        if (rowSeats.length > 0) {
          grid.push(rowSeats);
        }
      }

      // Calculate available seats (not booked and not selected)
      const available = limitedSeats.filter(seat => !seat.isBooked).length;
      console.log(`Available seats: ${available}/${limitedSeats.length}`);
      
      setSeatGrid(grid);
      setAvailableSeats(available);
    }
  }, [seats, seatsPerRow, maxSeats, price]);

  // Handle seat selection
  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    const isAlreadySelected = selectedSeats.some(
      (s) => s.seatNumber === seat.seatNumber
    );

    if (isAlreadySelected) {
      // Deselect seat
      const newSelection = selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber);
      onSelect(newSelection);
    } else {
      // Check max selection limit
      if (selectedSeats.length >= maxSelections) {
        setError(`You can select maximum ${maxSelections} seats`);
        return;
      }

      // Select new seat
      const newSelection = [...selectedSeats, { ...seat, price }];
      onSelect(newSelection);
      setError("");
    }
  };
  
  // Clear all selected seats
  const handleClearSelection = () => {
    onSelect([]);
  };

  // Calculate total price
  const totalPrice = selectedSeats.length * price;

  return (
    <div className="seat-selector-container">
      <div className="screen">Screen This Way</div>
      
      {/* 40-seat limit notice */}
      <div className="seat-limit-notice">
        <svg className="w-5 h-5 text-blue-500 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>This event has a maximum of 40 seats available.</span>
      </div>
      
      {error && (
        <div className="error-message bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Seat Grid */}
      <div className="seat-grid">
        {seatGrid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
            {row.map((seat) => {
              const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
              const isBooked = seat.isBooked || bookedSeats.includes(seat.seatNumber);
              
              return (
                <Seat
                  key={`seat-${seat.seatNumber}`}
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
      
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available ({availableSeats})</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Selected ({selectedSeats.length})</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>Booked ({seatGrid.flat().length - availableSeats - selectedSeats.length})</span>
        </div>
      </div>
      
      <div className="selection-summary bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Selected Seats:</span>
          <span className="font-semibold">{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Total Amount:</span>
          <span className="text-lg font-bold text-blue-700">${(selectedSeats.length * price).toFixed(2)}</span>
        </div>
        
        {selectedSeats.length > 0 ? (
          <div className="flex justify-between gap-4">
            <button style={{color:"white"}}
              onClick={handleClearSelection}
              className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Clear Selection
            </button>
            <button style={{color:"white" , display:'none'}}
              onClick={() => {
                // This would typically be handled by the parent component
                console.log('Proceeding to payment with seats:', selectedSeats);
              }}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Book Now (${selectedSeats.length * price})
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-gray-500 text-sm">
            Select seats to continue
          </div>
        )}
      </div>
      
      {/* Seat selection help */}
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-1">How to book:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click on available seats to select them (green)</li>
          <li>Selected seats will be highlighted in dark green</li>
          <li>Click "Book Now" to proceed to payment</li>
          <li>Maximum 10 seats can be booked at once</li>
        </ol>
      </div>
    </div>
  );
};

export default SeatSelector;
