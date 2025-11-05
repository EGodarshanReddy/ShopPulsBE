import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

interface User {
  id: number;
  userType: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  [key: string]: any;
}

interface AuthData {
  userId: number;
  userType: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (data: AuthData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    async function fetchUser() {
      try {
        setIsLoading(true);
        const response = await fetch(API_ENDPOINTS.ME, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  const login = async (data: AuthData): Promise<void> => {
    try {
      setIsLoading(true);
      // We don't need to make an actual login request here since the OTP verification
      // already sets the session, but we need to fetch the user data
      const response = await fetch(API_ENDPOINTS.ME, {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.user) {
          setUser(userData.user);
        } else {
          // If for some reason we have a userId but no actual user data
          // create a minimal user object from the auth data
          setUser({
            id: data.userId,
            userType: data.userType,
          });
        }
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err : new Error("Login failed"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiRequest("POST", API_ENDPOINTS.LOGOUT, {});
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err : new Error("Logout failed"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
