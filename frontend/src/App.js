// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
// Import Login and Register pages
import Login from './pages/Login';
import Register from './pages/Register';

// Simple Protected Route Component
// Checks if a user is marked as logged in (via localStorage)
const ProtectedRoute = ({ children }) => {
  // Check login status (adjust key 'currentUser' if you used a different one)
  const isLoggedIn = !!localStorage.getItem('currentUser');

  if (!isLoggedIn) {
    // Redirect to login page if not logged in, saving the intended location
    return <Navigate to="/login" replace />;
  }
  // Render the requested component if logged in
  return children;
};

// Simple Public Route Component
// Redirects logged-in users away from public pages like Login/Register
const PublicRoute = ({ children }) => {
    const isLoggedIn = !!localStorage.getItem('currentUser');
    if (isLoggedIn) {
        // Redirect to dashboard if already logged in
        return <Navigate to="/" replace />;
    }
    // Render the public page if not logged in
    return children;
}


function App() {
  return (
    <ThemeProvider> {/* Ensure ThemeProvider wraps the entire application */}
      <Router>
        <Routes>
          {/* Public routes accessible without login */}
          {/* Wrap Login and Register with PublicRoute to redirect if already logged in */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected application routes */}
          {/* Wrap main application routes with ProtectedRoute */}
          {/* These routes use the Layout component */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><Layout><Devices /></Layout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

          {/* Catch-all route: redirects unmatched paths to the dashboard (if logged in) or login (if not) */}
           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;