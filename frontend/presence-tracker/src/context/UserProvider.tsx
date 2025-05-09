import React, { useCallback, useState } from "react";
import UserContext from "./UserContext";
import { Employee } from "../types";
import { GetEmployeeDetails } from "../api/adminApi";

interface UserProviderProps {
  children: React.ReactNode;
}

const initialState = {
  id: 0,
  name: "",
  surname: "",
  job_start_date: "",
  full_time: false,
  phone_number: "",
  personal_email: "",
  work_email: "",
  is_active: false,
  role: "",
  iban: "",
};

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [employeeDetails, setEmployeeDetails] =
    useState<Employee>(initialState);

  const fetchEmployeeDetails = useCallback(async (id: number) => {
    try {
      const data = await GetEmployeeDetails(id);
      setEmployeeDetails({ ...data, id });
    } catch (error) {
      setEmployeeDetails(initialState);
      console.error("FetchEmployeeDetails error at UserContext: ", error);
    }
  }, []);

  return (
    <UserContext.Provider value={{ employeeDetails, fetchEmployeeDetails }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
