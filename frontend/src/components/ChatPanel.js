import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function ChatPanel({ driver, socket, token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!driver || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/chat/${driver._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages || []);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchHistory();
  }, [driver, token]);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg) => {
      if (msg.driver === driver._id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    };
    socket.on('receive-message', handleReceive);
    return () => socket.off('receive-message', handleReceive);
  }, [socket, driver]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    
    socket.emit('send-message', {
      driverId: driver._id,
      senderRole: 'admin',
      text: text.trim()
    });
    setText('');
  };

  if (!driver) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 Chat: {driver.name}</h3>
        <button onClick={onClose} className="close-chat-btn">×</button>
      </div>
      <div className="chat-body">
        {messages.map(msg => (
          <div key={msg._id} className={`chat-message ${msg.senderRole === 'admin' ? 'my-msg' : 'their-msg'}`}>
            <span className="msg-text">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-footer" onSubmit={handleSend}>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Type a message..." 
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
