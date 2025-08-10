const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getBudgets = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener presupuestos');
  }

  return await response.json();
};

export const createBudget = async (budgetData) => {
  const token = localStorage.getItem('token');
  
  // Calcular fechas de inicio y fin basadas en el período
  const startDate = new Date();
  let endDate = new Date();
  
  switch (budgetData.period) {
    case 'weekly':
      endDate.setDate(startDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(startDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(startDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(startDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(startDate.getMonth() + 1);
  }

  const budgetPayload = {
    name: budgetData.name,
    amount: budgetData.amount,
    period: budgetData.period,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    categories: budgetData.categories ? budgetData.categories.map(cat => ({
      category: cat,
      amount: budgetData.amount / budgetData.categories.length
    })) : []
  };

  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(budgetPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear presupuesto');
  }

  return await response.json();
};

export const updateBudget = async (budgetId, budgetData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(budgetData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar presupuesto');
  }

  return await response.json();
};

export const deleteBudget = async (budgetId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar presupuesto');
  }

  return await response.json();
};

export const getBudgetDetails = async (budgetId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener detalles del presupuesto');
  }

  return await response.json();
}; 