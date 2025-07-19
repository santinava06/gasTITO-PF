import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupExpenses from './pages/GroupExpenses';
import Reportes from './pages/Reportes';
import Login from './pages/Login';
import Register from './pages/Register';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
      <Route path="/groups/:groupId/expenses" element={<PrivateRoute><GroupExpenses /></PrivateRoute>} />
      <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ padding: 20 }}>
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
