import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventDetails } from '../slices/eventSlice';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import SeatSelector from '../components/SeatSelector';
import AuthPromptModal from '../components/AuthPromptModal';
import { fetchProfile } from '../slices/authSlice';

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
  
  // Calculate total price for selected seats
  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || eventDetails?.price || 0), 
    0
  );

  useEffect(() => { dispatch(fetchEventDetails(id)); }, [dispatch, id]);

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
          price: seat.price || eventDetails.price
        })),
        totalAmount: totalPrice
      };

      // 2. Create Razorpay order on backend
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/razorpay-order`,
        { amount: totalPrice * 100 }, // in paise
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { orderId, keyId } = orderRes.data;

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: totalPrice * 100,
        currency: 'INR',
        name: eventDetails.name,
        description: `Booking for ${selectedSeats.length} seat(s)`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 4. Confirm booking on payment success
            const bookingResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/bookings`,
              bookingData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setTicket(bookingResponse.data.ticket);
            setSelectedSeats([]);
            
            // Refresh event details to update seat availability
            dispatch(fetchEventDetails(id));
            
            // Show success message
            toast.success(`Successfully booked ${selectedSeats.length} seat(s)!`);
            
            setBookingStatus({
              loading: false,
              message: 'Booking confirmed!',
              error: ''
            });
          } catch (error) {
            console.error('Booking confirmation error:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm booking');
            setBookingStatus({
              loading: false,
              error: 'Failed to confirm booking. Please contact support.',
              message: ''
            });
          }
        },
        modal: {
          ondismiss: function() {
            setBookingStatus({
              loading: false,
              error: 'Payment was cancelled',
              message: ''
            });
            toast.info('Payment was cancelled');
          }
        },
        theme: { 
          color: '#2563eb',
          hide_topbar: false
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          event: eventDetails.name,
          seats: selectedSeats.map(s => s.seatNumber).join(', ')
        }
      };
      
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Payment gateway not loaded');
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initiate booking';
      toast.error(errorMessage);
      setBookingStatus({
        loading: false,
        error: errorMessage,
        message: ''
      });
    }
  };

  if (loading) return <div className="text-center py-20">Loading event details...</div>;
  if (error) return <div className="text-center text-red-600 py-20">Error: {error}</div>;
  if (!eventDetails) return <div className="text-center py-20">Event not found</div>;

  // Format date and time
  const eventDate = new Date(eventDetails.date);
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/2 h-64 md:h-auto">
              <img 
                src={eventDetails.image || '/placeholder-event.jpg'} 
                alt={eventDetails.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/800x500?text=Event+Image+Not+Available';
                }}
              />
            </div>
            <div className="p-6 md:p-8 md:w-1/2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventDetails.name}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <span className="inline-flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formattedDate}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {eventDetails.category || 'Event'}
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Venue</p>
                    <p className="text-gray-600">{eventDetails.venue}</p>
                    <p className="text-sm text-gray-500 mt-1">{eventDetails.address || 'Address not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Duration</p>
                    <p className="text-gray-600">{eventDetails.duration || '2-3 hours'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Seating Capacity</p>
                    <p className="text-gray-600">
                      <span className="font-medium text-green-600">{eventDetails.availableSeats}</span> of {eventDetails.totalSeats} seats available
                    </p>
                    {eventDetails.availableSeats < (eventDetails.totalSeats * 0.2) && (
                      <p className="text-sm text-red-600 mt-1">Selling out fast!</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Pricing</p>
                    <p className="text-gray-600">
                      ₹{eventDetails.price} <span className="text-sm text-gray-500">per seat</span>
                    </p>
                    {selectedSeats.length > 0 && (
                      <p className="mt-1 text-lg font-semibold text-blue-600">
                        Total: ₹{totalPrice} for {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {eventDetails.termsAndConditions && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600">{eventDetails.termsAndConditions}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="event-image-container">
            <img
              src={
                eventDetails.image ||
                `https://source.unsplash.com/600x400/?${encodeURIComponent([
                  eventDetails.name,
                  eventDetails.category,
                  (eventDetails.venue || '').split(',')[0],
                  'india'
                ].filter(Boolean).join(','))
                }`
              }
              alt={eventDetails.name}
              className="event-details-img"
              style={{width:'100%',maxWidth:'600px',height:'300px',objectFit:'cover',borderRadius:'12px',marginBottom:'1.5em',background:'#e5e7eb'}}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
          <div className="event-details-content">
            <h2 className="text-2xl font-bold mb-4">{eventDetails.name}</h2>
            <p className="mb-2"><span className="font-medium">Date:</span> {new Date(eventDetails.date).toLocaleString()}</p>
            <p className="mb-2"><span className="font-medium">Venue:</span> {eventDetails.venue}</p>
            <p className="mb-2"><span className="font-medium">Category:</span> {eventDetails.category}</p>
            <p className="mb-2"><span className="font-medium">Available Seats:</span> {eventDetails.availableSeats}</p>
            <p className="mb-4"><span className="font-medium">Price:</span> ₹{eventDetails.price}</p>
            <p className="mb-6"><span className="font-medium">Description:</span> {eventDetails.description}</p>
            <div style={{display:'flex',justifyContent:'center',gap:'2em',margin:'1.5em 0 0.5em 0',fontSize:'1.15em'}}>
              <span><b>Total Seats:</b> {eventDetails.totalSeats}</span>
              <span><b>Booked:</b> {eventDetails.bookedSeats ? eventDetails.bookedSeats.length : 0}</span>
              <span><b>Available:</b> {eventDetails.availableSeats}</span>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Select Your Seat</h3>
            <SeatSelector
              seats={eventDetails.seats || []}
              bookedSeats={eventDetails.bookedSeats || []}
              selectedSeats={selectedSeats}
              onSelect={setSelectedSeats}
            />
          </div>
          <button 
            onClick={handleBook} 
            disabled={selectedSeats.length === 0 || bookingStatus.loading} 
            style={{
              marginTop:'1em',
              padding:'0.75em 2em',
              fontSize:'1.1em',
              background: selectedSeats.length > 0 ? '#2ecc40' : '#95a5a6',
              color:'#fff',
              border:'none',
              borderRadius:'6px',
              cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            {bookingStatus.loading ? 'Processing...' : selectedSeats.length > 0 ? `Pay ₹${selectedSeats.length * eventDetails.price} for ${selectedSeats.length} seat(s)` : 'Select Seats to Book'}
          </button>
          {bookingStatus.message && <div style={{marginTop:'1em',color:bookingStatus.message.includes('success')?'green':'red'}}>{bookingStatus.message}</div>}
          {ticket && (
            <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6 max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
                <p className="text-gray-600 mt-2">Your ticket has been booked successfully.</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">🎟️ E-Ticket</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Confirmed</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Event</h4>
                    <p className="text-gray-900">{ticket.event?.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h4>
                    <p className="text-gray-900">
                      {ticket.event?.date ? new Date(ticket.event.date).toLocaleString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Venue</h4>
                    <p className="text-gray-900">{ticket.event?.venue || 'N/A'}</p>
                    {ticket.event?.address && (
                      <p className="text-sm text-gray-500 mt-1">{ticket.event.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Booking ID</h4>
                    <p className="font-mono text-gray-900">{ticket.bookingId || 'N/A'}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Seat{selectedSeats.length > 1 ? 's' : ''} Booked</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(ticket.seatNumbers) && ticket.seatNumbers.length > 0 ? (
                        ticket.seatNumbers.map((seat, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {seat}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No seats selected</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      // Print ticket functionality
                      window.print();
                    }}
                    className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Ticket
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/dashboard/my-bookings');
                    }}
                    className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    View All Bookings
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Auth Prompt Modal */}
          <AuthPromptModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            message={user && !user.isVerified ? 
              'Please verify your email to book tickets. Check your inbox for the verification code.' : 
              'Please sign in to book tickets. New users can create an account in seconds.'}
          />
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
