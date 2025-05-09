"use client";

import type React from "react";
import { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  ExportAdminPresenceData,
  ExportAllEmployeesPresenceData,
  ExportEmployeePresenceData,
  GetMissingEmployees,
  GetSubmittedEmployees,
  SendEmailToAll,
  SendEmailToMissing,
  SendEmailToOneEmployee,
} from "../api/adminApi";
import type { EmailInputs, Employee } from "../types";
import { toast } from "react-toastify";
import EmployeePresenceSection from "./EmployeePresenceSection";
import ThemeContext from "../context/ThemeContext";
import axios from "axios";
import { TextField, IconButton, Menu, MenuItem } from "@mui/material";
import { useForm } from "react-hook-form";
import { Clear } from "@mui/icons-material";

type DownloadableFileType = "excel" | "pdf" | "zip";

const months = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const PresenzaTab: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailInputs>({
    defaultValues: {
      emailSubject: "Please submit your presence",
      emailBody:
        "Hello,\nPlease ensure that you have submitted your attendance presence.\nKind Regards,\nAdminstration",
    },
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [missingEmployees, setMissingEmployees] = useState<Employee[]>([]);
  const [searchText, setSearchText] = useState("");

  // Refs and state for export dropdown menus
  const adminExportRef = useRef<HTMLButtonElement>(null);
  const allEmployeesExportRef = useRef<HTMLButtonElement>(null);

  const [adminExportMenu, setAdminExportMenu] = useState<null | HTMLElement>(
    null
  );
  const [allEmployeesExportMenu, setAllEmployeesExportMenu] =
    useState<null | HTMLElement>(null);

  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeeDetails(employee);
  };

  const fetchSubmittedEmployees = useCallback(async () => {
    const employeesData: Employee[] = await GetSubmittedEmployees(
      selectedYear,
      selectedMonth
    );
    setEmployees(employeesData);
  }, [selectedYear, selectedMonth]);

  const fetchMissingEmployees = useCallback(async () => {
    if (!selectedYear || !selectedMonth) return;
    const missing = await GetMissingEmployees(selectedYear, selectedMonth);
    setMissingEmployees(missing);
  }, [selectedYear, selectedMonth]);

  const handleSeachEmployees = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  const downloadFile = (
    data: ArrayBuffer | BlobPart,
    filename: string,
    fileType?: DownloadableFileType
  ): void => {
    const typeMap: Record<DownloadableFileType, { mime: string; ext: string }> =
      {
        excel: {
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ext: ".xlsx",
        },
        pdf: {
          mime: "application/pdf",
          ext: ".pdf",
        },
        zip: {
          mime: "application/zip",
          ext: ".zip",
        },
      };

    const config = fileType ? typeMap[fileType] : typeMap["excel"];

    if (fileType && !filename.endsWith(config.ext)) {
      filename = `${filename}${config.ext}`;
    }

    const blob = new Blob([data], { type: config.mime });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleEmployeeExport = async () => {
    if (!employeeDetails || !selectedYear || !selectedMonth) {
      toast.info(
        "Please select an employee, year, and month before exporting."
      );
      return;
    }

    try {
      const response = await ExportEmployeePresenceData(
        employeeDetails.id,
        selectedYear,
        selectedMonth
      );

      downloadFile(
        response,
        `employee_presence_report_${selectedYear}_${selectedMonth}_${employeeDetails.name}_${employeeDetails.surname}`
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        toast.info(error.response.data.detail);
      } else {
        console.error("Employee export failed:", error);
        toast.error("Employee export failed");
      }
    }
  };

  const handleAdminExport = async (fileType: "excel" | "pdf") => {
    if (!employeeDetails || !selectedYear || !selectedMonth) {
      toast.info(
        "Please select an employee, year, and month before exporting."
      );
      return;
    }

    toast.loading("Exporting...");

    try {
      const response = await ExportAdminPresenceData(
        employeeDetails.id,
        selectedYear,
        selectedMonth,
        fileType === "pdf"
      );

      downloadFile(
        response,
        `${selectedMonth}_${months[Number(selectedMonth) - 1]}_Presenze_${
          employeeDetails.name
        }_${employeeDetails.surname}`,
        fileType
      );

      toast.dismiss();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        toast.info(error.response.data.detail);
      } else {
        console.error("Admin export failed:", error);
        toast.error("Admin export failed");
      }
    }
  };

  const handleAllEmployeesExport = async (fileType: "excel" | "pdf") => {
    toast.loading("Exporting...");

    try {
      const response = await ExportAllEmployeesPresenceData(
        selectedYear,
        selectedMonth,
        fileType === "pdf"
      );

      downloadFile(
        response,
        `${selectedMonth}_${months[Number(selectedMonth) - 1]}_Presenze_All`,
        "zip"
      );

      toast.dismiss();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        toast.info(error.response.data.detail);
      } else {
        console.error("Employee export failed:", error);
        toast.error("Employee export failed");
      }
    }
  };

  const handleSendEmail = async (id: number, data: EmailInputs) => {
    const apiCall = async () => {
      if (id === 1 && employeeDetails) {
        await SendEmailToOneEmployee(
          employeeDetails.id,
          data.emailBody,
          data.emailSubject
        );
      } else if (id === 2) {
        await SendEmailToMissing(
          `${selectedYear}-${selectedMonth}`,
          data.emailBody,
          data.emailSubject
        );
      } else if (id === 3) {
        await SendEmailToAll(data.emailBody, data.emailSubject);
      }
    };
    toast.promise(apiCall(), {
      pending: "Sending...",
      success: `${id === 1 ? "Email" : "Emails"} sent successfully!`,
      error: `Failed to send ${
        id === 1 ? "email" : "emails"
      }. Please try again.`,
    });
  };

  useEffect(() => {
    fetchSubmittedEmployees();
  }, [fetchSubmittedEmployees]);

  useEffect(() => {
    fetchMissingEmployees();
  }, [fetchMissingEmployees]);

  const filteredEmployees = searchText.trim()
    ? employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
          employee.surname.toLowerCase().includes(searchText.toLowerCase())
      )
    : employees;

  // Input styling
  const inputClasses = `w-full border ${
    isDark ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
  } rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500`;
  const labelClasses = `block text-left text-sm font-medium mb-1.5 ${
    isDark ? "text-gray-300" : "text-gray-700"
  }`;

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

      {/* Missing Presence Section */}
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
          Missing Presence
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
            No missing employees
          </p>
        )}
      </div>

      {/* Submitted Presence Section */}
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-gray-50"
        } p-4 rounded shadow`}
      >
        <div
          className={`mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}
        >
          <h2
            className={`text-lg font-semibold flex-1 pb-2 border-b ${
              isDark
                ? "text-teal-400 border-gray-700"
                : "text-teal-600 border-gray-200"
            }`}
          >
            Submitted Presence
          </h2>
          <div className="flex items-center flex-0.25 relative">
            <TextField
              id="standard-basic"
              label="Search"
              variant="standard"
              size="small"
              value={searchText}
              onChange={handleSeachEmployees}
              disabled={employees.length <= 0}
              sx={{
                marginBottom: 1,
                width: "100%",
                "& .css-1wd3yy0-MuiInputBase-input-MuiInput-input": {
                  color: isDark ? "#F3F4F6" : "inherit",
                },
                "& .MuiInputLabel-root": {
                  color: isDark ? "#4fd1c5 !important" : "#319795 !important",
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: isDark ? "#374151" : "#E5E7EB",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: isDark ? "#4fd1c5" : "#319795",
                },
                "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                  borderBottomColor: isDark ? "#4fd1c5" : "#319795",
                },
              }}
            />
            {searchText && (
              <IconButton
                size="small"
                onClick={clearSearch}
                sx={{
                  position: "absolute",
                  right: 0,
                  bottom: "8px",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  "&:hover": {
                    backgroundColor: isDark
                      ? "rgba(79, 209, 197, 0.08)"
                      : "rgba(49, 151, 149, 0.08)",
                  },
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
        {filteredEmployees.length > 0 ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-md">
            {filteredEmployees.map((employee) => (
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
        ) : (
          <p
            className={`text-md ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            {employees.length > 0 && filteredEmployees.length <= 0
              ? "No employee found"
              : "No submitted employees"}
          </p>
        )}
      </div>

      {/* Employee Details and Employee presence section */}
      {employeeDetails && employees.length > 0 && (
        <EmployeePresenceSection
          employeeId={employeeDetails.id}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          fetchMissingEmployees={fetchMissingEmployees}
        />
      )}

      {/* Email and Export Section */}
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
          Send Email to Employees
        </h2>
        <div className="mb-2">
          <label className={labelClasses}>Subject</label>
          <input
            type="text"
            autoComplete="off"
            {...register("emailSubject", { required: true })}
            className={`${inputClasses} ${
              errors.emailSubject ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
        </div>
        <div className="mb-2">
          <label className={labelClasses}>Body</label>
          <textarea
            autoComplete="off"
            {...register("emailBody", { required: true })}
            className={`${inputClasses} h-40 ${
              errors.emailBody ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {employeeDetails && (
            <button
              className={primaryButtonClass}
              onClick={handleSubmit((data) => handleSendEmail(1, data))}
            >
              Send Email to {employeeDetails?.name}
            </button>
          )}
          <button
            className={primaryButtonClass}
            onClick={handleSubmit((data) => handleSendEmail(2, data))}
          >
            Send Email to Missing Employees
          </button>
          <button
            className={primaryButtonClass}
            onClick={handleSubmit((data) => handleSendEmail(3, data))}
          >
            Send Email to All Employees
          </button>
        </div>
      </div>

      {/* Export Buttons with Dropdowns */}
      <div className="w-full flex gap-3 flex-col lg:flex-row">
        {/* Employee Export Button */}
        <div>
          <button className={successButtonClass} onClick={handleEmployeeExport}>
            Export Employee Data
          </button>
        </div>

        {/* Admin Export Button */}
        <div>
          <button
            ref={adminExportRef}
            className={actionButtonClass}
            onClick={(e) => setAdminExportMenu(e.currentTarget)}
          >
            Export Admin Data
          </button>
          <Menu
            anchorEl={adminExportMenu}
            open={Boolean(adminExportMenu)}
            onClose={() => setAdminExportMenu(null)}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: isDark ? "#1F2937" : "white",
                  color: isDark ? "white" : "inherit",
                },
              },
            }}
            aria-labelledby="admin-export-button"
          >
            <MenuItem
              onClick={() => {
                handleAdminExport("excel");
                setAdminExportMenu(null);
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                },
              }}
            >
              Excel Format
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAdminExport("pdf");
                setAdminExportMenu(null);
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                },
              }}
            >
              PDF Format
            </MenuItem>
          </Menu>
        </div>

        {/* All Employees Export Button */}
        <div>
          <button
            ref={allEmployeesExportRef}
            className={primaryButtonClass}
            onClick={(e) => setAllEmployeesExportMenu(e.currentTarget)}
          >
            Export All Employees Data
          </button>
          <Menu
            anchorEl={allEmployeesExportMenu}
            open={Boolean(allEmployeesExportMenu)}
            onClose={() => setAllEmployeesExportMenu(null)}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: isDark ? "#1F2937" : "white",
                  color: isDark ? "white" : "inherit",
                },
              },
            }}
            aria-labelledby="all-employees-export-button"
          >
            <MenuItem
              onClick={() => {
                handleAllEmployeesExport("excel");
                setAllEmployeesExportMenu(null);
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                },
              }}
            >
              Excel Format
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAllEmployeesExport("pdf");
                setAllEmployeesExportMenu(null);
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                },
              }}
            >
              Both (Excel & PDF)
            </MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default PresenzaTab;
