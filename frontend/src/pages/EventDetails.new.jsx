import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
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

  // Fetch event details
  useEffect(() => { 
    dispatch(fetchEventDetails(id)); 
  }, [dispatch, id]);

  // Load user data if token exists but user data is missing
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch]);

  // Handle seat selection
  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
    if (bookingStatus.error) {
      setBookingStatus(prev => ({ ...prev, error: '' }));
    }
  };

  // Handle booking
  const handleBook = async () => {
    // Validate selection
    if (selectedSeats.length === 0) {
      setBookingStatus({
        loading: false,
        error: 'Please select at least one seat',
        message: ''
      });
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
          price: eventDetails.price
        })),
        totalAmount: selectedSeats.length * eventDetails.price
      };

      // 2. Create Razorpay order on backend
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/razorpay-order`,
        {
          amount: bookingData.totalAmount * 100, // in paise
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
        handler: async function (response) {
          try {
            // 4. Verify payment on server
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/payment/verify`,
              {
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingData
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              }
            );

            setTicket(verifyRes.data.ticket);
            setBookingStatus({
              loading: false,
              message: 'Booking confirmed!',
              error: ''
            });

            // Refresh event details to update available seats
            dispatch(fetchEventDetails(id));

            // Clear selected seats
            setSelectedSeats([]);

            toast.success('Booking confirmed! Your e-ticket has been sent to your email.');
          } catch (error) {
            console.error('Payment verification failed:', error);
            setBookingStatus({
              loading: false,
              error: 'Payment verification failed. Please contact support.',
              message: ''
            });
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#16a34a' // Green color for Razorpay theme
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
      console.error('Booking failed:', error);
      setBookingStatus({
        loading: false,
        error: error.response?.data?.message || 'Failed to create booking. Please try again.',
        message: ''
      });
      toast.error(error.response?.data?.message || 'Failed to create booking. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-20">Loading event details...</div>;
  if (error) return <div className="text-center text-red-600 py-20">Error: {error}</div>;
  if (!eventDetails) return <div className="text-center py-20">Event not found</div>;

  const formattedDate = formatEventDate(eventDetails.date);
  const totalPrice = selectedSeats.length * (eventDetails.price || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-indigo-700">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-white"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{eventDetails.name}</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {eventDetails.shortDescription || 'Secure your spot at this amazing event'}
          </p>
        </motion.div>
      </div>
      
      {/* Main Content */}
      <main className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              {/* Event Image */}
              <div className="md:w-1/2">
                <img 
                  src={eventDetails.imageUrl || 'https://via.placeholder.com/800x500?text=Event+Image'} 
                  alt={eventDetails.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Event Details */}
              <div className="p-8 md:w-1/2">
                <div className="flex items-center mb-6">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {eventDetails.category || 'General'}
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                    <p className="text-gray-900">{formattedDate}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="text-gray-900">{eventDetails.venue || 'Venue not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{eventDetails.price || '0'}
                      <span className="text-sm font-normal text-gray-500 ml-1">per seat</span>
                    </p>
                  </div>
                  
                  {/* Seat Selection */}
                  <div className="pt-6 border-t border-gray-200">
                    <SeatSelector 
                      selectedSeats={selectedSeats}
                      bookedSeats={eventDetails.bookedSeats || []}
                      onSelect={handleSeatSelection}
                      price={eventDetails.price || 0}
                      maxSelections={10}
                    />
                    
                    {/* Book Now Button */}
                    <div className="mt-6">
                      <button
                        onClick={handleBook}
                        disabled={selectedSeats.length === 0 || bookingStatus.loading}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                          selectedSeats.length === 0 || bookingStatus.loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {bookingStatus.loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          `Book ${selectedSeats.length} ${selectedSeats.length === 1 ? 'Seat' : 'Seats'} for ₹${totalPrice}`
                        )}
                      </button>
                      
                      {bookingStatus.error && (
                        <p className="mt-2 text-sm text-red-600">{bookingStatus.error}</p>
                      )}
                      {bookingStatus.message && (
                        <p className="mt-2 text-sm text-green-600">{bookingStatus.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Description */}
            <div className="p-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <div className="prose max-w-none text-gray-600">
                {eventDetails.description || 'No description available.'}
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
