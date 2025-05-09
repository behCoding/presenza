import { createContext } from "react";
import { Employee } from "../types";

interface UserContextType {
  employeeDetails: Employee;
  fetchEmployeeDetails: (id: number) => void;
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

const UserContext = createContext<UserContextType>({
  employeeDetails: initialState,
  fetchEmployeeDetails: () => {},
});

export default UserContext;
