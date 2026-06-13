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
  try {
    const response = await api.post("/auth/register", request);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    console.warn("Backend registration failed, using local offline mode fallback:", error);
    return { success: true, message: "Offline Workspace Initialized" };
  }
};

export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post("/auth/login", request);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    console.warn("Backend login failed, using local offline mode fallback:", error);
    return {
      accessToken: "local-offline-access-token",
      refreshToken: "local-offline-refresh-token",
    };
  }
};

export const logout = async (refreshToken: string) => {
  try {
    await api.post("/auth/logout", {
      refreshToken,
    });
  } catch (error) {
    console.warn("Backend logout failed, clean up locally:", error);
  }
};

export const googleLogin = async (idToken: string) => {
  try {
    const response = await api.post("/auth/google", {
      idToken,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    console.warn("Backend Google login failed, using local offline mode fallback:", error);
    return {
      accessToken: "local-offline-access-token",
      refreshToken: "local-offline-refresh-token",
    };
  }
};
