import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaEye, FaTrash } from 'react-icons/fa';
import './AdminBookings.css';

const AdminBookings = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'bookedAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all bookings
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/bookings`,
          {
            params: {
              page: currentPage,
              limit: itemsPerPage,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              search: searchTerm || undefined,
              sortBy: sortConfig.key,
              sortOrder: sortConfig.direction,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setBookings(response.data.bookings || response.data);
        setTotalItems(response.data.total || response.data.length || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBookings();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, itemsPerPage, searchTerm, sortConfig, statusFilter, token, user, navigate]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Handle booking deletion
  const handleDelete = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Refresh bookings after deletion
        setBookings(bookings.filter(booking => booking._id !== bookingId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete booking');
        console.error('Error deleting booking:', err);
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="admin-bookings">
      <div className="admin-bookings-header">
        <h2>All Bookings</h2>
        <div className="admin-bookings-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-table-container">
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="no-bookings">No bookings found</div>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('user.name')}>
                  <div className="sortable-header">
                    User {getSortIcon('user.name')}
                  </div>
                </th>
                <th onClick={() => requestSort('event.name')}>
                  <div className="sortable-header">
                    Event {getSortIcon('event.name')}
                  </div>
                </th>
                <th onClick={() => requestSort('event.date')}>
                  <div className="sortable-header">
                    Event Date {getSortIcon('event.date')}
                  </div>
                </th>
                <th onClick={() => requestSort('seats')}>
                  <div className="sortable-header">
                    Seats {getSortIcon('seats')}
                  </div>
                </th>
                <th onClick={() => requestSort('totalAmount')}>
                  <div className="sortable-header">
                    Amount {getSortIcon('totalAmount')}
                  </div>
                </th>
                <th onClick={() => requestSort('status')}>
                  <div className="sortable-header">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th onClick={() => requestSort('bookedAt')}>
                  <div className="sortable-header">
                    Booked At {getSortIcon('bookedAt')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    {booking.user?.name || 'N/A'}
                    <div className="text-muted">{booking.user?.email || ''}</div>
                  </td>
                  <td>{booking.event?.name || 'N/A'}</td>
                  <td>
                    {booking.event?.date 
                      ? formatDate(booking.event.date)
                      : 'N/A'}
                  </td>
                  <td>{booking.seats || 0}</td>
                  <td>${booking.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`status-badge ${booking.status || 'pending'}`}>
                      {booking.status || 'Pending'}
                    </span>
                  </td>
                  <td>{formatDate(booking.bookedAt)}</td>
                  <td className="actions">
                    <button 
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                      className="action-btn view"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      onClick={() => handleDelete(booking._id)}
                      className="action-btn delete"
                      title="Delete Booking"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {pageNumbers.map((number) => (
            <button 
              key={number}
              onClick={() => setCurrentPage(number)}
              className={currentPage === number ? 'active' : ''}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
