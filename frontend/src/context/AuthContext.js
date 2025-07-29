import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken, isAuthenticated } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación al cargar la app
    const checkAuth = () => {
      if (isAuthenticated()) {
        setToken(getToken());
        // Para desarrollo, podemos crear un usuario básico
        setUser({ email: 'usuario@ejemplo.com' });
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (user, token) => {
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setToken(null);
  };

  // Función para verificar si el token sigue siendo válido
  const checkTokenValidity = () => {
    const currentToken = getToken();
    if (!currentToken) {
      logout();
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      checkTokenValidity,
      isAuthenticated: isAuthenticated()
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
} 