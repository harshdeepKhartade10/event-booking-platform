// frontend/src/components/admin/BookingManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BookingManagement = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, analyticsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setBookings(bookingsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError('Failed to fetch booking data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bookings.map(b => 
        b._id === bookingId ? { ...b, status } : b
      ));
    } catch (err) {
      setError('Failed to update booking status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="booking-management">
      <h2>Booking Management</h2>
      
      {/* Analytics Section */}
      <section className="analytics-section">
        <h3>Booking Analytics (Last 30 Days)</h3>
        {analytics && (
          <div className="analytics-chart">
            <Line
              data={{
                labels: analytics.dates,
                datasets: [
                  {
                    label: 'Bookings',
                    data: analytics.bookings,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  },
                  {
                    label: 'Revenue (₹)',
                    data: analytics.revenue,
                    borderColor: 'rgb(53, 162, 235)',
                    tension: 0.1,
                    yAxisID: 'y1'
                  }
                ]
              }}
              options={{
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
              }}
            />
          </div>
        )}

        <div className="analytics-stats">
          <div className="stat-card">
            <h4>Total Bookings</h4>
            <p>{analytics?.totalBookings || 0}</p>
          </div>
          <div className="stat-card">
            <h4>Total Revenue</h4>
            <p>₹{analytics?.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
          <div className="stat-card">
            <h4>Avg. Booking Value</h4>
            <p>₹{analytics?.avgBookingValue?.toFixed(2) || '0'}</p>
          </div>
        </div>
      </section>

      {/* Bookings List */}
      <section className="bookings-list">
        <h3>All Bookings</h3>
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Event</th>
              <th>User</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td>{booking._id.slice(-6)}</td>
                <td>{booking.event?.name || 'N/A'}</td>
                <td>{booking.user?.name || 'Guest'}</td>
                <td>{booking.seats?.length || 0}</td>
                <td>₹{booking.amount}</td>
                <td>
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                    className={`status-${booking.status.toLowerCase()}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => setSelectedBooking(booking)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal">
          <div className="modal-content">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> {selectedBooking._id}</p>
            <p><strong>Event:</strong> {selectedBooking.event?.name}</p>
            <p><strong>User:</strong> {selectedBooking.user?.name || 'Guest'}</p>
            <p><strong>Email:</strong> {selectedBooking.user?.email || 'N/A'}</p>
            <p><strong>Seats:</strong> {selectedBooking.seats?.join(', ') || 'N/A'}</p>
            <p><strong>Amount:</strong> ₹{selectedBooking.amount}</p>
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            <p><strong>Booked At:</strong> {new Date(selectedBooking.bookedAt).toLocaleString()}</p>
            <button onClick={() => setSelectedBooking(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;