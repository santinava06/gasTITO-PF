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

export const getRecurringExpenses = async (groupId) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses/${groupId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
};

export const getAllRecurringExpenses = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
};

export const createRecurringExpense = async (recurringExpenseData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(recurringExpenseData),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
};

export const pauseRecurringExpense = async (id) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses/${id}/pause`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
};

export const resumeRecurringExpense = async (id) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses/${id}/resume`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  return await res.json();
};

export const deleteRecurringExpense = async (id) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/recurring-expenses/${id}`, {
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
};