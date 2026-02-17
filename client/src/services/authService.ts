import axios from "axios";
import API_BASE_URL from "../config/api";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const authService = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },

  register: async (credentials: RegisterPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      credentials,
    );
    return response.data;
  },

  googleSignIn: async (credential: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/google", {
      credential,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },
};
