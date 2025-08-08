import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User } from '../types';

interface AuthContextType extends AuthState {
  login: (accessToken: string, user: User) => void;
  logout: () => void;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true
};

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: { accessToken: string; user: User } }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_LOADED' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return {
        ...state,
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'AUTH_LOADED':
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const validateAndLoadAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');

      if (accessToken && user) {
        try {
          // Validate token by making a test API call
          const response = await fetch('http://localhost:3000/auth/validate', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
          });

          if (response.ok) {
            // Check for new token in response headers
            const newToken = response.headers.get('x-new-access-token');
            const finalToken = newToken || accessToken;
            
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
            }
            
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                accessToken: finalToken, 
                user: JSON.parse(user) 
              } 
            });
          } else {
            // Token invalid, clear storage and set loading to false
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            dispatch({ type: 'AUTH_LOADED' });
          }
        } catch (error) {
          // Network error or token validation failed, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_LOADED' });
        }
      } else {
        // No stored credentials, set loading to false
        dispatch({ type: 'AUTH_LOADED' });
      }
    };

    validateAndLoadAuth();
  }, []);

  const login = (accessToken: string, user: User) => {
    dispatch({ 
      type: 'LOGIN_SUCCESS', 
      payload: { accessToken, user } 
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};