import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
 
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const emailSuffix = '@storelink.it';
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Show suggestions if no "@" is present
    setShowSuggestions(!value.includes('@'));
  };

  const handleSuggestionClick = () => {
    setUsername((prev) => `${prev}${emailSuffix}`);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8000/token', new URLSearchParams({
        username: username,
        password: password,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, role, user_id} = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_id', user_id);
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin-dashboard');
      }
      else {
        navigate('/employee-dashboard');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
      <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Enter your email"
            value={username}
            onChange={handleEmailChange}
          />
          {showSuggestions && (
            <div
              style={{
                position: 'absolute',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                zIndex: 10,
                cursor: 'pointer',
              }}
              onClick={handleSuggestionClick}
            >
              {username}@storelink.it
            </div>
          )}
        </div>
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}

      <button onClick={() => navigate('/register')} style={{ marginTop: '10px' }}>
        Register
      </button>
    </div>

  );
};

export default Login;
