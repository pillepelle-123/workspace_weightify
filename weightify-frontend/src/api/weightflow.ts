import { Weightflow } from '../types';
import spotifyApi from './spotify';

export const weightflowApi = {
  async getWeightflows(): Promise<Weightflow[]> {
    const response = await spotifyApi.get('/api/weightflows');
    return response.data;
  },

  async getWeightflow(id: string): Promise<Weightflow> {
    const response = await spotifyApi.get(`/api/weightflows/${id}`);
    return response.data;
  },

  async createWeightflow(weightflow: Omit<Weightflow, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Weightflow> {
    const response = await spotifyApi.post('/api/weightflows', weightflow);
    return response.data;
  },

  async updateWeightflow(id: string, weightflow: Partial<Weightflow>): Promise<Weightflow> {
    const response = await spotifyApi.put(`/api/weightflows/${id}`, weightflow);
    return response.data;
  },

  async deleteWeightflow(id: string): Promise<void> {
    await spotifyApi.delete(`/api/weightflows/${id}`);
  },

  async startPlayback(id: string): Promise<{ sessionId: string; track: any; weightflow: Weightflow }> {
    const response = await spotifyApi.post(`/api/weightflows/${id}/play`);
    return response.data;
  },

  async getNextTrack(id: string, sessionId: string): Promise<{ sessionId: string; track: any }> {
    const response = await spotifyApi.get(`/api/weightflows/${id}/next?sessionId=${sessionId}`);
    return response.data;
  }
};