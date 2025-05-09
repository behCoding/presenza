import { createContext } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: number | null;
  userRole: string | null;
  login: (token: string, role: string, id: number, expiresIn: Date) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  userRole: null,
  login: () => {},
  logout: () => {},
});

export default AuthContext;
