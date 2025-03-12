import React from 'react';
import { Link } from 'react-router-dom';
import '../../index.css';
import logout from '../../assets/logout.png';
import logo from '../../assets/medic-logo.png';

function AdminNavbar() {
  return (
    <nav className="navbar">
      <div><img src={logo} className="logo" /></div>
      <div className="title">MedMe@{process.env.REACT_APP_ORGNAME}</div>
      <div><Link to="/logout"><img src={logout}  className="logout"></img></Link></div>
    </nav>
  );
}

export default AdminNavbar;