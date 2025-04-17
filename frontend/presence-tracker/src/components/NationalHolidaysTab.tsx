import type React from "react";
import { useCallback, useEffect, useState, useContext } from "react";
import type { Holiday } from "../types";
import {
  AddNationalHoliday,
  DeleteNationalHoliday,
  GetNationalHolidays,
} from "../api/adminApi";
import { toast } from "react-toastify";
import ConfirmationModal from "./ConfirmationModal";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import ThemeContext from "../context/ThemeContext";

const NationalHolidaysTab = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const fetchHolidays = useCallback(async () => {
    const response = await GetNationalHolidays(new Date().getFullYear());
    const sortedData = [...response].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    setHolidays(
      sortedData.map((holiday) => {
        return {
          ...holiday,
          formattedDate: new Date(holiday.date).toLocaleDateString("it-IT"),
        };
      })
    );
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.date /* || !newHoliday.name */) return;

    const res = await AddNationalHoliday(newHoliday.date);
    if (res?.detail) {
      toast.info(res.detail);
    } else {
      toast.success("Holiday added successfully!");
    }
    await fetchHolidays();
    setNewHoliday({ date: "", name: "" });
  };

  const handleShowModal = (date: string) => {
    setShowModal(true);
    setSelectedDate(date);
  };

  const handleDeleteHoliday = async () => {
    setShowModal(false);
    await DeleteNationalHoliday(selectedDate);
    await fetchHolidays();
    toast.success("Holiday deleted successfully!");
  };

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const columns: GridColDef[] = [
    { field: "formattedDate", headerName: "Date", flex: 1 },
    // { field: "name", headerName: "Name", flex: 1 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      cellClassName: "actions",
      flex: 1,
      getActions: ({ row }) => {
        return [
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleShowModal(row.date)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <div
      className={`flex flex-col ${
        isDark ? "bg-gray-700" : "bg-white"
      } p-4 rounded rounded-t-none w-full gap-4 shadow-lg`}
    >
      <div className="flex-1">
        <h2
          className={`text-lg font-semibold mb-4 pb-2 border-b ${
            isDark
              ? "text-teal-400 border-gray-800"
              : "text-teal-600 border-gray-200"
          }`}
        >
          Add New Holiday
        </h2>
        <div
          className={`p-4 border rounded shadow-md ${
            isDark
              ? "bg-gray-800 border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <form className="flex flex-col sm:flex-row gap-4">
            <div className={`flex-1 ${isDark && "dark-input"}`}>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Date
              </label>
              <input
                type="date"
                name="date"
                value={newHoliday.date}
                onChange={(e) =>
                  setNewHoliday({ ...newHoliday, date: e.target.value })
                }
                className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                required
              />
            </div>
            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Name
              </label>
              <input
                type="text"
                name="name"
                value={newHoliday.name}
                onChange={(e) =>
                  setNewHoliday({ ...newHoliday, name: e.target.value })
                }
                autoComplete="off"
                className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                required
              />
            </div>
            <button
              onClick={handleAddHoliday}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer self-end mb-0.5 transition-all duration-200 shadow-sm"
            >
              Add Holiday
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-y-auto rounded">
        <h2
          className={`text-lg font-semibold mb-4 pb-2 border-b ${
            isDark
              ? "text-teal-400 border-gray-800"
              : "text-teal-600 border-gray-200"
          }`}
        >
          Holidays List
        </h2>
        {holidays.length === 0 ? (
          <div className={`p-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            <p>No holidays found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded">
            <Box
              sx={{
                height: 370,
                width: "100%",
                "& .actions": {
                  color: isDark ? "#D1D5DB" : "text.secondary",
                },
                "& .textPrimary": {
                  color: isDark ? "#F3F4F6" : "text.primary",
                },
                "& .MuiDataGrid-root": {
                  backgroundColor: isDark ? "#1F2937" : "#ffffff",
                  borderColor: isDark ? "#4B5563" : "#e5e7eb",
                  color: isDark ? "#F3F4F6" : "inherit",
                },
                "& .MuiDataGrid-container--top [role=row]": {
                  backgroundColor: isDark
                    ? "#374151 !important"
                    : "#f9fafb !important",
                  borderBottom: isDark
                    ? "1px solid #4B5563 !important"
                    : "1px solid #e5e7eb !important",
                  color: isDark ? "#F3F4F6 !important" : "inherit",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: isDark
                    ? "1px solid #4B5563"
                    : "1px solid #e5e7eb",
                  color: isDark ? "#F3F4F6" : "inherit",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: isDark ? "#374151" : "#f9fafb",
                  borderTop: isDark ? "1px solid #4B5563" : "1px solid #e5e7eb",
                },
                "& .MuiTablePagination-root": {
                  color: isDark ? "#F3F4F6" : "inherit",
                },
                "& .MuiSvgIcon-root": {
                  color: isDark ? "#F3F4F6 !important" : "inherit",
                },
              }}
            >
              <DataGrid
                rows={holidays}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                }}
                pageSizeOptions={[5]}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </Box>
          </div>
        )}
      </div>

      {showModal && (
        <ConfirmationModal
          message="Do you want to delete this holiday?"
          onConfirm={handleDeleteHoliday}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default NationalHolidaysTab;
