import axios from 'axios';
import { SpotifyPlaylist, SpotifyTrack, User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Configure axios instance
const spotifyApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This enables cookies for session management
  timeout: 60000 // 60 second timeout for track list
});

// Add request interceptor to include auth token
spotifyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
spotifyApi.interceptors.response.use(
  (response) => {
    // Check if server provided a new token
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getLoginUrl = async (): Promise<string> => {
  const response = await spotifyApi.get('/auth/login');
  return response.data.authUrl;
};

export const getUserPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await spotifyApi.get('/auth/playlists');
  return response.data;
};

export const getPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
  const response = await spotifyApi.get(`/api/playlists/${playlistId}/tracks`);
  return response.data;
};

export default spotifyApi;