import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CircularProgress, Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupExpenses from './pages/GroupExpenses';
import Reportes from './pages/Reportes';
import Login from './pages/Login';
import Register from './pages/Register';

function PrivateRoute({ children }) {
  const { token, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Breadcrumbs />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
        <Route path="/groups/:groupId/expenses" element={<PrivateRoute><GroupExpenses /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
      </Routes>
    </Container>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
