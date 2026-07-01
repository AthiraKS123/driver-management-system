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
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
        <h3 className="text-white font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
          Chat with {driver.name}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map(msg => {
          const isAdmin = msg.senderRole === 'admin';
          return (
            <div key={msg._id} className={`max-w-[80%] rounded-2xl p-3 text-sm ${isAdmin ? 'self-end bg-indigo-600 text-white rounded-br-none' : 'self-start bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
              {msg.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Message..." 
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </form>
    </div>
  );
}
