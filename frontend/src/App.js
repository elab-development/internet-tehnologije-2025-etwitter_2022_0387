import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import Profile from './pages/profile/Profile';
import Signup from './pages/signup/Signup';
import Navbar from './components/navbar/Navbar'
import TeamFooter from './components/footer/TeamFooter';

/*
function App() {
  const location = useLocation();
  const noFooterRoutes = ['/login', '/signup'];
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <TeamFooter />
          {location.pathname !== '/login' && <TeamFooter />}
        </main>
      </div>
    </Router>
  );
}
*/
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
        </Routes>
      </main>
      
      {/* Footer se prikazuje samo ako nismo na /login */}
      {location.pathname !== '/login' && <TeamFooter />}
    </div>
  );
}

// 2. Glavna App komponenta samo "omotava" sve u Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
export default App;