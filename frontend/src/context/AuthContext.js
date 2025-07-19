import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, logout as logoutService } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());

  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
  }, []);

  const login = (user, token) => {
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    logoutService();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 