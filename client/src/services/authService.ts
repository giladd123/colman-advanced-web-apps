import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

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
  token: string;
}

interface ServerAuthResponse {
  accessToken: string;
  refreshToken?: string;
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const authService = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ServerAuthResponse>("/auth/login", credentials);
    return { token: response.data.accessToken };
  },

  register: async (credentials: RegisterPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ServerAuthResponse>("/auth/register", credentials);
    return { token: response.data.accessToken };
  },
};
