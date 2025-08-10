import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaSpinner, 
  FaSearch, 
  FaCalendarAlt, 
  FaUser, 
  FaTicketAlt, 
  FaRupeeSign, 
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { getAllBookings, updateBookingStatus } from '../../slices/bookingSlice';

// Status badge component for consistent status display
const StatusBadge = ({ status }) => {
  const statusConfig = {
    confirmed: { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mr-1" /> },
    cancelled: { color: 'bg-red-100 text-red-800', icon: <FaTimesCircle className="mr-1" /> },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock className="mr-1" /> },
    completed: { color: 'bg-blue-100 text-blue-800', icon: <FaCheckCircle className="mr-1" /> },
    refunded: { color: 'bg-purple-100 text-purple-800', icon: <FaRupeeSign className="mr-1" /> },
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ViewBookings = () => {
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector((state) => state.booking);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Fetch all bookings on component mount
  useEffect(() => {
    dispatch(getAllBookings());
  }, [dispatch]);

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
      await dispatch(updateBookingStatus({ bookingId, status: newStatus })).unwrap();
      toast.success('Booking status updated successfully');
      dispatch(getAllBookings()); // Refresh the list
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error(err.message || 'Failed to update booking status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Filter and sort bookings based on search, status and date
  const filteredBookings = bookings
    .filter(booking => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        booking.event?.name?.toLowerCase().includes(searchLower) ||
        booking.user?.name?.toLowerCase().includes(searchLower) ||
        booking.user?.email?.toLowerCase().includes(searchLower) ||
        booking._id.toLowerCase().includes(searchLower) ||
        booking.paymentId?.toLowerCase().includes(searchLower);
        
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)); // Sort by most recent first

  // Loading state
  if (loading === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaInfoCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Bookings</h2>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <button style={{color:"white"}}
              onClick={() => dispatch(getAllBookings())}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaSpinner className={`mr-2 ${loading === 'pending' ? 'animate-spin' : 'hidden'}`} />
              Refresh
            </button>
            {/* <button style={{color:"white"}}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                // TODO: Implement export functionality
                toast.info('Export functionality coming soon!');
              }}
            >
              <FaDownload className="mr-2" />
              Export
            </button> */}
          </div>
        </div>
        
        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by event, user, email, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="overflow-x-auto">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found matching your criteria</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaTicketAlt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">#{booking._id.slice(-6).toUpperCase()}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(booking.bookedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                          {booking.paymentId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Payment: {booking.paymentId.slice(-8)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.event?.name || 'Event not found'}</div>
                      <div className="text-sm text-gray-500">
                        {booking.event?.date ? format(new Date(booking.event.date), 'MMM d, yyyy') : 'N/A'}
                        {booking.event?.time && ` • ${booking.event.time}`}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.seats?.length || 0} {booking.seats?.length === 1 ? 'seat' : 'seats'}
                        </span>
                        {booking.seats?.length > 0 && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({booking.seats.join(', ')})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FaUser className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{booking.user?.name || 'User not found'}</div>
                          <div className="text-sm text-gray-500">{booking.user?.email || 'N/A'}</div>
                          {booking.user?.phone && (
                            <div className="text-xs text-gray-500">{booking.user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <StatusBadge status={booking.status} />
                        <div className="text-sm text-gray-900">
                          {formatCurrency(booking.totalAmount)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2 items-end">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                            disabled={updatingStatus[booking._id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {updatingStatus[booking._id] ? 'Updating...' : 'Confirm'}
                          </button>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <button style={{color:"white"}}
                            onClick={() => handleStatusUpdate(booking._id, 'completed')}
                            disabled={updatingStatus[booking._id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {updatingStatus[booking._id] ? 'Updating...' : 'Mark Completed'}
                          </button>
                        )}
                        
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <button style={{color:"white"}}
                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                            disabled={updatingStatus[booking._id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {updatingStatus[booking._id] ? 'Updating...' : 'Cancel'}
                          </button>
                        )}
                        
                        {booking.status === 'cancelled' && (
                          <button style={{color:"white"}}
                            onClick={() => handleStatusUpdate(booking._id, 'refunded')}
                            disabled={updatingStatus[booking._id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                          >
                            {updatingStatus[booking._id] ? 'Processing...' : 'Mark as Refunded'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBookings;
