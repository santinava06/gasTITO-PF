import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#22336c', // Azul oscuro
      contrastText: '#fff',
    },
    secondary: {
      main: '#43a047', // Verde
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6fa', // Gris muy claro
      paper: '#fff',
    },
    text: {
      primary: '#22336c',
      secondary: '#6b7280', // Gris
    },
  },
  typography: {
    fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: '0.03em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
});

export default theme; 