import type React from "react";
import { useCallback, useEffect, useState, useContext } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type {
  DefaultHours,
  EmployeeOverview,
  NewPresenceData,
  PresenceData,
} from "../types";
import Popup from "./Popup";
import DefaultTimesCard from "./DefaultTimesCard";
import { GetDefaultTimes } from "../api/employeeApi";
import { toast } from "react-toastify";
import {
  GetAdminPresenceData,
  GetEmployeeOverview,
  GetNationalHolidays,
  GetPresenceData,
  PostAdminMonthlyPresence,
} from "../api/adminApi";
import {
  Check,
  Edit,
  BeachAccess,
  Flag,
  Weekend,
  Clear,
} from "@mui/icons-material";
import type { SvgIconPropsColorOverrides } from "@mui/material/SvgIcon";
import type { OverridableStringUnion } from "@mui/types";
import ThemeContext from "../context/ThemeContext";

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

type View = "month" | "year" | "decade" | "century";

interface EmployeePresenceSectionProps {
  employeeId: number | null;
  selectedYear: string;
  selectedMonth: string;
  fetchMissingEmployees?: () => Promise<void>;
}

const EmployeePresenceSection: React.FC<EmployeePresenceSectionProps> = ({
  employeeId,
  selectedYear,
  selectedMonth,
  fetchMissingEmployees,
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [pageType, setPageType] = useState<"static" | "dynamic">("static");
  const [defaultTimes, setDefaultTimes] = useState<DefaultHours>({
    entry_time_morning: "",
    exit_time_morning: "",
    entry_time_afternoon: "",
    exit_time_afternoon: "",
  });
  const [presenceData, setPresenceData] = useState<NewPresenceData[]>([]);
  const [adminPresenceData, setAdminPresenceData] = useState<NewPresenceData[]>(
    []
  );
  const [employeeOverview, setEmployeeOverview] =
    useState<EmployeeOverview | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const userId = localStorage.getItem("user_id") || "";

  const getDayString = useCallback((date: Date) => {
    return date.toLocaleDateString("en-CA");
  }, []);

  const formatTime = useCallback((time: string) => {
    return time ? time.split(":").slice(0, 2).join(":") : "";
  }, []);

  const initializeMonthData = useCallback(async () => {
    try {
      if (!employeeId || !selectedMonth || !selectedYear) return;

      const [times, apiData, adminApiData, holidaysData] = await Promise.all([
        GetDefaultTimes(userId),
        GetPresenceData(employeeId, selectedMonth, selectedYear),
        GetAdminPresenceData(employeeId, selectedMonth, selectedYear),
        GetNationalHolidays(Number(selectedYear)),
      ]);

      if (times?.entry_time_morning) setDefaultTimes(times);

      const year = Number(selectedYear);
      const month = Number(selectedMonth) - 1; // Convert to 0-indexed month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const newPresenceData: NewPresenceData[] = [];
      const newAdminPresenceData: NewPresenceData[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dateString = getDayString(dayDate);
        const isWeekend = [0, 6].includes(dayDate.getDay());

        const isNationalHoliday = holidaysData.some(
          (item) => item.date === dateString
        );

        const employeeRecord = apiData.find((item) => item.date === dateString);
        const adminRecord = adminApiData.find(
          (item) => item.date === dateString
        );

        newPresenceData.push({
          date: dateString,
          employee_id: employeeId?.toString(),
          entry_time_morning: employeeRecord?.entry_time_morning || "",
          exit_time_morning: employeeRecord?.exit_time_morning || "",
          entry_time_afternoon: employeeRecord?.entry_time_afternoon || "",
          exit_time_afternoon: employeeRecord?.exit_time_afternoon || "",
          national_holiday:
            employeeRecord?.national_holiday || isNationalHoliday,
          weekend: isWeekend,
          day_off: employeeRecord?.day_off || false,
          time_off: employeeRecord?.time_off || "",
          extra_hours: employeeRecord?.extra_hours || "",
          notes: employeeRecord?.notes || "",
          illness: employeeRecord?.illness || "",
          modified: false,
          has_data: !!employeeRecord,
        });

        newAdminPresenceData.push({
          date: dateString,
          employee_id: employeeId?.toString(),
          entry_time_morning: adminRecord?.entry_time_morning || "",
          exit_time_morning: adminRecord?.exit_time_morning || "",
          entry_time_afternoon: adminRecord?.entry_time_afternoon || "",
          exit_time_afternoon: adminRecord?.exit_time_afternoon || "",
          national_holiday: adminRecord?.national_holiday || isNationalHoliday,
          weekend: isWeekend,
          day_off: adminRecord?.day_off || false,
          time_off: adminRecord?.time_off || "",
          extra_hours: adminRecord?.extra_hours || "",
          notes: adminRecord?.notes || "",
          illness: adminRecord?.illness || "",
          modified: false,
          has_data: !!adminRecord,
        });
      }

      setPresenceData(newPresenceData);
      setAdminPresenceData(newAdminPresenceData);
      setCurrentMonth(month);
    } catch (error) {
      toast.error("Error loading data. Please try again.");
      console.error("Data loading error:", error);
    }
  }, [employeeId, selectedMonth, selectedYear, getDayString, userId]);

  const getDayData = useCallback(
    (dateString: string): NewPresenceData => {
      const defaultData: NewPresenceData = {
        date: dateString,
        employee_id: employeeId?.toString() || "",
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

      if (pageType === "static") {
        const found = presenceData.find((item) => item.date === dateString);
        return found
          ? { ...found, modified: false, has_data: true }
          : defaultData;
      } else {
        return (
          adminPresenceData.find((item) => item.date === dateString) ||
          defaultData
        );
      }
    },
    [presenceData, adminPresenceData, pageType, employeeId]
  );

  const handleDayClick = (date: Date, type: "static" | "dynamic") => {
    setSelectedDay(date);
    setPageType(type);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedDay(null);
  };

  const handlePresenceChange = (
    field: keyof PresenceData,
    value: string | boolean,
    isModified?: boolean
  ) => {
    if (!selectedDay) return;

    const dateString = getDayString(selectedDay);
    setAdminPresenceData((prev) =>
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

  const hasEmptyDays = useCallback(() => {
    return adminPresenceData.some(
      (dayData) =>
        !dayData.has_data && !dayData.weekend && !dayData.national_holiday
    );
  }, [adminPresenceData]);

  const applyDefaultHours = useCallback(() => {
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

    setAdminPresenceData((prev) =>
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
  }, [defaultTimes, formatTime]);

  const renderTileContent = (
    date: Date,
    view: View,
    data: NewPresenceData[]
  ) => {
    if (view !== "month") return null;

    const dateString = getDayString(date);
    const dayData = data.find((item) => item.date === dateString);
    const isWeekend = [0, 6].includes(date.getDay());

    if (date.getMonth() !== currentMonth) return null;

    let IconComponent = Clear;
    let iconColor: IconColor = "error";

    if (dayData?.national_holiday) {
      IconComponent = Flag;
      iconColor = "secondary";
    } else if (dayData?.day_off) {
      IconComponent = BeachAccess;
      iconColor = "warning";
    } else if (isWeekend) {
      IconComponent = Weekend;
      iconColor = "action";
    } else if (dayData?.modified) {
      IconComponent = Edit;
      iconColor = "primary";
    } else if (dayData?.has_data) {
      IconComponent = Check;
      iconColor = "success";
    }

    return (
      <div className="w-full h-full flex items-center justify-center cursor-pointer">
        <IconComponent
          color={iconColor}
          sx={dayData?.weekend ? { color: "#9CA3AF" } : undefined}
          fontSize="small"
        />
      </div>
    );
  };

  const handleSaveMonthlyPresence = async () => {
    if (hasEmptyDays()) {
      toast.error("Please fill all dates before submitting");
      return;
    }

    const data = adminPresenceData.map((item) => {
      return {
        ...item,
        extra_hours: item.extra_hours || "00:00",
        time_off: item.time_off || "00:00",
      };
    });

    try {
      await toast.promise(
        PostAdminMonthlyPresence(employeeId?.toString() || "", data),
        {
          pending: "Saving data...",
          success: "Data saved successfully!",
          error: "Failed to save data. Please try again.",
        }
      );

      if (fetchMissingEmployees) {
        await fetchMissingEmployees();
      }
      initializeMonthData();
      fetchOverviewData();
    } catch (error) {
      console.error("Error saving presence data:", error);
    }
  };

  const fetchOverviewData = useCallback(async () => {
    if (!employeeId || !selectedMonth || !selectedYear) return;
    try {
      const overviewData = await GetEmployeeOverview(
        employeeId,
        selectedMonth,
        selectedYear
      );
      setEmployeeOverview(overviewData);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    }
  }, [employeeId, selectedMonth, selectedYear]);

  useEffect(() => {
    initializeMonthData();
    fetchOverviewData();
  }, [initializeMonthData, fetchOverviewData]);

  const selectedDayData = selectedDay
    ? getDayData(getDayString(selectedDay))
    : null;

  return (
    <div className="flex flex-col gap-6">
      {employeeOverview && (
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } px-6 py-5 rounded-lg shadow-md border ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDark
                ? "text-teal-400 border-gray-700"
                : "text-teal-600 border-gray-200"
            }`}
          >
            Presence Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2">
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Total Worked Hours:</span>{" "}
              {employeeOverview.totalWorkedHoursInMonth || "N/A"}
            </p>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Expected Working Hours:</span>{" "}
              {employeeOverview.totalExpectedWorkingHours || "N/A"}
            </p>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Total Extra Hours:</span>{" "}
              {employeeOverview.totalExtraHoursInMonth || "N/A"}
            </p>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Total Off Hours:</span>{" "}
              {employeeOverview.totalOffHoursInMonth || "N/A"}
            </p>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Total Off Days:</span>{" "}
              {employeeOverview.totalOffDaysInMonth || "N/A"}
            </p>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}>
              <span className="font-medium">Notes:</span>{" "}
              {employeeOverview.notes || "N/A"}
            </p>
          </div>
        </div>
      )}

      {employeeOverview && (
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } p-6 rounded-lg shadow-md border ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="grid col-span-2 grid-cols-1 lg:grid-cols-2 gap-8">
              <style>{`
                .calendar-container .react-calendar__tile {
                  aspect-ratio: 1 / 1
                }
              `}</style>

              <div className="flex flex-col">
                <h2
                  className={`text-lg font-semibold mb-4 pb-2 border-b w-full text-center ${
                    isDark
                      ? "text-teal-400 border-gray-700"
                      : "text-teal-600 border-gray-200"
                  }`}
                >
                  Employee Presence
                </h2>
                <div
                  className={`calendar-container ${
                    isDark ? "dark-calendar" : ""
                  } ${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } p-4 rounded-lg shadow-sm w-full`}
                >
                  <Calendar
                    activeStartDate={
                      new Date(
                        Number.parseInt(selectedYear),
                        Number.parseInt(selectedMonth) - 1
                      )
                    }
                    onClickDay={(date) => handleDayClick(date, "static")}
                    tileContent={({ date, view }) =>
                      renderTileContent(date, view as View, presenceData)
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <h2
                  className={`text-lg font-semibold mb-4 pb-2 border-b w-full text-center ${
                    isDark
                      ? "text-teal-400 border-gray-700"
                      : "text-teal-600 border-gray-200"
                  }`}
                >
                  Admin Modify
                </h2>
                <div
                  className={`calendar-container ${
                    isDark ? "dark-calendar" : ""
                  } ${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } p-4 rounded-lg shadow-sm w-full`}
                >
                  <Calendar
                    activeStartDate={
                      new Date(
                        Number.parseInt(selectedYear),
                        Number.parseInt(selectedMonth) - 1
                      )
                    }
                    onClickDay={(date) => handleDayClick(date, "dynamic")}
                    tileContent={({ date, view }) =>
                      renderTileContent(date, view as View, adminPresenceData)
                    }
                    view="month"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
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

            {/* Right side with DefaultTimesCard */}
            <div className="flex flex-col">
              <h2
                className={`text-lg font-semibold mb-4 pb-2 border-b w-full text-center ${
                  isDark
                    ? "text-teal-400 border-gray-700"
                    : "text-teal-600 border-gray-200"
                }`}
              >
                Default Hours
              </h2>
              <DefaultTimesCard
                pageName="admin"
                defaultTimes={defaultTimes}
                setDefaultTimes={setDefaultTimes}
                handleSaveMonthlyPresence={handleSaveMonthlyPresence}
                onApplyDefaultHours={applyDefaultHours}
              />
            </div>
          </div>
        </div>
      )}

      {isPopupOpen && selectedDay && selectedDayData && (
        <Popup
          isOpen={isPopupOpen}
          onClose={closePopup}
          pageType={pageType}
          selectedDay={selectedDay}
          selectedDayData={selectedDayData}
          handlePresenceChange={
            pageType === "dynamic" ? handlePresenceChange : undefined
          }
        />
      )}
    </div>
  );
};

export default EmployeePresenceSection;
