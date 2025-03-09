import React from 'react';
import { Link } from 'react-router-dom';
//import './Login.css';

function AdminLogin() {
  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <form>
        <input type="text" placeholder="Username" required />
        <input type="password" placeholder="Password" required />
        <Link to="/forgot-password">Forgot Password?</Link>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;