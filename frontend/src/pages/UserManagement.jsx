import { useState } from 'react';

const UserManagement = ({ users }) => {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email"
        style={{marginBottom:'1em',padding:'0.5em'}}
      />
      <table className="responsive-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Verified</th><th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="4">No users found.</td></tr>
          ) : filtered.map(user => (
            <tr key={user._id}>
              <td data-label="Name">{user.name}</td>
              <td data-label="Email">{user.email}</td>
              <td data-label="Verified">{user.isVerified ? 'Yes' : 'No'}</td>
              <td data-label="Admin">{user.isAdmin ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default UserManagement;
