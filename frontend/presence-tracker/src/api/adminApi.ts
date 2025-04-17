import {
  Employee,
  EmployeeOverview,
  Holiday,
  HolidayResponse,
  PresenceData,
} from "../types";
import { handleApiCall } from "../utils/apiUtils";
import axiosInstance from "../utils/axiosInstance";

export const GetAllEmployees = async (): Promise<Employee[]> => {
  return handleApiCall<Employee[]>(
    () => axiosInstance.get("/users"),
    "GetAllEmployees"
  );
};

export const GetEmployeeDetails = async (
  employeeId: number
): Promise<Employee> => {
  return handleApiCall<Employee>(
    () => axiosInstance.get(`/users/${employeeId}`),
    "GetEmployeeDetails"
  );
};

export const GetPresenceData = async (
  employeeId: number,
  month: string,
  year: string
): Promise<PresenceData[]> => {
  return handleApiCall<PresenceData[]>(
    () =>
      axiosInstance.get(`/employee-presence/${employeeId}/${year}/${month}`),
    "GetPresenceData"
  );
};

export const GetAdminPresenceData = async (
  employeeId: number,
  month: string,
  year: string
): Promise<PresenceData[]> => {
  return handleApiCall<PresenceData[]>(
    () =>
      axiosInstance.get(
        `/admin-modified-presence/${employeeId}/${year}/${month}`
      ),
    "GetAdminPresenceData"
  );
};

export const GetEmployeeOverview = async (
  employeeId: number,
  month: string,
  year: string
): Promise<EmployeeOverview> => {
  return handleApiCall<EmployeeOverview>(
    () =>
      axiosInstance.get(
        `/employee-total_presence/${employeeId}/${year}/${month}`
      ),
    "GetEmployeeOverview"
  );
};

export const ExportEmployeePresenceData = async (
  employeeId: number,
  year: string,
  month: string
): Promise<Blob> => {
  return handleApiCall<Blob>(
    () =>
      axiosInstance.get(
        `/export_original_presence_overview/${employeeId}/${year}/${month}`,
        {
          responseType: "blob",
        }
      ),
    "ExportEmployeePresenceData"
  );
};

export const ExportAdminPresenceData = async (
  employeeId: number,
  year: string,
  month: string
): Promise<Blob> => {
  return handleApiCall<Blob>(
    () =>
      axiosInstance.get(
        `/export_modified_presence_overview/${employeeId}/${year}/${month}`,
        {
          responseType: "blob",
        }
      ),
    "ExportAdminPresenceData"
  );
};

export const SendEmailToMissing = async (
  yearMonth: string,
  text: string
): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.post(`/send_email_to_missing`, { yearMonth, text }),
    "SendEmailToMissing"
  );
};

export const SendEmailToOneEmployee = async (
  user_id: number,
  text: string
): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.post(`/send_email_to_employee`, { user_id, text }),
    "SendEmailToOneEmployee"
  );
};

export const GetMissingEmployees = async (
  year: string,
  month: string
): Promise<Employee[]> => {
  return handleApiCall<Employee[]>(
    () =>
      axiosInstance.get(`/retrieve_not_submitted_presence/${year}/${month}`),
    "GetMissingEmployees"
  );
};

export const PostAdminMonthlyPresence = async (
  userId: string,
  data: PresenceData[]
): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.post(`/submit-admin-presence?user_id=${userId}`, data),
    "PostAdminMonthlyPresence"
  );
};

export const AddNationalHoliday = async (
  date: string
): Promise<HolidayResponse> => {
  return handleApiCall<HolidayResponse>(
    () =>
      axiosInstance.post(
        `/add_national_holiday`,
        {
          nationalHolidayDate: date,
        },
        { headers: { "Content-Type": "application/json" } }
      ),
    "AddNationalHoliday"
  );
};

export const GetNationalHolidays = async (year: number): Promise<Holiday[]> => {
  return handleApiCall<Holiday[]>(
    () => axiosInstance.get(`/get_national_holidays/${year}`),
    "GetNationalHolidays"
  );
};

export const DeleteNationalHoliday = async (
  date: string
): Promise<HolidayResponse> => {
  return handleApiCall<HolidayResponse>(
    () => axiosInstance.delete(`/remove_national_holiday/${date}`),
    "DeleteNationalHoliday"
  );
};

export const UpdateUser = async (id: number, data: Employee): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.put(`/users/update/${id}`, data),
    "UpdateUser"
  );
};

export const DeleteUser = async (id: string): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.delete(`/users/delete/${id}`),
    "DeleteUser"
  );
};
