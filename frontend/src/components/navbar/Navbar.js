import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="main-navbar">
      <Link to="/" className="nav-logo">
        E-TWITTER
      </Link>
      <div className="nav-menu">
        <Link to="/" className="menu-item">Početna</Link>
        <Link to="/profile" className="menu-item">Profil</Link>
        <Link to="/login" className="menu-item">Prijava</Link>
      </div>
    </nav>
  );
}

export default Navbar;