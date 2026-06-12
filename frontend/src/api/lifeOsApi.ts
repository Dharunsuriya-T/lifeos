import api from "./axios";
import type { SyncRequest, SyncResponse, DashboardData, AnalyticsData } from "../types/lifeOs";

export const syncWithServer = async (request: SyncRequest): Promise<SyncResponse> => {
  const response = await api.post<SyncResponse>("/sync", request);
  return response.data;
};

export const fetchDashboard = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardData>("/dashboard");
  return response.data;
};

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const response = await api.get<AnalyticsData>("/analytics");
  return response.data;
};
