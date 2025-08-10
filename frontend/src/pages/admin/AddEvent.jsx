import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSpinner, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaImage, 
  FaInfoCircle, 
  FaMoneyBillWave,
  FaTag,
  FaChair
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddEvent = ({ onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    category: 'Concert', // Default category
    price: '',
    totalSeats: 40, // Default to max 40 seats
    availableSeats: 40, // Same as totalSeats initially
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const eventData = {
        ...formData,
        price: Number(formData.price),
        totalSeats: 40, // Fixed at 40 seats as per requirements
        availableSeats: 40, // Fixed at 40 seats as per requirements
        seats: Array.from({ length: 40 }, (_, i) => ({
          seatNumber: i + 1,
          isBooked: false,
          bookedBy: null,
          bookingDate: null
        }))
      };

      // First, save to database
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/events`,
        eventData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Then update seed.js file through API
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/events/update-seed`,
          eventData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } catch (seedError) {
        console.error('Error updating seed file (non-critical):', seedError);
        // Non-critical error - we still created the event in the database
      }
      
      toast.success('Event released successfully! It is now visible to users.');
      if (onCancel) {
        onCancel(); // Go back to dashboard
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-6">
          <button style={{color:"white"}}
            onClick={onCancel}
            className="bg-black text-white rounded-full p-2 hover:bg-gray-800 transition-colors mr-4"
            aria-label="Go back"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Release a New Event</h1>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-8 divide-y divide-slate-200"
        >
          {/* Section 1: Core Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-700">Core Details</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Event Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full input-style" placeholder="e.g., Summer Music Festival 2025" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="image" className="block text-sm font-medium text-slate-600 mb-1">Image URL *</label>
                <div className="relative">
                  <FaImage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="url" id="image" name="image" value={formData.image} onChange={handleChange} className="w-full input-style pl-10" placeholder="https://example.com/event-image.jpg" required />
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended size: 800x450px</p>
              </div>
            </div>
          </div>

          {/* Section 2: When & Where */}
          <div className="space-y-6 pt-8">
            <h2 className="text-xl font-semibold text-slate-700">When & Where</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Date *</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="w-full input-style pl-10" required />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-600 mb-1">Time *</label>
                <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} className="w-full input-style" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="venue" className="block text-sm font-medium text-slate-600 mb-1">Venue *</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" id="venue" name="venue" value={formData.venue} onChange={handleChange} className="w-full input-style pl-10" placeholder="e.g., City Convention Center" required />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Categorization & Pricing */}
          <div className="space-y-6 pt-8">
            <h2 className="text-xl font-semibold text-slate-700">Categorization & Pricing</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">Category *</label>
                <div className="relative">
                  <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full input-style pl-10 appearance-none" required>
                    <option>Concert</option>
                    <option>Conference</option>
                    <option>Workshop</option>
                    <option>Sports</option>
                    <option>Theater</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Price per ticket (₹) *</label>
                 <div className="relative">
                  <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" id="price" name="price" min="0" value={formData.price} onChange={handleChange} className="w-full input-style pl-10" placeholder="0" required />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Event Details */}
          <div className="space-y-6 pt-8">
            <h2 className="text-xl font-semibold text-slate-700">Event Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-4">
                <FaChair className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800">Seating Information</h4>
                  <p className="text-sm text-blue-700">As per system requirements, all new events are created with a fixed capacity of 40 seats.</p>
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Event Description *</label>
                <textarea id="description" name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full input-style" placeholder="Share details about the event, including schedule, special guests, and other important information..." required />
                <p className="mt-1 text-xs text-slate-500">This description will be visible to users on the event details page.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 flex justify-end space-x-4">
            <button style={{color:"white"}}
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Releasing Event...
                </>
              ) : (
                'Release Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvent;
