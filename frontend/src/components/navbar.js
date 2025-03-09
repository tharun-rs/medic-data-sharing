import React from 'react';
import { Link } from 'react-router-dom';
//import './Navbar.css';

function UserNavbar() {
  return (
    <nav className="navbar">
      <div className="logo-title">
        <img src="/logo.png" alt="MedMe Logo" className="logo" />
        <h1>MedMe</h1>
      </div>
      <Link to="/logout" className="logout">Logout</Link>
    </nav>
  );
}

export default UserNavbar;