import React, { useEffect, useState } from "react";
import AuthContext from "./AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem("user_role");
  });

  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem("user_id");
    return id ? parseInt(id) : null;
  });

  const login = (token: string, role: string, id: number, expiresIn: Date) => {
    // const expiryTime = new Date().getTime() + expiresIn * 1000;

    localStorage.setItem("token", token);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_id", id.toString());
    localStorage.setItem("token_expiry", expiresIn.toString());

    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("token_expiry");

    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
  };

  useEffect(() => {
    const checkTokenExpiry = () => {
      const expiry = localStorage.getItem("token_expiry");
      if (expiry) {
        const isTokenValid = new Date() < new Date(expiry);
        if (!isTokenValid) {
          logout();
        }
      }
    };

    checkTokenExpiry();

    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, userRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
