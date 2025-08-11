import { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, subDays } from 'date-fns';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BookingManagement = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Fetch bookings data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, analyticsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        setBookings(bookingsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Filter bookings based on search, status and date range
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.event?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    const bookingDate = new Date(booking.bookedAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // Include the entire end day
    
    const matchesDate = bookingDate >= startDate && bookingDate <= endDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Prepare data for charts
  const chartData = {
    labels: analytics?.dates || [],
    datasets: [
      {
        label: 'Bookings',
        data: analytics?.bookings || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Revenue',
        data: analytics?.revenue || [],
        borderColor: 'rgb(53, 162, 235)',
        yAxisID: 'y1',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Booking Management</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or event"
          className="search-input"
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <div className="date-range">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="date-input"
          />
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="analytics-summary">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p>{analytics.totalBookings}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${analytics.totalRevenue?.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Booking Value</h3>
            <p>${analytics.avgBookingValue?.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Bookings Chart */}
      <div className="chart-container">
        <h3>Bookings & Revenue Trend</h3>
        {analytics ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p>Loading analytics...</p>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bookings-table">
        <h3>Recent Bookings</h3>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No bookings found</td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking._id} 
                        className={`booking-row ${booking.status}`}
                        onClick={() => setSelectedBooking(booking)}>
                      <td data-label="ID">{booking._id.slice(-6)}</td>
                      <td data-label="User">{booking.user?.name || 'N/A'}</td>
                      <td data-label="Event">{booking.event?.name || 'N/A'}</td>
                      <td data-label="Seats">{booking.seats}</td>
                      <td data-label="Amount">${booking.amount}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td data-label="Date">
                        {new Date(booking.bookedAt).toLocaleDateString()}
                      </td>
                      <td data-label="Actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Booking ID:</span>
                <span>{selectedBooking._id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">User:</span>
                <span>{selectedBooking.user?.name} ({selectedBooking.user?.email})</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Event:</span>
                <span>{selectedBooking.event?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span>{new Date(selectedBooking.event?.date).toLocaleDateString()} at {selectedBooking.event?.time}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Venue:</span>
                <span>{selectedBooking.event?.venue}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Seats:</span>
                <span>{selectedBooking.seats}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span>${selectedBooking.amount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedBooking.status}`}>
                  {selectedBooking.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Booked On:</span>
                <span>{new Date(selectedBooking.bookedAt).toLocaleString()}</span>
              </div>
              
              {selectedBooking.payment && (
                <div className="payment-details">
                  <h4>Payment Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Payment ID:</span>
                    <span>{selectedBooking.payment.paymentId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${selectedBooking.payment.status}`}>
                      {selectedBooking.payment.status}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="btn secondary"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </button>
                {selectedBooking.status === 'pending' && (
                  <button 
                    className="btn primary"
                    onClick={async () => {
                      try {
                        await axios.put(
                          `${import.meta.env.VITE_API_URL}/api/admin/bookings/${selectedBooking._id}/confirm`,
                          {},
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        // Refresh bookings
                        const res = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/admin/bookings`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setBookings(res.data);
                        setSelectedBooking({
                          ...selectedBooking,
                          status: 'confirmed'
                        });
                      } catch (err) {
                        console.error('Error confirming booking:', err);
                      }
                    }}
                  >
                    Confirm Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
