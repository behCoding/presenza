import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUpdatedUser(user);
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`http://localhost:8000/users/${editingUser.id}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:8000/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div>
      <h1>User Management</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div>
          <h2>Edit User</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
            <label>
              Username:
              <input
                type="text"
                value={updatedUser.username}
                onChange={(e) => setUpdatedUser({ ...updatedUser, username: e.target.value })}
              />
            </label>
            <label>
              Role:
              <input
                type="text"
                value={updatedUser.role}
                onChange={(e) => setUpdatedUser({ ...updatedUser, role: e.target.value })}
              />
            </label>
            <button type="submit">Update</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
