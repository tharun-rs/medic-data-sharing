import React from 'react';
import { Link } from 'react-router-dom';
import '../../index.css';

function AdminLogin() {
  return (
    <div className="login-body">
    <div className="login-container">
      <form className="loginform">
        <h2>ADMIN LOGIN</h2>
        <input type="text" placeholder="Username" required />
        <input type="password" placeholder="Password" required />
        <Link to="/forgot-password" className="Link">Forgot Password?</Link>
        <button type="submit">login</button>
      </form>
    </div>
    </div>
  );
}

export default AdminLogin;