import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './admin/components/login';
import UserLogin from './components/login';
import AdminDashboard from './admin/pages/dashboard';
import UserDashboard from './pages/user_dashboard';
import AdminNavbar from './admin/components/navbar';
import UserNavbar from './components/navbar';
import Footer from './components/footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="" element={<UserLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <>
                <AdminNavbar />
                <AdminDashboard />
                <Footer />
              </>
            }
          />
          <Route
            path="/user/dashboard"
            element={
              <>
                <UserNavbar />
                <UserDashboard />
                <Footer />
              </>
            }
          />
          <Route path="/logout" element={<UserLogin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

