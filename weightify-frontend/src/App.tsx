import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { useAuth } from './hooks/useAuth';

// Components
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Callback from './components/auth/Callback';
import WeightlistList from './components/weightlist/WeightlistList';
import WeightlistForm from './components/weightlist/WeightlistForm';
import WeightlistDetail from './components/weightlist/WeightlistDetail';
import WeightflowList from './components/weightflow/WeightflowList';
import WeightflowForm from './components/weightflow/WeightflowForm';
import WeightflowDetail from './components/weightflow/WeightflowDetail';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1DB954', // Spotify green
    },
    secondary: {
      main: '#191414', // Spotify black
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const AppContent = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<Callback />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/weightlists" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightlists" 
            element={
              <ProtectedRoute>
                <WeightlistList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightlists/new" 
            element={
              <ProtectedRoute>
                <WeightlistForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightlists/:id/edit" 
            element={
              <ProtectedRoute>
                <WeightlistForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightlists/:id" 
            element={
              <ProtectedRoute>
                <WeightlistDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightflows" 
            element={
              <ProtectedRoute>
                <WeightflowList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightflows/new" 
            element={
              <ProtectedRoute>
                <WeightflowForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightflows/:id/edit" 
            element={
              <ProtectedRoute>
                <WeightflowForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weightflows/:id" 
            element={
              <ProtectedRoute>
                <WeightflowDetail />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;