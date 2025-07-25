import React, { useEffect, useState } from 'react';
import { fetchExpenses } from '../services/expenses';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];

function groupByCategory(expenses) {
  const map = {};
  expenses.forEach((e) => {
    if (!map[e.categoria]) map[e.categoria] = 0;
    map[e.categoria] += Number(e.monto);
  });
  return Object.entries(map).map(([categoria, monto]) => ({ categoria, monto }));
}

function Reportes() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses()
      .then(setExpenses)
      .catch(() => setError('No se pudieron cargar los gastos'))
      .finally(() => setLoading(false));
  }, []);

  const data = groupByCategory(expenses);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>Reportes</Typography>
      <Typography variant="subtitle1" gutterBottom>
        Gasto total por categoría
      </Typography>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 500, minHeight: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : data.length === 0 ? (
          <Typography>No hay datos para mostrar.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="monto"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ categoria, percent }) => `${categoria} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
}

export default Reportes; 