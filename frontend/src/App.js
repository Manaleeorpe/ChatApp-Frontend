import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile.jsx';
import ChatScreen from './components/Chatscreen/index.js';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={<ChatScreen/>} />
          <Route path="/login" element={<Login />} />
        
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
//<Route path="/dashboard" element={<Dashboard />} />