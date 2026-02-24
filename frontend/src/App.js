import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import Profile from './pages/profile/Profile';
import Signup from './pages/signup/Signup';
import Navbar from './components/navbar/Navbar'
import TeamFooter from './components/footer/TeamFooter';
import TwitterStats from './TwitterStats';

function AppContent() {
  const location = useLocation();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stats" element={<TwitterStats />} />
        </Routes>
      </main>
      
      
      {location.pathname !== '/login' && <TeamFooter />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
export default App;