import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Función para manejar errores de autenticación
const handleAuthError = (response) => {
  if (response.status === 401 || response.status === 403) {
    // Token expirado o inválido, redirigir al login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  throw new Error('Error en la solicitud');
};

export async function fetchExpenses() {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

export async function addExpense(expense) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expense),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

export async function deleteExpense(id) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

export async function updateExpense(id, expense) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expense),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

// Nuevas funciones para gestionar miembros
export async function getMembers(expenseId) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses/${expenseId}/members`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

export async function addMember(expenseId, email) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses/${expenseId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
}

export async function removeMember(expenseId, memberId) {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/expenses/${expenseId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
} 