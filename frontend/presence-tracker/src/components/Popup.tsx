import type React from "react";
import {
  useContext,
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { NewPresenceData, PresenceData } from "../types";
import ThemeContext from "../context/ThemeContext";
import { toast } from "react-toastify";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: "static" | "dynamic";
  selectedDay: Date;
  selectedDayData: NewPresenceData;
  handlePresenceChange?: (
    field: keyof PresenceData,
    value: string | boolean,
    modified?: boolean
  ) => void;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  pageType,
  selectedDay,
  selectedDayData,
  handlePresenceChange,
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const popupRef = useRef<HTMLDivElement>(null);
  const [timeInputErrors, setTimeInputErrors] = useState<
    Record<string, string>
  >({});
  const initialTimeData = useRef<{
    time_off: string;
    extra_hours: string;
    isModified: boolean;
  }>(null);
  const toastId = useRef<string | number | null>(null);

  const getDayString = useMemo(() => {
    const day = String(selectedDay.getDate()).padStart(2, "0");
    const month = String(selectedDay.getMonth() + 1).padStart(2, "0");
    const year = selectedDay.getFullYear();
    return `${day}-${month}-${year}`;
  }, [selectedDay]);

  const validateTimeFormat = (value: string): boolean => {
    if (!value) return true;
    if (value.length < 5) return true;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  };

  const handleClose = useCallback(() => {
    if (timeInputErrors.time_off && initialTimeData.current) {
      handlePresenceChange?.(
        "time_off",
        initialTimeData.current.time_off,
        initialTimeData.current.isModified ?? false
      );
    }
    if (timeInputErrors.extra_hours && initialTimeData.current) {
      handlePresenceChange?.(
        "extra_hours",
        initialTimeData.current.extra_hours,
        initialTimeData.current.isModified ?? false
      );
    }
    onClose();
  }, [timeInputErrors, onClose, handlePresenceChange]);

  const handleTimeChange = (field: keyof PresenceData, value: string) => {
    if (value === "") {
      handlePresenceChange?.(field, "");
      setTimeInputErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const digits = value.replace(/\D/g, "");

    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = `${digits.substring(0, 2)}:${digits.substring(2, 4)}`;
    }

    formattedValue = formattedValue.substring(0, 5);

    handlePresenceChange?.(field, formattedValue);

    if (formattedValue.length === 5) {
      const isValid = validateTimeFormat(formattedValue);
      setTimeInputErrors((prev) => ({
        ...prev,
        [field]: isValid ? "" : "Use HH:MM (00:00-23:59)",
      }));
      if (!isValid) {
        if (toastId.current === null || !toast.isActive(toastId.current)) {
          toastId.current = toast.error(
            "Time should be in between 00:00-23:59"
          );
        }
      }
    } else {
      setTimeInputErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && !initialTimeData.current) {
      initialTimeData.current = {
        time_off: selectedDayData.time_off,
        extra_hours: selectedDayData.extra_hours,
        isModified: selectedDayData.modified,
      };
    }
  }, [isOpen, selectedDayData]);

  const renderElement = (
    label: string,
    field: keyof PresenceData,
    type: "time" | "checkbox" | "text" | "textArea",
    defaultValue: string | boolean
  ) => {
    if (pageType === "static") {
      const isCheckbox =
        field === "national_holiday" ||
        field === "weekend" ||
        field === "day_off";
      return (
        <div className="flex gap-5 space-y-1">
          <strong
            className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-0`}
          >
            {label}:
          </strong>
          <span className={`${isDark ? "text-gray-100" : "text-gray-900"}`}>
            {isCheckbox
              ? selectedDayData[field]
                ? "✔"
                : "X"
              : selectedDayData[field] || defaultValue}
          </span>
        </div>
      );
    } else {
      return (
        <div
          className={`flex ${
            type === "checkbox" ? "items-center gap-3" : "flex-col space-y-1.5"
          } ${isDark && "dark-input"}`}
        >
          <label
            className={`font-medium flex items-center ${
              isDark ? "text-gray-300" : "text-gray-700"
            } ${type === "checkbox" ? "flex-grow" : ""}`}
          >
            {label}
            {(field === "extra_hours" || field === "time_off") && (
              <span className="text-xs ml-1 opacity-70 flex flex-1 items-center justify-between">
                (HH:MM)
                {timeInputErrors[field] && (
                  <span className="text-red-500 text-xs mt-1">
                    {timeInputErrors[field]}
                  </span>
                )}
              </span>
            )}
          </label>
          {type === "textArea" ? (
            <textarea
              className={`${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } border h-24 w-full resize-none rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-teal-500`}
              value={(selectedDayData[field] as string) || ""}
              onChange={(e) => handlePresenceChange?.(field, e.target.value)}
              rows={3}
            />
          ) : field === "time_off" || field === "extra_hours" ? (
            <div className="flex flex-col">
              <input
                type="text"
                value={(selectedDayData[field].slice(0, 5) as string) || ""}
                onChange={(e) => handleTimeChange(field, e.target.value)}
                placeholder="HH:MM"
                onKeyDown={(e) => {
                  if (
                    [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "ArrowLeft",
                      "ArrowRight",
                    ].includes(e.key)
                  ) {
                    return;
                  }
                  // Only allow numbers
                  if (!/\d/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className={`${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } border rounded-lg p-3 focus:outline-none focus:ring-1 w-full ${
                  timeInputErrors[field]
                    ? "focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-teal-500 focus:border-teal-500"
                }`}
              />
            </div>
          ) : (
            <input
              type={type}
              value={
                type !== "checkbox"
                  ? (selectedDayData[field] as string) || ""
                  : undefined
              }
              checked={
                type === "checkbox"
                  ? (selectedDayData[field] as boolean) || false
                  : undefined
              }
              onChange={(e) =>
                handlePresenceChange?.(
                  field,
                  type === "checkbox" ? e.target.checked : e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                  ].includes(e.key)
                ) {
                  return;
                }
                if (!/\d/.test(e.key) && field === "illness") {
                  e.preventDefault();
                }
              }}
              className={`${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-teal-400"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-teal-500"
              } border rounded-lg p-3 focus:outline-none ${
                type === "checkbox"
                  ? "h-5 w-5 focus:ring-0 mt-0"
                  : "focus:ring-1 w-full"
              }`}
            />
          )}
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>
      <div
        ref={popupRef}
        className={`${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-xl w-full max-w-3xl p-6 text-center relative max-h-[90vh] overflow-y-auto`}
      >
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 p-1 rounded-full ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          } z-10`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2
          className={`text-2xl font-semibold ${
            isDark ? "text-white" : "text-gray-800"
          } mb-6 pr-8 break-words`}
        >
          {pageType === "static" ? "Details for " : "Edit Presence for "}
          <span className="inline-block">{getDayString}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-6">
          <div className="space-y-4">
            {renderElement(
              "Morning Entry",
              "entry_time_morning",
              "time",
              "N/A"
            )}
            {renderElement("Morning Exit", "exit_time_morning", "time", "N/A")}
            {renderElement(
              "Afternoon Entry",
              "entry_time_afternoon",
              "time",
              "N/A"
            )}
            {renderElement(
              "Afternoon Exit",
              "exit_time_afternoon",
              "time",
              "N/A"
            )}
          </div>

          <div className="space-y-4">
            {renderElement("Time Off", "time_off", "text", "N/A")}
            {renderElement("Extra Hours", "extra_hours", "text", "N/A")}
            {renderElement(
              "Certificate No.(illness)",
              "illness",
              "text",
              "None"
            )}
          </div>
        </div>

        <div
          className={`w-full p-4 rounded-lg ${
            isDark ? "bg-gray-700" : "bg-gray-50"
          } mb-6`}
        >
          <h3
            className={`font-medium ${
              isDark ? "text-gray-200" : "text-gray-700"
            } mb-3`}
          >
            Day Status
          </h3>
          <div className="flex flex-row flex-wrap justify-evenly gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              {renderElement(
                "National Holiday",
                "national_holiday",
                "checkbox",
                false
              )}
            </div>
            <div className="flex items-center gap-2">
              {renderElement("Weekend", "weekend", "checkbox", false)}
            </div>
            <div className="flex items-center gap-2">
              {renderElement("Day Off", "day_off", "checkbox", false)}
            </div>
          </div>
        </div>

        <div className="text-left mb-8">
          {renderElement("Notes", "notes", "textArea", "None")}
        </div>

        {pageType !== "static" && (
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm`}
              onClick={handleClose}
            >
              Save Changes
            </button>

            <button
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } shadow-sm`}
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
