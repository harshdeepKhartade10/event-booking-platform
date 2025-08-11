// frontend/src/components/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td className={`status-${user.status}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </td>
                <td>{user.bookingCount || 0}</td>
                <td>
                  <button 
                    className={user.status === 'active' ? 'btn-warning' : 'btn-success'}
                    onClick={() => toggleUserStatus(user._id, user.status)}
                  >
                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button 
                    className="btn-info"
                    onClick={() => setSelectedUser(user)}
                  >
                    View Bookings
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Bookings Modal */}
      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedUser.name}'s Bookings</h3>
            {selectedUser.bookings?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>{booking.event?.name}</td>
                      <td>{new Date(booking.event?.date).toLocaleDateString()}</td>
                      <td>{booking.seats?.join(', ')}</td>
                      <td>₹{booking.amount}</td>
                      <td className={`status-${booking.status}`}>
                        {booking.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No bookings found for this user.</p>
            )}
            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;