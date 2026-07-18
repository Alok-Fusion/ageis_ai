import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4fd1c5', // Glowing Teal
      contrastText: '#080b0f',
    },
    secondary: {
      main: '#9f7aea', // Neon Purple
    },
    error: {
      main: '#f56565', // Neon Red
    },
    warning: {
      main: '#ecc94b', // Yellow
    },
    info: {
      main: '#4299e1', // Blue
    },
    success: {
      main: '#48bb78', // Green
    },
    background: {
      default: '#080b0f',
      paper: '#0d131f',
    },
    text: {
      primary: '#f7fafc',
      secondary: '#a0aec0',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.021em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
