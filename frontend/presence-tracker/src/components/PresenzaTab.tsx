import type React from "react";
import { useState, useEffect, useCallback, useContext } from "react";
import {
  ExportAdminPresenceData,
  ExportEmployeePresenceData,
  GetAllEmployees,
  GetMissingEmployees,
  SendEmailToMissing,
  SendEmailToOneEmployee,
} from "../api/adminApi";
import type { Employee } from "../types";
import { toast } from "react-toastify";
import EmployeePresenceSection from "./EmployeePresenceSection";
import ThemeContext from "../context/ThemeContext";

const PresenzaTab: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [missingEmployees, setMissingEmployees] = useState<Employee[]>([]);
  const [emailText, setEmailText] = useState<string>(
    "Hello,\nPlease ensure that you have submitted your attendance presence.\nKind Regards,\nAdminstration"
  );

  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeeDetails(employee);
  };

  const fetchEmployees = useCallback(async () => {
    const employeesData: Employee[] = await GetAllEmployees();
    console.log("empl", employeesData);

    setEmployees(employeesData);
  }, []);

  const fetchMissingEmployees = useCallback(async () => {
    if (!selectedYear || !selectedMonth) return;
    const missing = await GetMissingEmployees(selectedYear, selectedMonth);
    setMissingEmployees(missing);
  }, [selectedYear, selectedMonth]);

  const downloadExcelFile = (
    data: ArrayBuffer | BlobPart,
    filename: string
  ): void => {
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleEmployeeExportExcel = async () => {
    if (!employeeDetails || !selectedYear || !selectedMonth) {
      toast.info(
        "Please select an employee, year, and month before exporting."
      );
      return;
    }

    try {
      const response = await ExportEmployeePresenceData(
        employeeDetails?.id,
        selectedYear,
        selectedMonth
      );

      if("detail" in response) {
        toast.info(response.detail)
      } else {
        downloadExcelFile(
          response,
          `employee_presence_report_${selectedYear}_${selectedMonth}_${employeeDetails.name}_${employeeDetails.surname}.xlsx`
        );
      }
    } catch (error) {
      console.error("Employee export failed:", error);
      toast.error("Employee export failed")
    }
  };

  const handleAdminExportExcel = async () => {
    if (!employeeDetails || !selectedYear || !selectedMonth) {
      toast.info(
        "Please select an employee, year, and month before exporting."
      );
      return;
    }

    try {
      const response = await ExportAdminPresenceData(
        employeeDetails?.id,
        selectedYear,
        selectedMonth
      );

      if("detail" in response) {
        toast.info(response.detail)
      } else {
        downloadExcelFile(
          response,
          `admin_presence_report_${selectedYear}_${selectedMonth}_${employeeDetails.name}_${employeeDetails.surname}.xlsx`
        );
      }
    } catch (error) {
      console.error("Admin export failed:", error);
      toast.error("Admin export failed")
    }
  };

  const handleSendEmail = async (id?: number) => {
    if (!selectedYear || !selectedMonth) {
      toast.info("Please select a year and a month first.");
      return;
    }

    const apiCall = id
      ? SendEmailToOneEmployee(id, emailText)
      : SendEmailToMissing(`${selectedYear}-${selectedMonth}`, emailText);

    toast.promise(apiCall, {
      pending: "Sending...",
      success: id
        ? `Email sent to ${employeeDetails?.name}`
        : `Emails sent to all missing employees!`,
      error: `Failed to send ${id ? "email" : "emails"}. Please try again.`,
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchMissingEmployees();
  }, [fetchMissingEmployees]);

  // Common button class for consistent styling
  const buttonClass =
    "rounded text-white px-4 py-2 cursor-pointer transition-all duration-200 shadow-sm font-medium";
  const primaryButtonClass = `bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 ${buttonClass}`;
  const successButtonClass = `bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 ${buttonClass}`;
  const actionButtonClass = `bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 ${buttonClass}`;

  return (
    <div
      className={`flex flex-col ${
        isDark ? "bg-gray-700" : "bg-white"
      } p-4 rounded rounded-t-none w-full space-y-4 text-md shadow-lg`}
    >
      {/* Year and Month Selection */}
      <div className="flex space-x-4">
        <div className="relative">
          <select
            className={`${
              isDark
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } border p-2 rounded w-28 lg:w-34 appearance-none overflow-y-auto focus:outline-none focus:ring-1 focus:ring-blue-500`}
            onChange={(e) => setSelectedYear(e.target.value)}
            value={selectedYear}
          >
            <option value="">Select Year</option>
            {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => (
              <option key={2023 + i} value={2023 + i}>
                {2023 + i}
              </option>
            ))}
          </select>
          <div
            className={`flex ${
              isDark ? "text-gray-300" : "text-black"
            } absolute inset-y-0 items-center pointer-events-none px-2 right-0`}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="relative">
          <select
            className={`${
              isDark
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } border p-2 rounded w-32 lg:w-34 appearance-none overflow-y-auto focus:outline-none focus:ring-1 focus:ring-blue-500`}
            onChange={(e) => setSelectedMonth(e.target.value)}
            value={selectedMonth}
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, "0");
              const monthName = new Date(0, i).toLocaleString("default", {
                month: "long",
              });
              return (
                <option key={month} value={month}>
                  {monthName}
                </option>
              );
            })}
          </select>
          <div
            className={`flex ${
              isDark ? "text-gray-300" : "text-black"
            } absolute inset-y-0 items-center pointer-events-none px-2 right-0`}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Missing Employees Section */}
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-gray-50"
        } p-4 rounded shadow`}
      >
        <h2
          className={`text-lg font-semibold mb-4 pb-2 border-b ${
            isDark
              ? "text-teal-400 border-gray-700"
              : "text-teal-600 border-gray-200"
          }`}
        >
          Missing Employees
        </h2>
        {missingEmployees.length > 0 ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-md">
            {missingEmployees.map((employee, index) => (
              <li
                key={index}
                className={`p-2 rounded ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {employee.name} {employee.surname}
              </li>
            ))}
          </ul>
        ) : (
          <p
            className={`text-md ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            No missing employees.
          </p>
        )}
      </div>

      {/* Employee List */}
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-gray-50"
        } p-4 rounded shadow`}
      >
        <h2
          className={`text-lg font-semibold mb-4 pb-2 border-b ${
            isDark
              ? "text-teal-400 border-gray-700"
              : "text-teal-600 border-gray-200"
          }`}
        >
          Employees
        </h2>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-md">
          {employees.map((employee) => (
            <li
              key={employee.id}
              className={`p-2 rounded cursor-pointer ${
                employeeDetails?.id === employee.id
                  ? isDark
                    ? "bg-gray-700"
                    : "bg-gray-100"
                  : ""
              } hover:bg-${
                isDark ? "gray-700" : "gray-100"
              } transition-colors duration-200 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
              onClick={() => handleEmployeeSelect(employee)}
            >
              {employee.name} {employee.surname}
            </li>
          ))}
        </ul>
      </div>

      {/* Employee Details and Employee presence section */}
      <EmployeePresenceSection
        employeeDetails={employeeDetails}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        fetchMissingEmployees={fetchMissingEmployees}
      />

      {/* Email and Export Section */}
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-gray-50"
        } p-4 rounded shadow`}
      >
        <h2
          className={`text-lg font-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          Send Email to Employees
        </h2>
        <textarea
          className={`border h-29 p-2 rounded w-full mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
            isDark
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }`}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          rows={4}
        />
        <div className="flex flex-wrap gap-3">
          {employeeDetails && (
            <button
              className={primaryButtonClass}
              onClick={() => handleSendEmail(employeeDetails.id)}
            >
              Send Email to {employeeDetails?.name}
            </button>
          )}
          <button
            className={primaryButtonClass}
            onClick={() => handleSendEmail()}
          >
            Send Email to Missing Employees
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="w-full flex gap-2 lg:gap-10 flex-col lg:flex-row">
        <button
          className={successButtonClass}
          onClick={handleEmployeeExportExcel}
        >
          Export Employee Data to Excel
        </button>

        <button className={actionButtonClass} onClick={handleAdminExportExcel}>
          Export Admin Data to Excel
        </button>
      </div>
    </div>
  );
};

export default PresenzaTab;
