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
  ////console.log('API Request - Token from localStorage:', token);
  //console.log('API Request - URL:', config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    //console.log('API Request - Authorization header set');
  } else {
    //console.log('API Request - No token found in localStorage');
  }
  return config;
});

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