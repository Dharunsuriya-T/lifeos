import api from "./axios";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const register = async (request: RegisterRequest) => {
  const response = await api.post("/auth/register", request);

  return response.data;
};

export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", request);

  return response.data;
};

export const logout = async (refreshToken: string) => {
  await api.post("/auth/logout", {
    refreshToken,
  });
};

export const googleLogin = async (idToken: string) => {
  const response = await api.post("/auth/google", {
    idToken,
  });

  return response.data;
};
