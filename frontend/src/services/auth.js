const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/auth';

export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login fallido');
  return await res.json();
}

export async function register(email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Registro fallido');
  return await res.json();
}

export function saveAuth({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  // Verificar si el token está expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      // Token expirado, limpiar localStorage
      logout();
      return null;
    }
    
    return token;
  } catch (error) {
    // Token inválido, limpiar localStorage
    logout();
    return null;
  }
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated() {
  const token = getToken();
  return token !== null;
} 