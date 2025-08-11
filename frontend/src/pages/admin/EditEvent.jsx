import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { updateEvent, getEventById } from '../../slices/eventSlice';
import { toast } from 'react-toastify';
import { FaSpinner, FaArrowLeft, FaImage, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaRupeeSign, FaChair } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const EditEvent = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { event, loading, error } = useSelector((state) => state.event);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    date: new Date(),
    time: '',
    venue: '',
    price: 0,
    totalSeats: 40,
    availableSeats: 40,
    image: ''
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Fetch event data on component mount
  useEffect(() => {
    dispatch(getEventById(id));
  }, [dispatch, id]);
  
  // Update form data when event is loaded
  useEffect(() => {
    if (event && event._id === id) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'music',
        date: event.date ? new Date(event.date) : new Date(),
        time: event.time || '',
        venue: event.venue || '',
        price: event.price || 0,
        totalSeats: event.totalSeats || 40,
        availableSeats: event.availableSeats || 40,
        image: event.image || ''
      });
      
      if (event.image) {
        setImagePreview(event.image);
      }
    }
  }, [event, id]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'totalSeats' || name === 'availableSeats' 
        ? parseInt(value, 10) || 0 
        : value
    }));
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date
    }));
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error('Please enter a title for the event');
      return;
    }
    
    if (!formData.date) {
      toast.error('Please select a date for the event');
      return;
    }
    
    if (formData.totalSeats < 1 || formData.totalSeats > 40) {
      toast.error('Total seats must be between 1 and 40');
      return;
    }
    
    if (formData.availableSeats > formData.totalSeats) {
      toast.error('Available seats cannot exceed total seats');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create form data for file upload
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'date') {
          formDataToSend.append(key, formData[key].toISOString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Dispatch update action
      const resultAction = await dispatch(updateEvent({ id, eventData: formDataToSend }));
      
      if (updateEvent.fulfilled.match(resultAction)) {
        toast.success('Event updated successfully!');
        navigate('/admin/events');
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/events');
  };
  
  // Loading state
  if (loading === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2" /> Back to Events
          </button>
        </div>
      </div>
    );
  }
  
  // Main form
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Events
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the event details below
        </p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Event Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Image
            </label>
            <div className="mt-1 flex items-center">
              <div className="relative w-32 h-32 rounded-md overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FaImage className="w-8 h-8 mb-2" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
                >
                  <FaImage className="mr-2" />
                  Change Image
                </label>
                <input
                  id="image-upload"
                  name="image"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG, or WebP. Max 2MB.
                </p>
              </div>
            </div>
          </div>
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="exhibition">Exhibition</option>
                <option value="festival">Festival</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="Enter event description"
              />
            </div>
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                </div>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select date"
                  id="date"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  name="time"
                  id="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
              Venue
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="venue"
                id="venue"
                value={formData.venue}
                onChange={handleChange}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter venue address"
              />
            </div>
          </div>
          
          {/* Price & Seats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price (₹)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaRupeeSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="totalSeats" className="block text-sm font-medium text-gray-700">
                Total Seats <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaChair className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="totalSeats"
                  id="totalSeats"
                  min="1"
                  max="40"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="40"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum 40 seats allowed
              </p>
            </div>
            
            <div>
              <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700">
                Available Seats
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaChair className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="availableSeats"
                  id="availableSeats"
                  min="0"
                  max={formData.totalSeats}
                  value={formData.availableSeats}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Cannot exceed total seats
              </p>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="pt-5">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : 'Update Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
