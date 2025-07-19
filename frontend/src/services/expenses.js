import { getToken } from './auth';

const API_URL = 'http://localhost:3001/api/expenses';

export async function fetchExpenses() {
  const token = getToken();
  const res = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener gastos');
  return await res.json();
}

export async function addExpense(expense) {
  const token = getToken();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error('Error al agregar gasto');
  return await res.json();
}

export async function deleteExpense(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al eliminar gasto');
  return await res.json();
}

export async function updateExpense(id, expense) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}`, {
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

// Nuevas funciones para gestionar miembros
export async function getMembers(expenseId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${expenseId}/members`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al obtener miembros');
  return await res.json();
}

export async function addMember(expenseId, email) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${expenseId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Error al agregar miembro');
  return await res.json();
}

export async function removeMember(expenseId, memberId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${expenseId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al quitar miembro');
  return await res.json();
} 