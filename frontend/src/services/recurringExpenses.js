import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api\/auth$/, '/api/recurring-expenses')
  : 'http://localhost:3001/api/recurring-expenses';

export async function getRecurringExpenses(groupId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${groupId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al obtener gastos recurrentes');
  return await res.json();
}

export async function getAllRecurringExpenses() {
  const token = getToken();
  const res = await fetch(`${API_URL}/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al obtener todos los gastos recurrentes');
  return await res.json();
}

export async function createRecurringExpense(data) {
  const token = getToken();
  const res = await fetch(`${API_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear gasto recurrente');
  return await res.json();
}

export async function pauseRecurringExpense(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}/pause`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al pausar gasto recurrente');
  return await res.json();
}

export async function resumeRecurringExpense(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}/resume`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al reanudar gasto recurrente');
  return await res.json();
}

export async function deleteRecurringExpense(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Error al eliminar gasto recurrente');
  return await res.json();
}