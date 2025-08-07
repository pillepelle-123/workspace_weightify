import axios from 'axios';
import { Weightlist, WeightlistTrack } from '../types';
import spotifyApi from './spotify';

export const createWeightlist = async (weightlistData: Partial<Weightlist>): Promise<Weightlist> => {
  const response = await spotifyApi.post('/api/weightlists', weightlistData);
  return response.data;
};

export const getUserWeightlists = async (): Promise<Weightlist[]> => {
  const response = await spotifyApi.get('/api/weightlists');
  return response.data;
};

export const getWeightlist = async (id: string): Promise<Weightlist> => {
  const response = await spotifyApi.get(`/api/weightlists/${id}`);
  return response.data;
};

export const updateWeights = async (
  id: string, 
  weights: { playlistId: string; weight: number }[]
): Promise<Weightlist> => {
  const response = await spotifyApi.put(`/api/weightlists/${id}/weights`, { weights });
  return response.data;
};

export const getNextTrack = async (
  id: string, 
  sessionId?: string
): Promise<{ sessionId: string; track: WeightlistTrack }> => {
  const url = sessionId 
    ? `/api/weightlists/${id}/play?sessionId=${sessionId}`
    : `/api/weightlists/${id}/play`;
  
  const response = await spotifyApi.get(url);
  return response.data;
};

export const getTracks = async (
  id: string, 
  sessionId: string
): Promise<WeightlistTrack[]> => {
  const response = await spotifyApi.get(`/api/weightlists/${id}/tracks?sessionId=${sessionId}`);
  return response.data;
};

export const resetPlayback = async (
  id: string, 
  sessionId: string
): Promise<{ success: boolean }> => {
  const response = await spotifyApi.put(`/api/weightlists/${id}/reset?sessionId=${sessionId}`);
  return response.data;
};

export const updateWeightlist = async (id: string, weightlistData: Partial<Weightlist>): Promise<Weightlist> => {
  const response = await spotifyApi.put(`/api/weightlists/${id}`, weightlistData);
  return response.data;
};

export const getTrackAlbumCover = async (trackId: string): Promise<string | null> => {
  const response = await spotifyApi.get(`/api/tracks/${trackId}/album-cover`);
  return response.data.albumCoverUrl;
};