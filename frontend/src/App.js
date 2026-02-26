import React from 'react';
import { Navigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import Profile from './pages/profile/Profile';
import Signup from './pages/signup/Signup';
import Navbar from './components/navbar/Navbar'
import TeamFooter from './components/footer/TeamFooter';
import TwitterStats from './TwitterStats';
import ModeratorPanel from './pages/moderator/ModeratorPanel';


function AppContent() {
  const location = useLocation();


  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  const isModerator = role === 'moderator';

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* HOME: moderator se preusmerava na /moderator */}
          <Route
            path="/"
            element={isModerator ? <Navigate to="/moderator" replace /> : <Home />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* PROFILE: moderator se preusmerava na /moderator */}
          <Route
            path="/profile"
            element={isModerator ? <Navigate to="/moderator" replace /> : <Profile />}
          />

          {/* <Route path="/stats" element={<TwitterStats />} /> */}
        
          {/* MODERATOR: samo ulogovan moderator */}
          <Route
            path="/moderator"
            element={
              !token ? (
                <Navigate to="/login" replace />
              ) : isModerator ? (
                <ModeratorPanel />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer sakrij na login i na moderator strani (da moderator ima "čistu" app) */}
      {location.pathname !== '/login' && location.pathname !== '/moderator' && <TeamFooter />}
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