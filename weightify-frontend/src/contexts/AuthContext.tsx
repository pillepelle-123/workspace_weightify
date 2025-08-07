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
    // Check if user is already logged in
    const accessToken = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (accessToken && user) {
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          accessToken, 
          user: JSON.parse(user) 
        } 
      });
    } else {
      dispatch({ type: 'AUTH_LOADED' });
    }
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