import { ReactNode, useContext, useEffect, useState } from "react";
import Header from "../Header";
import RegisterPage from "../../pages/RegisterPage";
import UserContext from "../../context/UserContext";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export const AppLayout = ({ children, title }: AppLayoutProps) => {
  const employeeId = Number(localStorage.getItem("user_id"));
  const [showUpdatePage, setShowUpdatePage] = useState(false);
  const { employeeDetails, fetchEmployeeDetails } = useContext(UserContext);

  const toggleUpdatePage = () => {
    setShowUpdatePage((prev) => !prev);
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails(employeeId);
    }
  }, [employeeId, fetchEmployeeDetails]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} showSignOut toggleUpdatePage={toggleUpdatePage} />
      <main className="flex-grow flex flex-col">
        {!showUpdatePage ? (
          children
        ) : (
          <RegisterPage isUpdate={true} employeeDetails={employeeDetails} />
        )}
      </main>
    </div>
  );
};
