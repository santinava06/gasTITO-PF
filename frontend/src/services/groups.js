import { getToken, logout } from './auth';
import { cachedApiCall, invalidateGroupCache, invalidateExpensesCache } from './cache';

const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/auth$/, '/api/groups') : 'http://localhost:3001/api/groups');

// Función para manejar errores de autenticación
const handleAuthError = (response) => {
  if (response.status === 401 || response.status === 403) {
    logout();
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
  throw new Error('Error en la solicitud');
};

export async function createGroup(groupData) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(groupData),
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function getGroups() {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function getGroupDetails(groupId) {
  return cachedApiCall(async (id) => {
    const token = getToken();
    if (!token) {
      logout();
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }
    const res = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return handleAuthError(res);
    return await res.json();
  }, { groupId }, 10 * 60 * 1000); // Cache por 10 minutos
}

export async function getGroupExpenses(groupId, options = {}) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  
  // Construir query parameters
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page);
  if (options.limit !== undefined) params.append('limit', options.limit);
  if (options.category) params.append('category', options.category);
  if (options.search) params.append('search', options.search);
  if (options.dateFilter) params.append('dateFilter', options.dateFilter);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  
  const res = await fetch(`${API_URL}/${groupId}/expenses?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function addGroupExpense(groupId, expenseData) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expenseData),
  });
  if (!res.ok) return handleAuthError(res);
  
  // Invalidar cache de gastos después de agregar uno nuevo
  invalidateExpensesCache(groupId);
  
  return await res.json();
}

export async function deleteGroupExpense(groupId, expenseId) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function inviteToGroup(groupId, email) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function getPendingInvitations() {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/invitations/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function acceptInvitation(invitationId) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function updateMemberRole(groupId, userId, role) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}/members/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function deleteGroup(groupId) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

export async function updateGroupExpense(groupId, expenseId, expenseData) {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`${API_URL}/${groupId}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expenseData),
  });
  if (!res.ok) return handleAuthError(res);
  return await res.json();
}

// Nueva función para obtener todos los gastos de grupos para el dashboard analítico
export async function getAllGroupExpenses() {
  const token = getToken();
  if (!token) {
    logout();
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  
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
} 