import api from './axios';
import type { SyncRequest, SyncResponse } from '../types/lifeOs';

export const syncWithServer = async (request: SyncRequest): Promise<SyncResponse> => {
  const response = await api.post<SyncResponse>('/sync', request);
  return response.data;
};

export const fetchUserProfile = async (): Promise<{ email: string }> => {
  const response = await api.get<{ email: string }>('/users/me');
  return response.data;
};
