import type React from "react";
import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import PresenzaTab from "../components/PresenzaTab";
import UserManagementTab from "../components/UserManagementTab";
import NationalHolidaysTab from "../components/NationalHolidaysTab";
import ThemeContext from "../context/ThemeContext";

const AdminPage: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [searchParams, setSearchParams] = useSearchParams();
  const presenzaTab = Number.parseInt(searchParams.get("tab") || "1", 10);

  const handleTabChange = (tab: number) => {
    setSearchParams({ tab: tab.toString() });
  };

  return (
    <div
      className={`flex flex-col flex-grow ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex flex-1 flex-col items-center px-4 md:px-7 py-5">
        {/* Improved tab navigation for both mobile and desktop */}
        <div className="flex flex-col sm:flex-row justify-around text-center w-full">
          <div className="flex w-full">
            <div
              className={`${
                presenzaTab === 1
                  ? isDark
                    ? "bg-gray-700 text-white border-b-2 border-teal-500"
                    : "bg-white text-gray-800 border-b-2 border-teal-500"
                  : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              } cursor-pointer py-3 px-4 text-md lg:text-lg font-semibold rounded-tl-lg transition-colors duration-200 flex-1 text-center`}
              onClick={() => handleTabChange(1)}
            >
              Presenza
            </div>
            <div
              className={`${
                presenzaTab === 2
                  ? isDark
                    ? "bg-gray-700 text-white border-b-2 border-teal-500"
                    : "bg-white text-gray-800 border-b-2 border-teal-500"
                  : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              } cursor-pointer py-3 px-4 text-md lg:text-lg font-semibold transition-colors duration-200 flex-1 text-center`}
              onClick={() => handleTabChange(2)}
            >
              User Management
            </div>
            <div
              className={`${
                presenzaTab === 3
                  ? isDark
                    ? "bg-gray-700 text-white border-b-2 border-teal-500"
                    : "bg-white text-gray-800 border-b-2 border-teal-500"
                  : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              } cursor-pointer py-3 px-4 text-md lg:text-lg font-semibold rounded-tr-lg transition-colors duration-200 flex-1 text-center`}
              onClick={() => handleTabChange(3)}
            >
              National Holidays
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="w-full">
          {presenzaTab === 1 && <PresenzaTab />}
          {presenzaTab === 2 && <UserManagementTab />}
          {presenzaTab === 3 && <NationalHolidaysTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
