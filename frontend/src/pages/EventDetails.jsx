import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchEventDetails } from '../slices/eventSlice';
import { fetchProfile } from '../slices/authSlice';
import SeatSelector from '../components/SeatSelector';
import AuthPromptModal from '../components/AuthPromptModal';

const EventDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get data from Redux store
  const { eventDetails, loading, error } = useSelector((state) => state.events);
  const { token, user } = useSelector((state) => state.auth);
  
  // Local state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    message: '',
    error: ''
  });
  const [ticket, setTicket] = useState(null);
  
  // Generate seat data for the seat selector - strict 40-seat maximum
  const generateSeatData = () => {
    // Always use 40 as the maximum number of seats
    const maxSeats = 40;
    
    // If we have backend seat data, use it (but limit to 40 seats)
    if (eventDetails?.seats && eventDetails.seats.length > 0) {
      console.log('Using backend seat data. Total seats from backend:', eventDetails.seats.length);
      
      // Create a map of booked seats for quick lookup
      const bookedSeatsMap = new Map();
      eventDetails.seats.forEach(seat => {
        if (seat.isBooked && seat.seatNumber <= maxSeats) {
          bookedSeatsMap.set(seat.seatNumber, true);
        }
      });
      
      // Generate all 40 seats with proper booking status
      const seats = [];
      for (let i = 1; i <= maxSeats; i++) {
        const row = Math.floor((i - 1) / 10) + 1;
        const number = ((i - 1) % 10) + 1;
        const displaySeatNumber = `${String.fromCharCode(64 + row)}${number}`;
        const isBooked = bookedSeatsMap.has(i);
        
        seats.push({
          seatNumber: i,
          displaySeatNumber,
          price: eventDetails.price || 0,
          seatType: 'standard',
          isBooked,
          row,
          number: number
        });
      }
      
      console.log('Generated', seats.length, 'seats with', bookedSeatsMap.size, 'booked seats');
      return seats;
    }
    
    // If no backend seat data, generate 40 available seats
    console.log('No backend seat data. Generating 40 available seats.');
    const seats = [];
    
    for (let i = 1; i <= maxSeats; i++) {
      const row = Math.floor((i - 1) / 10) + 1;
      const number = ((i - 1) % 10) + 1;
      const displaySeatNumber = `${String.fromCharCode(64 + row)}${number}`;
      
      seats.push({
        seatNumber: i,
        displaySeatNumber,
        price: eventDetails?.price || 0,
        seatType: 'standard',
        isBooked: false,
        row,
        number
      });
    }
    
    return seats;
  };

  // Calculate available seats (maximum 40)
  const totalSeats = Math.min(eventDetails?.totalSeats || 40, 40);
  const bookedSeatsCount = eventDetails?.seats?.filter(seat => seat.isBooked && seat.seatNumber <= 40)?.length || 0;
  const availableSeats = Math.min(eventDetails?.availableSeats || (totalSeats - bookedSeatsCount), 40);

  // Calculate total price for selected seats
  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || eventDetails?.price || 0), 
    0
  );

  useEffect(() => { 
    dispatch(fetchEventDetails(id)); 
  }, [dispatch, id]);

  // Inject Razorpay script if not already loaded
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load user data if token exists but user data is missing
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch]);

  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
    if (bookingStatus.error) {
      setBookingStatus(prev => ({ ...prev, error: '' }));
    }
  };

  // For showing toast notifications
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-medium z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
  };

  const handleBook = async () => {
    // Validate selection
    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat', 'error');
      return;
    }

    // Check authentication
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    // Check email verification
    if (user && !user.isVerified) {
      setShowAuthModal(true);
      return;
    }

    setBookingStatus({ loading: true, error: '', message: '' });

    try {
      // 1. Create a booking intent on the server
      const bookingData = {
        eventId: id,
        seats: selectedSeats.map(seat => ({
          seatNumber: seat.seatNumber,
          price: seat.price || eventDetails.price
        })),
        totalAmount: totalPrice
      };

      // 2. Create Razorpay order on backend
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/razorpay-order`,
        {
          amount: totalPrice * 100, // in paise
          currency: 'INR'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const { order, key } = orderRes.data;

      // 3. Open Razorpay checkout
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: eventDetails.name,
        description: `Booking for ${selectedSeats.length} seat(s)`,
        order_id: order.id,
        handler: async (response) => {
          console.log('Payment successful:', response);
          
          try {
            // First verify payment with Razorpay
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (verifyRes.data && verifyRes.data.success) {
              // Payment verified, now create booking
              const bookingRes = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/bookings`,
                {
                  eventId: id,
                  selectedSeats: selectedSeats.map(seat => seat.seatNumber),
                  paymentId: response.razorpay_payment_id
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              console.log('Booking response:', bookingRes);
              
              // Check if booking was successful
              if (bookingRes && bookingRes.data && (bookingRes.data.success !== false)) {
                const bookingData = bookingRes.data;
                setTicket(bookingData.ticket || bookingData.booking);
                setBookingStatus({
                  loading: false,
                  error: '',
                  message: `🎉 Booking confirmed! Your ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} ${selectedSeats.map(s => s.seatNumber).join(', ')} have been booked successfully.`
                });
                
                // Update event details to reflect new bookings
                dispatch(fetchEventDetails(id));
                
                // Clear selected seats
                setSelectedSeats([]);
                
                toast.success('Booking confirmed successfully!');
              } else {
                throw new Error(bookingRes.data?.message || 'Booking failed');
              }
            } else {
              throw new Error(verifyRes.data?.message || 'Payment verification failed');
            }
        } catch (error) {
          console.error('Payment/Booking failed:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Payment verification or booking failed. Please contact support if amount was deducted.';
          setBookingStatus({
            loading: false,
            error: errorMessage,
            message: ''
          });
          toast.error(errorMessage);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#2563EB'
      },
      modal: {
        ondismiss: function() {
          setBookingStatus({
            loading: false,
            error: '',
            message: ''
          });
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Initial booking setup failed:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create booking. Please try again.';
    setBookingStatus({
      loading: false,
      error: errorMessage,
      message: ''
    });
    toast.error(errorMessage);
  }
};

  if (loading) return <div className="text-center py-20">Loading event details...</div>;
  if (error) return <div className="text-center text-red-600 py-20">Error: {error}</div>;
  if (!eventDetails) return <div className="text-center py-20">Event not found</div>;

  // Format date and time
  const formatEventDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formattedDate = formatEventDate(eventDetails.date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Event Header - Well-Suited Size */}
            <div className="relative h-[400px] lg:h-[480px]">
              <img
                src={eventDetails.image || `https://images.unsplash.com/1600x900/?${encodeURIComponent(eventDetails.category || 'event concert entertainment')}&auto=format&fit=crop&w=1600&h=900&q=90`}
                alt={eventDetails.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: 'center center',
                  filter: 'brightness(0.9) contrast(1.1) saturate(1.05)',
                  transform: 'scale(1.01)'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://images.unsplash.com/1600x900/667eea/ffffff?text=${encodeURIComponent(eventDetails.name || 'Event')}&auto=format&fit=crop&w=1600&h=900`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                <div className="p-8 text-white w-full">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="inline-block px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full mb-3">
                        {eventDetails.category}
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">{eventDetails.name}</h1>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-2 sm:space-y-0 text-lg">
                        <div className="flex items-center">
                          <svg className="w-7 h-7 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{formatEventDate(eventDetails.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-7 h-7 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">{eventDetails.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Event Section - Enhanced Styling */}
            <div className="p-10 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-b border-indigo-100">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    About This Event
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    {/* Event Description and Price Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-2 sm:space-y-0 text-lg mb-6">
                      <div className="flex-1">
                        <p className="text-xl font-medium text-gray-800 text-center sm:text-left">
                          {eventDetails.description || 'Experience an unforgettable event filled with entertainment, excitement, and memories that will last a lifetime.'}
                        </p>
                      </div>
                      <div className="mt-4 lg:mt-0 lg:text-right">
                        <div className="text-center sm:text-right bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                          <div className="text-2xl lg:text-3xl font-bold">
                            ₹{eventDetails.price}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                        <div className="text-2xl font-bold text-green-600 mb-2">🎭</div>
                        <div className="text-sm font-semibold text-gray-700">Premium Experience</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600 mb-2">🎵</div>
                        <div className="text-sm font-semibold text-gray-700">Live Entertainment</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600 mb-2">⭐</div>
                        <div className="text-sm font-semibold text-gray-700">Memorable Night</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Info */}
              <div className="lg:col-span-2 p-8">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                        <div className="p-3 bg-orange-500 rounded-lg mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Available Seats</p>
                          <p className="font-bold text-gray-900 text-xl">{eventDetails ? availableSeats : '...'}/{totalSeats}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Booking Panel */}
              <div className="lg:col-span-1 p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="sticky top-8 flex flex-col items-center">
                  {eventDetails ? (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Select Your Seats</h3>
                      
                      {/* 40-Seat Maximum Notice */}
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-green-800">Event Seating ({Math.min(totalSeats, 40)} seats available)</p>
                            <p className="text-xs text-green-600">Select multiple seats for group bookings. Maximum 10 seats per booking.</p>
                          </div>
                        </div>
                      </div>
                      
                      <SeatSelector
                        seats={generateSeatData()}
                        selectedSeats={selectedSeats}
                        onSelect={handleSeatSelection}
                        price={eventDetails.price}
                        maxSelections={10}
                        maxSeats={40}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                      <span className="ml-3 text-gray-600">Loading seats...</span>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {bookingStatus.error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {bookingStatus.error}
                    </motion.div>
                  )}
                  
                  {/* Success messages are now shown as toast notifications */}
                  
                  {/* Book Now Button - Fully Centered */}
                  <div className="mt-8 w-full flex justify-center">
                    <button
                      onClick={handleBook}
                      disabled={selectedSeats.length === 0 || bookingStatus.loading}
                      className="payment-button"
                      style={{
                        width: '280px',
                        padding: '20px 32px',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'white',
                        border: 'none',
                        cursor: selectedSeats.length === 0 || bookingStatus.loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: selectedSeats.length === 0 || bookingStatus.loading 
                          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                        boxShadow: selectedSeats.length > 0 && !bookingStatus.loading 
                          ? '0 20px 40px rgba(16, 185, 129, 0.4), 0 8px 16px rgba(16, 185, 129, 0.3)'
                          : '0 8px 16px rgba(0, 0, 0, 0.1)',
                        transform: 'translateZ(0)',
                        opacity: selectedSeats.length === 0 || bookingStatus.loading ? '0.6' : '1'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSeats.length > 0 && !bookingStatus.loading) {
                          e.target.style.transform = 'scale(1.05) translateZ(0)';
                          e.target.style.boxShadow = '0 25px 50px rgba(16, 185, 129, 0.5), 0 12px 24px rgba(16, 185, 129, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSeats.length > 0 && !bookingStatus.loading) {
                          e.target.style.transform = 'scale(1) translateZ(0)';
                          e.target.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.4), 0 8px 16px rgba(16, 185, 129, 0.3)';
                        }
                      }}
                      onMouseDown={(e) => {
                        if (selectedSeats.length > 0 && !bookingStatus.loading) {
                          e.target.style.transform = 'scale(0.98) translateZ(0)';
                          e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)';
                        }
                      }}
                      onMouseUp={(e) => {
                        if (selectedSeats.length > 0 && !bookingStatus.loading) {
                          e.target.style.transform = 'scale(1.05) translateZ(0)';
                          e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)';
                        }
                      }}
                    >
                      {bookingStatus.loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Payment...
                        </span>
                      ) : selectedSeats.length === 0 ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Select Seats to Continue
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          🎉 Pay & Book {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} - ₹{totalPrice}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Authentication Prompt Modal */}
      <AuthPromptModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onLogin={() => navigate('/login', { state: { from: `/events/${id}` } })}
        onRegister={() => navigate('/register', { state: { from: `/events/${id}` } })}
        message={user && !user.isVerified ? 
          'Please verify your email to book tickets. Check your inbox for the verification code.' : 
          'Please sign in to book tickets. New users can create an account in seconds.'}
      />
    </div>
  );
};

export default EventDetails;
