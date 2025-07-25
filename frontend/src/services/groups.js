import { getToken } from './auth';

const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/auth$/, '/api/groups') : 'http://localhost:3001/api/groups');

// Funciones para grupos
export async function createGroup(groupData) {
  const token = getToken();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(groupData),
  });
  if (!res.ok) throw new Error('Error al crear grupo');
  return await res.json();
}

export async function getUserGroups() {
  const token = getToken();
  const res = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener grupos');
  return await res.json();
}

export async function getGroupDetails(groupId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener detalles del grupo');
  return await res.json();
}

// Funciones para invitaciones
export async function inviteToGroup(groupId, email) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Error al enviar invitación');
  return await res.json();
}

export async function acceptInvitation(token) {
  const authToken = getToken();
  const res = await fetch(`${API_URL}/invitations/${token}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  if (!res.ok) throw new Error('Error al aceptar invitación');
  return await res.json();
}

export async function getPendingInvitations() {
  const token = getToken();
  const res = await fetch(`${API_URL}/invitations/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener invitaciones');
  return await res.json();
}

// Funciones para gastos de grupos
export async function addGroupExpense(groupId, expenseData) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expenseData),
  });
  if (!res.ok) throw new Error('Error al agregar gasto al grupo');
  return await res.json();
}

export async function getGroupExpenses(groupId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/expenses`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener gastos del grupo');
  return await res.json();
}

export async function deleteGroupExpense(groupId, expenseId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al eliminar gasto del grupo');
  return await res.json();
}

export async function updateGroupExpense(groupId, expenseId, expense) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error('Error al actualizar gasto');
  return await res.json();
}

export async function updateMemberRole(groupId, userId, role) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}/members/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Error al cambiar el rol');
  return await res.json();
}

export async function deleteGroup(groupId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al eliminar grupo');
  return await res.json();
} 