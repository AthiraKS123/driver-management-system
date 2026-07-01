import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from './context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ChatPanel from './components/ChatPanel';
import './App.css';

const API_URL = 'http://localhost:5000/api';

const createDriverIcon = (status) => {
  const color = status === 'online' ? '#4ade80' : status === 'idle' ? '#facc15' : '#f87171';
  return L.divIcon({
    className: 'custom-driver-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function App() {
  const { socket } = useSocket();
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [drivers, setDrivers] = useState([]);
  const [selectedChatDriver, setSelectedChatDriver] = useState(null);
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

    const handleLocationUpdate = (data) => {
      setDrivers((prev) =>
        prev.map((d) => 
          (d._id === data.driverId ? { ...d, currentLocation: { lat: data.lat, lng: data.lng } } : d)
        )
      );
    };

    socket.on('driver-status-changed', handleStatusChange);
    socket.on('location-updated', handleLocationUpdate);

    return () => {
      socket.off('driver-status-changed', handleStatusChange);
      socket.off('location-updated', handleLocationUpdate);
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
        <div className="map-container">
          <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drivers.filter(d => d.currentLocation && d.currentLocation.lat && d.currentLocation.lng).map(driver => (
              <Marker 
                key={driver._id} 
                position={[driver.currentLocation.lat, driver.currentLocation.lng]}
                icon={createDriverIcon(driver.status || 'offline')}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{driver.name}</strong> <br />
                    <span style={{ color: driver.status === 'online' ? '#16a34a' : driver.status === 'idle' ? '#ca8a04' : '#dc2626', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {driver.status || 'offline'}
                    </span> <br />
                    {driver.phone}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="grid">
          {drivers.map(driver => (
            <div key={driver._id} className="glass-card driver-card">
              <div className="driver-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {driver.profileImage ? (
                    <img src={driver.profileImage} alt={driver.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.2)' }}>
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 style={{ margin: 0 }}>{driver.name}</h3>
                </div>
                <span className={`status-badge ${driver.status || 'offline'}`}>
                  <span className="dot"></span>
                  {(driver.status || 'offline').toUpperCase()}
                </span>
              </div>
              <p>📍 {driver.city}</p>
              <p>📞 {driver.phone}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  onClick={() => setSelectedChatDriver(driver)} 
                  style={{ flex: 1, padding: '10px', background: '#2f80ed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
          {drivers.length === 0 && <p className="no-drivers">No drivers found.</p>}
        </div>

        {selectedChatDriver && (
          <ChatPanel 
            driver={selectedChatDriver} 
            socket={socket} 
            token={token}
            onClose={() => setSelectedChatDriver(null)} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
