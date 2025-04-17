import type React from "react";
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast } from "react-toastify";
import type { DefaultHours, NewPresenceData, PresenceData } from "../types";
import { GetNationalHolidays, GetPresenceData } from "../api/adminApi";
import { GetDefaultTimes, PostMonthlyPresence } from "../api/employeeApi";
import Popup from "../components/Popup";
import DefaultTimesCard from "../components/DefaultTimesCard";
import {
  BeachAccess,
  Check,
  Clear,
  Edit,
  Flag,
  Weekend,
} from "@mui/icons-material";
import type { View } from "react-calendar/dist/esm/shared/types.js";
import type { SvgIconPropsColorOverrides } from "@mui/material";
import type { OverridableStringUnion } from "@mui/types";
import ThemeContext from "../context/ThemeContext";

type Value = Date | null | [Date | null, Date | null];

type IconColor = OverridableStringUnion<
  | "error"
  | "warning"
  | "action"
  | "primary"
  | "success"
  | "inherit"
  | "disabled"
  | "secondary"
  | "info",
  SvgIconPropsColorOverrides
>;

const EmployeePage: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [date, setDate] = useState<Date>(new Date());
  const [defaultTimes, setDefaultTimes] = useState<DefaultHours>({
    entry_time_morning: "",
    exit_time_morning: "",
    entry_time_afternoon: "",
    exit_time_afternoon: "",
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [presenceData, setPresenceData] = useState<NewPresenceData[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isMonthChanged, setIsMonthChanged] = useState(true);
  const userId = localStorage.getItem("user_id") || "";
  const toastId = useRef<string | number | null>(null);

  const getDayString = useCallback((date: Date) => {
    return date.toLocaleDateString("en-CA");
  }, []);

  const formatTime = useCallback((time: string) => {
    return time ? time.split(":").slice(0, 2).join(":") : "";
  }, []);

  const initializeMonthData = useCallback(async () => {
    try {
      const [times, apiData, holidaysData] = await Promise.all([
        GetDefaultTimes(userId),
        GetPresenceData(
          Number(userId),
          String(date.getMonth() + 1).padStart(2, "0"),
          date.getFullYear().toString()
        ),
        GetNationalHolidays(date.getFullYear()),
      ]);

      if (times?.entry_time_morning) setDefaultTimes(times);

      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const newPresenceData: NewPresenceData[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dateString = getDayString(dayDate);
        const isWeekend = [0, 6].includes(dayDate.getDay());

        const isNationalHoliday = holidaysData.some(
          (item) => item.date === dateString
        );

        const apiRecord = apiData.find((item) => item.date === dateString);

        newPresenceData.push({
          date: dateString,
          employee_id: userId,
          entry_time_morning: apiRecord?.entry_time_morning || "",
          exit_time_morning: apiRecord?.exit_time_morning || "",
          entry_time_afternoon: apiRecord?.entry_time_afternoon || "",
          exit_time_afternoon: apiRecord?.exit_time_afternoon || "",
          national_holiday: apiRecord?.national_holiday || isNationalHoliday,
          weekend: isWeekend,
          day_off: apiRecord?.day_off || false,
          time_off: apiRecord?.time_off || "",
          extra_hours: apiRecord?.extra_hours || "",
          notes: apiRecord?.notes || "",
          illness: apiRecord?.illness || "",
          modified: false,
          has_data: !!apiRecord,
        });
      }

      setPresenceData(newPresenceData);

      if (apiData.length === 0) {
        if (toastId.current === null || !toast.isActive(toastId.current)) {
          toastId.current = toast.warn(
            "No presence data found for this month.",
            {
              pauseOnFocusLoss: false,
              pauseOnHover: false,
              hideProgressBar: true,
              autoClose: 1200,
            }
          );
        }
      }
    } catch (error) {
      toast.error("Error loading data. Please try again.");
      console.error("Data loading error:", error);
    }
  }, [date, userId, getDayString]);

  const getDayData = useCallback(
    (dateString: string): NewPresenceData => {
      const defaultData: NewPresenceData = {
        date: dateString,
        employee_id: userId,
        entry_time_morning: "",
        exit_time_morning: "",
        entry_time_afternoon: "",
        exit_time_afternoon: "",
        national_holiday: false,
        weekend: false,
        day_off: false,
        time_off: "",
        extra_hours: "",
        notes: "",
        illness: "",
        modified: false,
        has_data: false,
      };

      return (
        presenceData.find((item) => item.date === dateString) || defaultData
      );
    },
    [presenceData, userId]
  );

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedDay(null);
  };

  const handlePresenceChange = (
    field: keyof PresenceData,
    value: string | boolean,
    isModified?: boolean
  ) => {
    if (!selectedDay) return;

    const dateString = getDayString(selectedDay);
    setPresenceData((prev) =>
      prev.map((item) =>
        item.date === dateString
          ? {
              ...item,
              [field]: value,
              modified: isModified ?? true,
              has_data: true,
            }
          : item
      )
    );
  };

  const hasEmptyDays = () => {
    return presenceData.some(
      (dayData) => !dayData.has_data && !dayData.weekend
    );
  };

  const applyDefaultHours = () => {
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

    setPresenceData((prev) =>
      prev.map((item) => ({
        ...item,
        entry_time_morning: formatTime(defaultTimes.entry_time_morning),
        exit_time_morning: formatTime(defaultTimes.exit_time_morning),
        entry_time_afternoon: formatTime(defaultTimes.entry_time_afternoon),
        exit_time_afternoon: formatTime(defaultTimes.exit_time_afternoon),
        modified: true,
        has_data: true,
      }))
    );
    toast.success("Default hours applied to all days");
  };

  const handleSaveMonthlyPresence = async () => {
    if (hasEmptyDays()) {
      toast.error("Please fill all dates before submitting");
      return;
    }

    await savePresenceData();
  };

  const savePresenceData = async () => {
    const data = presenceData.map((item) => {
      return {
        ...item,
        extra_hours: item.extra_hours || "00:00",
        time_off: item.time_off || "00:00",
      };
    });

    await toast.promise(PostMonthlyPresence(userId, data), {
      pending: "Saving data...",
      success: "Data saved successfully!",
      error: "Failed to save data. Please try again.",
    });

    setIsMonthChanged(true);
  };

  const renderTileContent = (date: Date, view: View) => {
    if (view !== "month") return null;

    const dateString = getDayString(date);
    const dayData = getDayData(dateString);

    if (date.getMonth() !== currentMonth) return null;

    let IconComponent = Clear;
    let iconColor: IconColor = "error";

    if (dayData.national_holiday) {
      IconComponent = Flag;
      iconColor = "secondary";
    } else if (dayData.day_off) {
      IconComponent = BeachAccess;
      iconColor = "warning";
    } else if (dayData.weekend) {
      IconComponent = Weekend;
      iconColor = "action";
    } else if (dayData.modified) {
      IconComponent = Edit;
      iconColor = "primary";
    } else if (dayData.has_data) {
      IconComponent = Check;
      iconColor = "success";
    }

    return (
      <div className="w-full h-full flex items-center justify-center cursor-pointer">
        <IconComponent
          color={iconColor}
          sx={dayData.weekend ? { color: "#9CA3AF" } : undefined}
          fontSize="small"
        />
      </div>
    );
  };

  useEffect(() => {
    if (isMonthChanged) {
      initializeMonthData();
      setIsMonthChanged(false);
    }
  }, [isMonthChanged, initializeMonthData]);

  return (
    <div className="flex flex-col flex-grow">
      <div
        className={`flex-1 p-4 md:p-8 ${
          isDark ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } rounded-xl shadow-lg overflow-hidden border transition-all duration-300 hover:shadow-xl`}
            >
              <div
                className={`p-4 ${
                  isDark
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gradient-to-r from-teal-50 to-cyan-50 border-gray-200"
                } border-b`}
              >
                <h2
                  className={`text-xl font-semibold ${
                    isDark ? "text-teal-400" : "text-teal-700"
                  } flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Monthly Calendar
                </h2>
              </div>
              <div className="p-5 flex flex-col justify-between">
                <div
                  className={`calendar-container ${
                    isDark ? "dark-calendar" : ""
                  }`}
                >
                  <style>{`
                    .calendar-container .react-calendar__tile {
                      aspect-ratio: 1.2
                    }
                  `}</style>
                  <Calendar
                    onChange={(value: Value) => {
                      if (value instanceof Date) setDate(value);
                    }}
                    value={date}
                    onActiveStartDateChange={({ activeStartDate }) => {
                      if (activeStartDate) {
                        setDate(activeStartDate);
                        setCurrentMonth(activeStartDate.getMonth());
                        setIsMonthChanged(true);
                      }
                    }}
                    onClickDay={(value) => handleDayClick(value)}
                    tileContent={({ date, view }) =>
                      renderTileContent(date, view)
                    }
                    view="month"
                  />
                </div>
                <div
                  className={`mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } p-4 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                    <span>Modified</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span>Missing</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-400 mr-2"></div>
                    <span>Weekend</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <DefaultTimesCard
                pageName="employee"
                defaultTimes={defaultTimes}
                setDefaultTimes={setDefaultTimes}
                handleSaveMonthlyPresence={handleSaveMonthlyPresence}
                onApplyDefaultHours={applyDefaultHours}
              />

              <div
                className={`${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } rounded-xl shadow-lg p-6 border transition-all duration-300 hover:shadow-xl`}
              >
                <h2
                  className={`text-xl font-semibold ${
                    isDark ? "text-teal-400" : "text-teal-700"
                  } mb-4 flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Legend
                </h2>
                <div
                  className={`grid grid-cols-2 md:grid-cols-3 gap-y-4 text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } p-4 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-center">
                    <Check color="success" fontSize="small" className="mr-2" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Edit color="primary" fontSize="small" className="mr-2" />
                    <span>Modified</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Clear color="error" fontSize="small" className="mr-2" />
                    <span>Missing</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Weekend
                      sx={{ color: "#9CA3AF" }}
                      fontSize="small"
                      className="mr-2"
                    />
                    <span>Weekend</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <BeachAccess
                      color="warning"
                      fontSize="small"
                      className="mr-2"
                    />
                    <span>Day Off</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Flag color="secondary" fontSize="small" className="mr-2" />
                    <span>Holiday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && selectedDay && (
        <Popup
          isOpen={showPopup}
          onClose={handleClosePopup}
          pageType="modify"
          selectedDay={selectedDay}
          selectedDayData={getDayData(getDayString(selectedDay))}
          handlePresenceChange={handlePresenceChange}
        />
      )}
    </div>
  );
};

export default EmployeePage;
