import { useContext } from "react";
import type React from "react";
import type { DefaultHours } from "../types";
import { toast } from "react-toastify";
import {
  GetDefaultTimes,
  SaveDefaultTimes,
  UpdataDefaultTimes,
} from "../api/employeeApi";
import { isAxiosError } from "axios";
import ThemeContext from "../context/ThemeContext";

interface DefaultTimeProps {
  pageName: "admin" | "employee";
  defaultTimes: DefaultHours;
  calendarMonth?: number;
  setDefaultTimes: (times: DefaultHours) => void;
  handleSaveMonthlyPresence: () => void;
  onApplyDefaultHours?: () => void;
}

const DefaultTimesCard: React.FC<DefaultTimeProps> = ({
  pageName,
  defaultTimes,
  calendarMonth,
  setDefaultTimes,
  handleSaveMonthlyPresence,
  onApplyDefaultHours,
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const userId = localStorage.getItem("user_id") || "";
  const currentDate = new Date().getDate();
  const isEditableMonth =
    calendarMonth === new Date().getMonth() ||
    (calendarMonth === new Date().getMonth() - 1 && currentDate <= 5);

  const handleDefaultHoursSave = async () => {
    const {
      entry_time_morning,
      exit_time_morning,
      entry_time_afternoon,
      exit_time_afternoon,
    } = defaultTimes;
    const missingFields = [];
    if (!entry_time_morning) missingFields.push("Morning Entry");
    if (!exit_time_morning) missingFields.push("Morning Exit");
    if (!entry_time_afternoon) missingFields.push("Afternoon Entry");
    if (!exit_time_afternoon) missingFields.push("Afternoon Exit");

    if (missingFields.length > 0) {
      toast.info(`Missing: ${missingFields.join(", ")}`);
      return;
    }

    const defaultHoursData = {
      user_id: userId,
      submitted_by_id: userId,
      ...defaultTimes,
    };

    try {
      toast.loading("Updating...", { autoClose: false });

      const response = await GetDefaultTimes(userId);
      const saveOrUpdate = response ? UpdataDefaultTimes : SaveDefaultTimes;
      await saveOrUpdate(defaultHoursData);
      toast.dismiss();
      toast.success(
        `Default hours ${response ? "updated" : "saved"} successfully!`
      );
    } catch (error) {
      toast.dismiss();
      if (isAxiosError(error) && error.response?.status === 404) {
        await SaveDefaultTimes(defaultHoursData);
        toast.success("Default hours saved successfully!");
      } else {
        console.error("Error saving default hours:", error);
        toast.error("Error occurred while saving default hours.");
      }
    }
  };

  const handleApplyDefaultHours = () => {
    if (onApplyDefaultHours) {
      if (pageName === "employee" && !isEditableMonth) {
        toast.info("You can only edit the current Month", {
          pauseOnFocusLoss: false,
          pauseOnHover: false,
          hideProgressBar: true,
          autoClose: 3000,
        });
        return;
      }

      onApplyDefaultHours();
    }
  };

  const handleSubmitPresence = () => {
    if (handleSaveMonthlyPresence) {
      if (pageName === "employee" && !isEditableMonth) {
        toast.info("You can only submit presence for current Month", {
          pauseOnFocusLoss: false,
          pauseOnHover: false,
          hideProgressBar: true,
          autoClose: 3000,
        });
        return;
      }

      handleSaveMonthlyPresence();
    }
  };

  const timeFields = [
    { label: "Morning Entry", key: "entry_time_morning" },
    { label: "Morning Exit", key: "exit_time_morning" },
    { label: "Afternoon Entry", key: "entry_time_afternoon" },
    { label: "Afternoon Exit", key: "exit_time_afternoon" },
  ];

  return (
    <div
      className={`${
        isDark
          ? "bg-gray-800 border-gray-700 dark-input"
          : "bg-white border-gray-200"
      } p-6 rounded-lg shadow-lg border flex flex-col justify-around items-center flex-1 transition-all duration-300 hover:shadow-xl`}
    >
      <div
        className={`w-full border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        } pb-4 mb-6`}
      >
        <h2
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-800"
          } text-center`}
        >
          Default Working Hours
        </h2>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {timeFields.map(({ label, key }) => (
          <div key={key} className="flex flex-col space-y-2">
            <label
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {label}:
            </label>
            <input
              type="time"
              value={defaultTimes[key as keyof typeof defaultTimes] || ""}
              onChange={(e) =>
                setDefaultTimes({
                  ...defaultTimes,
                  [key]: e.target.value,
                })
              }
              className={`${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-teal-400 focus:border-teal-400"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-teal-500 focus:border-teal-500"
              } border p-3 rounded-md focus:outline-none focus:ring-1 transition-all duration-200 w-full`}
            />
          </div>
        ))}
      </div>

      <div
        className={`w-full border-t ${
          isDark ? "border-gray-700" : "border-gray-200"
        } pt-6 mt-auto`}
      >
        <div
          className={`flex ${
            pageName === "admin" ? "flex-col" : "flex-col sm:flex-row"
          } gap-3 w-full ${pageName === "admin" ? "text-sm" : ""}`}
        >
          <button
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-3 rounded-md flex-1 cursor-pointer transition-all duration-200 font-medium shadow-sm"
            onClick={handleApplyDefaultHours}
          >
            Apply Default Hours
          </button>
          <button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3 rounded-md flex-1 cursor-pointer transition-all duration-200 font-medium shadow-sm"
            onClick={handleDefaultHoursSave}
          >
            Update Default Hours
          </button>
          <button
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-3 rounded-md flex-1 cursor-pointer transition-all duration-200 font-medium shadow-sm"
            onClick={handleSubmitPresence}
          >
            Submit Monthly Presence
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaultTimesCard;
