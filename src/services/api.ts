import axios, { type AxiosInstance } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL = BASE_URL) {
    this.api = axios.create({
      baseURL,
      timeout: 100000,
    });

    // attach token
    this.api.interceptors.request.use((config: any) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (import.meta.env.DEV) {
        console.info("[API request]", config.method?.toUpperCase(), `${config.baseURL ?? ""}${config.url ?? ""}`);
      }
      return config;
    });

    // handle unauthorized
    this.api.interceptors.response.use(
      (response: any) => {
        if (import.meta.env.DEV) {
          console.info("[API response]", response.status, response.config?.url);
        }
        return response;
      },
      async (error: any) => {
        if (import.meta.env.DEV) {
          console.error(
            "[API error]",
            error.response?.status ?? "NETWORK_ERROR",
            `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
          );
        }
        if (error?.response?.status === 401) {
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    localStorage.setItem("token", token);
  }

  clearToken() {
    localStorage.removeItem("token");
  }

  async login(email: string, password: string): Promise<void> {
    const { data } = await this.api.post("/login", { email, password });
    const token = data?.token ?? data?.access_token;
    if (!token) throw new Error("Token not returned");
    this.setToken(token);
  }

  async logout(): Promise<void> {
    try {
      // await this.api.post("/logout");
      await localStorage.removeItem("token");
    } catch {
      throw new Error("Logout failed");
    }
    this.clearToken();
  }

  async getProfile<T = any>(): Promise<T> {
    const { data } = await this.api.get("/profile");
    return data;
  }

  isAuthenticated(): boolean {
    const token = this.token || localStorage.getItem("token");
    return !!token;
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }
  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }
}

export const apiService = new ApiService();
