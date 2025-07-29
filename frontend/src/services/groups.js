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

// Cache simple para mejorar performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const cachedApiCall = async (key, apiCall) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await apiCall();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

export const getGroups = async () => {
  return cachedApiCall('groups', async () => {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const res = await fetch(`${API_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      return handleAuthError(res);
    }
    
    return await res.json();
  });
};

export const getGroupDetails = async (groupId) => {
  return cachedApiCall(`group-${groupId}`, async () => {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const res = await fetch(`${API_URL}/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      return handleAuthError(res);
    }
    
    return await res.json();
  });
};

export const getGroupExpenses = async (groupId, options = {}) => {
  const { page = 0, limit = 10, search = '', sortBy = 'fecha', sortOrder = 'desc' } = options;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sortBy,
    sortOrder
  });

  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/${groupId}/expenses?${queryParams}`, {
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

export const addGroupExpense = async (groupId, expenseData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expenseData),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  // Invalidar cache después de agregar
  invalidateCache('group-expenses');
  
  return await res.json();
};

export const createGroup = async (groupData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(groupData),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  // Invalidar cache después de crear
  invalidateCache('groups');
  
  return await res.json();
};

export const updateGroup = async (groupId, groupData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(groupData),
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  // Invalidar cache después de actualizar
  invalidateCache('groups');
  invalidateCache(`group-${groupId}`);
  
  return await res.json();
};

export const deleteGroup = async (groupId) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  // Invalidar cache después de eliminar
  invalidateCache('groups');
  invalidateCache(`group-${groupId}`);
  
  return await res.json();
};

export const inviteToGroup = async (groupId, email) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/${groupId}/invite`, {
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
};

export const getPendingInvitations = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/invitations/pending`, {
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

export const acceptInvitation = async (invitationId) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    return handleAuthError(res);
  }
  
  // Invalidar cache después de aceptar
  invalidateCache('groups');
  
  return await res.json();
};

export const rejectInvitation = async (invitationId) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`${API_URL}/groups/invitations/${invitationId}/reject`, {
    method: 'POST',
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

// Funciones para invalidar cache específico
export const invalidateGroupCache = () => {
  invalidateCache('groups');
};

export const invalidateExpensesCache = () => {
  invalidateCache('group-expenses');
};

// Función para obtener todos los gastos de grupos
export const getAllGroupExpenses = async () => {
  try {
    // Obtener todos los grupos del usuario
    const groups = await getGroups();
    
    // Obtener gastos de todos los grupos
    const allGroupExpenses = [];
    for (const group of groups) {
      try {
        const groupExpensesResponse = await getGroupExpenses(group.id);
        // Handle the new response structure: { expenses, pagination }
        const groupExpenses = groupExpensesResponse.expenses || groupExpensesResponse;
        // Agregar información del grupo a cada gasto
        const expensesWithGroupInfo = groupExpenses.map(expense => ({
          ...expense,
          groupId: group.id,
          groupName: group.nombre
        }));
        allGroupExpenses.push(...expensesWithGroupInfo);
      } catch (error) {
        console.error(`Error al obtener gastos del grupo ${group.id}:`, error);
      }
    }
    
    return allGroupExpenses;
  } catch (error) {
    console.error('Error al obtener todos los gastos de grupos:', error);
    return [];
  }
}; 