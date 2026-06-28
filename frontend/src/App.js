import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from './context/SocketContext';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const { socket } = useSocket();
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [drivers, setDrivers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const newToken = res.data.accessToken;
      localStorage.setItem('adminToken', newToken);
      setToken(newToken);
      setError('');
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setDrivers([]);
  };

  useEffect(() => {
    if (!token) return;

    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${API_URL}/drivers?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDrivers(res.data.drivers || []);
      } catch (err) {
        if (err.response?.status === 401) handleLogout();
      }
    };

    fetchDrivers();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = (data) => {
      setDrivers((prev) =>
        prev.map((d) => (d._id === data.driverId ? { ...d, status: data.status } : d))
      );
    };

    socket.on('driver-status-changed', handleStatusChange);

    return () => {
      socket.off('driver-status-changed', handleStatusChange);
    };
  }, [socket]);

  if (!token) {
    return (
      <div className="login-container">
        <form className="glass-card login-form" onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          {error && <p className="error">{error}</p>}
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="glass-header">
        <h1>Driver Management Dashboard 🚚</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <main className="dashboard-main">
        <div className="grid">
          {drivers.map(driver => (
            <div key={driver._id} className="glass-card driver-card">
              <div className="driver-header">
                <h3>{driver.name}</h3>
                <span className={`status-badge ${driver.status || 'offline'}`}>
                  <span className="dot"></span>
                  {(driver.status || 'offline').toUpperCase()}
                </span>
              </div>
              <p>📍 {driver.city}</p>
              <p>📞 {driver.phone}</p>
            </div>
          ))}
          {drivers.length === 0 && <p className="no-drivers">No drivers found.</p>}
        </div>
      </main>
    </div>
  );
}

export default App;
