import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [token]);

  return (
    <div className="dashboard-wrapper" style={{maxWidth:'1300px',width:'98vw',minHeight:'100vh',margin:'0 auto',padding:'2.5em 2vw',background:'#fff',borderRadius:'16px',boxShadow:'0 2px 16px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflowX:'auto'}}>
      <h2 style={{fontSize:'2.2rem',fontWeight:700,marginBottom:'0.5rem',color:'#1a202c'}}>User Dashboard</h2>
      <h3>Booking History</h3>
      {loading ? <div>Loading...</div> : error ? <div className="error">{error}</div> : (
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(bookings) || bookings.length === 0 ? (
              <tr><td colSpan="5">No bookings found.</td></tr>
            ) : bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.event?.name || 'Event not found'}</td>
                <td>{b.event ? new Date(b.event.date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {Array.isArray(b.seats) 
                    ? b.seats.map(seat => 
                        `${seat.seatNumber} (₹${seat.price || '0'})`
                      ).join(', ')
                    : 'No seats selected'}
                </td>
                <td>
                  <span className={`status-badge ${b.status === 'cancelled' ? 'cancelled' : 'confirmed'}`}>
                    {b.status || 'pending'}
                  </span>
                </td>
                <td>{new Date(b.bookedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
// Add some basic styling for the dashboard
const styles = `
  .dashboard-wrapper {
    max-width: 1300px;
    width: 98vw;
    min-height: 100vh;
    margin: 0 auto;
    padding: 2.5em 2vw;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background-color: #f7fafc;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  tr:hover {
    background-color: #f8fafc;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-badge.confirmed {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-badge.cancelled {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .status-badge.pending {
    background-color: #fef3c7;
    color: #92400e;
  }
`;

// Add styles to the document head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export default Dashboard;
