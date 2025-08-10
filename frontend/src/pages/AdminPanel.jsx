// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useSelector } from 'react-redux';
// // import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import '../styles/AdminPanel.css';


// import BookingManagement from './BookingManagement.jsx';
// import UserManagement from './UserManagement.jsx';

// const AdminPanel = () => {
//   const { token } = useSelector((state) => state.auth);
//   const [events, setEvents] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [stats, setStats] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '', venue: '', category: '', price: '', totalSeats: '', description: '' });
//   const [seatLimit, setSeatLimit] = useState({ eventId: '', totalSeats: '' });
//   const [activeTab, setActiveTab] = useState('bookings');
//   const { user } = useSelector((state) => state.auth);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [eventsRes, usersRes, statsRes] = await Promise.all([
//           axios.get(`${import.meta.env.VITE_API_URL}/api/events`),
//           axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
//           axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats/events`, { headers: { Authorization: `Bearer ${token}` } })
//         ]);
//         setEvents(eventsRes.data);
//         setUsers(usersRes.data);
//         setStats(statsRes.data);
//       } catch (err) {
//         setError('Failed to fetch admin data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [token]);

//   // Event CRUD
//   const handleCreateEvent = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post(`${import.meta.env.VITE_API_URL}/api/events`, newEvent, { headers: { Authorization: `Bearer ${token}` } });
//       window.location.reload();
//     } catch (err) {
//       setError('Failed to create event');
//     }
//   };
//   const handleDeleteEvent = async (id) => {
//     if (!window.confirm('Delete this event?')) return;
//     try {
//       await axios.delete(`${import.meta.env.VITE_API_URL}/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
//       window.location.reload();
//     } catch (err) {
//       setError('Failed to delete event');
//     }
//   };
//   // Seat limit control
//   const handleSeatLimit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/events/seat-limit`, seatLimit, { headers: { Authorization: `Bearer ${token}` } });
//       window.location.reload();
//     } catch (err) {
//       setError('Failed to update seat limit');
//     }
//   };

//   return (
//     <div className="admin-panel">
//       <h2>Admin Panel</h2>
//       {loading ? <div>Loading...</div> : error ? <div className="error">{error}</div> : (
//         <>
//           <section>
//             <h3>Create Event</h3>
//             <form onSubmit={handleCreateEvent} className="admin-form">
//               <input name="name" placeholder="Name" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} required />
//               <input name="date" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
//               <input name="time" placeholder="Time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required />
//               <input name="venue" placeholder="Venue" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} required />
//               <input name="category" placeholder="Category" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })} required />
//               <input name="price" type="number" placeholder="Price" value={newEvent.price} onChange={e => setNewEvent({ ...newEvent, price: e.target.value })} required />
//               <input name="totalSeats" type="number" placeholder="Total Seats" value={newEvent.totalSeats} onChange={e => setNewEvent({ ...newEvent, totalSeats: e.target.value })} required />
//               <textarea name="description" placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
//               <button type="submit">Create Event</button>
//             </form>
//           </section>
//           <section>
//             <h3>All Events</h3>
//             <table>
//               <thead><tr><th>Name</th><th>Date</th><th>Venue</th><th>Seats</th><th>Actions</th></tr></thead>
//               <tbody>
//                 {events.map(event => (
//                   <tr key={event._id}>
//                     <td>{event.name}</td>
//                     <td>{new Date(event.date).toLocaleDateString()}</td>
//                     <td>{event.venue}</td>
//                     <td>{event.availableSeats} / {event.totalSeats}</td>
//                     <td>
//                       <button onClick={() => handleDeleteEvent(event._id)}>Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </section>
//           <section>
//             <h3>Seat Limit Control</h3>
//             <form onSubmit={handleSeatLimit} className="admin-form">
//               <select name="eventId" value={seatLimit.eventId} onChange={e => setSeatLimit({ ...seatLimit, eventId: e.target.value })} required>
//                 <option value="">Select Event</option>
//                 {events.map(event => (
//                   <option key={event._id} value={event._id}>{event.name}</option>
//                 ))}
//               </select>
//               <input name="totalSeats" type="number" placeholder="Total Seats" value={seatLimit.totalSeats} onChange={e => setSeatLimit({ ...seatLimit, totalSeats: e.target.value })} required />
//               <button type="submit">Update Seat Limit</button>
//             </form>
//           </section>
//           <section>
//             <h3>Booking Analytics</h3>
//             <table className="responsive-table">
//               <thead><tr><th>Event</th><th>Bookings</th></tr></thead>
//               <tbody>
//                 {stats.map(stat => {
//                   const event = events.find(e => e._id === stat._id);
//                   return (
//                     <tr key={stat._id}>
//                       <td>{event ? event.name : stat._id}</td>
//                       <td>{stat.bookings}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </section>
//           <section>
//             <h3>Booking Management</h3>
//             <BookingManagement token={token} />
//           </section>
//           <section>
//             <h3>User Management</h3>
//             <UserManagement users={users} />
//           </section>
//         </>
//       )}
//     </div>
//   );
// };
// export default AdminPanel;


import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPanel.css';

import BookingManagement from './BookingManagement.jsx';
import UserManagement from './UserManagement.jsx';

const AdminPanel = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    category: '',
    price: '',
    totalSeats: '',
    description: '',
  });
  const [seatLimit, setSeatLimit] = useState({ eventId: '', totalSeats: '' });
  const [activeTab, setActiveTab] = useState('bookings');
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user?.isAdmin) {
    return null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsRes, usersRes, statsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/events`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats/events`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setEvents(eventsRes.data);
        setUsers(usersRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Event CRUD
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/events`, newEvent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (err) {
      setError('Failed to create event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  // Seat limit control
  const handleSeatLimit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/events/seat-limit`,
        seatLimit,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      setError('Failed to update seat limit');
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <button
            className={activeTab === 'bookings' ? 'active' : ''}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            {activeTab === 'events' && (
              <>
                <section>
                  <h3>Create Event</h3>
                  <form onSubmit={handleCreateEvent} className="admin-form">
                    <input
                      name="name"
                      placeholder="Name"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                      required
                    />
                    <input
                      name="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                      required
                    />
                    <input
                      name="time"
                      placeholder="Time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                      required
                    />
                    <input
                      name="venue"
                      placeholder="Venue"
                      value={newEvent.venue}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, venue: e.target.value })
                      }
                      required
                    />
                    <input
                      name="category"
                      placeholder="Category"
                      value={newEvent.category}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, category: e.target.value })
                      }
                      required
                    />
                    <input
                      name="price"
                      type="number"
                      placeholder="Price"
                      value={newEvent.price}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, price: e.target.value })
                      }
                      required
                    />
                    <input
                      name="totalSeats"
                      type="number"
                      placeholder="Total Seats"
                      value={newEvent.totalSeats}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          totalSeats: e.target.value,
                        })
                      }
                      required
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                    />
                    <button type="submit">Create Event</button>
                  </form>
                </section>

                <section>
                  <h3>All Events</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Venue</th>
                        <th>Seats</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event._id}>
                          <td>{event.name}</td>
                          <td>
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td>{event.venue}</td>
                          <td>
                            {event.availableSeats} / {event.totalSeats}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteEvent(event._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3>Seat Limit Control</h3>
                  <form onSubmit={handleSeatLimit} className="admin-form">
                    <select
                      name="eventId"
                      value={seatLimit.eventId}
                      onChange={(e) =>
                        setSeatLimit({
                          ...seatLimit,
                          eventId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Event</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                    <input
                      name="totalSeats"
                      type="number"
                      placeholder="Total Seats"
                      value={seatLimit.totalSeats}
                      onChange={(e) =>
                        setSeatLimit({
                          ...seatLimit,
                          totalSeats: e.target.value,
                        })
                      }
                      required
                    />
                    <button type="submit">Update Seat Limit</button>
                  </form>
                </section>
              </>
            )}

            {activeTab === 'analytics' && (
              <section>
                <h3>Booking Analytics</h3>
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat) => {
                      const event = events.find((e) => e._id === stat._id);
                      return (
                        <tr key={stat._id}>
                          <td>{event ? event.name : stat._id}</td>
                          <td>{stat.bookings}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {activeTab === 'bookings' && <BookingManagement token={token} />}
            {activeTab === 'users' && <UserManagement users={users} />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
