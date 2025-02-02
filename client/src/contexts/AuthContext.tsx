import { createContext, useContext, useState, ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "@/api/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Clear any potentially corrupted tokens on mount
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && accessToken.length > 1000) { // If token is suspiciously large
      console.log('Found large token, clearing storage');
      localStorage.clear();
      return false;
    }
    return !!accessToken;
  });

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing tokens before login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      
      console.log('Login attempt - Before API call');
      const response = await apiLogin(email, password);
      
      console.log('Login response - Token analysis:', {
        accessTokenSize: response?.accessToken?.length,
        refreshTokenSize: response?.refreshToken?.length,
        userSize: JSON.stringify(response?.user).length
      });
      
      if (response?.accessToken?.length > 1000) {
        console.error('Received suspiciously large token, aborting');
        throw new Error('Invalid token received');
      }
      
      if (response?.accessToken && response?.refreshToken) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.clear();
      setIsAuthenticated(false);
      throw new Error(error?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await apiRegister(email, password);
    } catch (error) {
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessToken");
      setIsAuthenticated(false);
      throw new Error(error?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
