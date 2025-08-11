import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { createEvent, updateEvent } from '../../slices/eventSlice';

const EventForm = ({ isEdit = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { loading, eventDetails } = useSelector((state) => state.events);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    category: '',
    price: 0,
    availableSeats: 0,
    image: ''
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  // Load event data in edit mode
  useEffect(() => {
    if (isEdit && eventDetails) {
      setFormData({
        title: eventDetails.title || '',
        description: eventDetails.description || '',
        date: eventDetails.date ? eventDetails.date.split('T')[0] : '',
        time: eventDetails.time || '',
        venue: eventDetails.venue || '',
        category: eventDetails.category || '',
        price: eventDetails.price || 0,
        availableSeats: eventDetails.availableSeats || 0,
        image: eventDetails.image || ''
      });
      if (eventDetails.image) {
        setImagePreview(eventDetails.image);
      }
    }
  }, [isEdit, eventDetails, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'availableSeats' ? Number(value) : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.availableSeats < 0) newErrors.availableSeats = 'Available seats cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && typeof formData.image === 'string') {
          // Skip if image is a string (URL) and not changed
          return;
        }
        formDataToSend.append(key, formData[key]);
      });
      
      if (isEdit) {
        await dispatch(updateEvent({ id, formData: formDataToSend })).unwrap();
        toast.success('Event updated successfully');
      } else {
        await dispatch(createEvent(formDataToSend)).unwrap();
        toast.success('Event created successfully');
      }
      
      navigate('/admin/events');
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Events
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.title ? 'border-red-500' : ''
                }`}
                placeholder="Enter event title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.description ? 'border-red-500' : ''
                }`}
                placeholder="Enter event description"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.category ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select a category</option>
                <option value="concert">Concert</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="sports">Sports</option>
                <option value="theater">Theater</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.date ? 'border-red-500' : ''
                  }`}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.time ? 'border-red-500' : ''
                  }`}
                />
                {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                Venue *
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.venue ? 'border-red-500' : ''
                }`}
                placeholder="Enter venue address"
              />
              {errors.venue && <p className="mt-1 text-sm text-red-600">{errors.venue}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className={`block w-full pl-7 pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.price ? 'border-red-500' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700">
                  Available Seats *
                </label>
                <input
                  type="number"
                  id="availableSeats"
                  name="availableSeats"
                  min="0"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.availableSeats ? 'border-red-500' : ''
                  }`}
                  placeholder="0"
                />
                {errors.availableSeats && (
                  <p className="mt-1 text-sm text-red-600">{errors.availableSeats}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Event Image</label>
              <div className="mt-1 flex items-center">
                <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-full w-full text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </span>
                <label
                  htmlFor="image-upload"
                  className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <span>Change</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Update Event'
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
