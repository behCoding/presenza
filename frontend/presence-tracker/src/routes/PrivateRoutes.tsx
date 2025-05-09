import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AdminPage from "../pages/AdminPage";
import EmployeePage from "../pages/EmployeePage";
import { useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import NotFoundPage from "../pages/NotFoundPage";
import { AppLayout } from "../components/layouts";

export const PrivateRoutes: React.FC = () => {
  const { userRole } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Redirect immediately if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/admin-dashboard"
        element={
          <AppLayout title="Admin Dashboard">
            <AdminPage />
          </AppLayout>
        }
      />
      <Route
        path="/employee-dashboard"
        element={
          <AppLayout title="Employee Dashboard">
            <EmployeePage />
          </AppLayout>
        }
      />
      <Route
        path="/"
        element={
          <Navigate
            to={
              userRole === "admin" ? "/admin-dashboard" : "/employee-dashboard"
            }
            replace
          />
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
