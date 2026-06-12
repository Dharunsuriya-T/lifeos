import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'lifeos_access_token';
const REFRESH_TOKEN_KEY = 'lifeos_refresh_token';
const SERVER_URL_KEY = 'lifeos_server_url';

export const getAccessToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getServerUrl = async (): Promise<string> => {
  const url = await AsyncStorage.getItem(SERVER_URL_KEY);
  // Default to 10.0.2.2 (Android Emulator localhost) or localhost (iOS Simulator localhost)
  return url || 'http://10.0.2.2:8081/api/v1';
};

export const setServerUrl = async (url: string): Promise<void> => {
  await AsyncStorage.setItem(SERVER_URL_KEY, url);
};
