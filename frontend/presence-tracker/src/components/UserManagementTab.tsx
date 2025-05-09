import React, { useCallback, useEffect, useContext, useState } from "react";
import Box from "@mui/material/Box";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  type GridRowsProp,
  type GridRowModesModel,
  GridRowModes,
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
  type GridEventListener,
  type GridRowId,
  type GridRowModel,
  GridRowEditStopReasons,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import type { Employee } from "../types";
import { DeleteUser, GetAllEmployees, UpdateUser } from "../api/adminApi";
import ThemeContext from "../context/ThemeContext";
import { toast } from "react-toastify";
import { TextField } from "@mui/material";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
    searchText: string;
    setSearchText: (searchText: string) => void;
  }
}

const formatRowData = (rowData: Employee[]) => {
  return rowData.map((employee) => ({
    ...employee,
    job_start_date: new Date(employee.job_start_date),
  }));
};

const CustomToolbar = ({
  setSearchText,
  searchText,
}: {
  setSearchText: (searchText: string) => void;
  searchText: string;
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <GridToolbarContainer>
      <TextField
        variant="standard"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search..."
        sx={{
          width: "100%",
          margin: "10px",
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
    </GridToolbarContainer>
  );
};

const UserManagementTab: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [originalRows, setOriginalRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [searchText, setSearchText] = useState("");

  const fetchEmployees = useCallback(async () => {
    const employeesData: Employee[] = await GetAllEmployees();
    const formattedData = formatRowData(employeesData);
    setRows(formattedData);
    setOriginalRows(formattedData);
  }, []);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    toast.promise(DeleteUser(id as string), {
      pending: "Deleting...",
      success: "Deleted successfully!",
      error: "Deletion failed. Please try again.",
    });
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow?.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleUpdateUser = async (body: Employee) => {
    toast.promise(UpdateUser(body.id, body), {
      pending: "Updating...",
      success: "Updated successfull!",
      error: "Update failed. Please try again.",
    });
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    const body: Employee = {
      id: newRow.id,
      name: newRow.name,
      surname: newRow.surname,
      job_start_date: new Date(newRow.job_start_date).toLocaleDateString(
        "en-CA"
      ),
      full_time: newRow.full_time,
      phone_number: newRow.phone_number,
      personal_email: newRow.personal_email,
      work_email: newRow.work_email,
      is_active: newRow.is_active,
      role: newRow.role,
      iban: newRow.iban,
    };
    await handleUpdateUser(body);
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "First Name", editable: true, flex: 1 },
    { field: "surname", headerName: "Last Name", editable: true, flex: 1 },
    {
      field: "job_start_date",
      headerName: "Join date",
      type: "date",
      valueFormatter: (value) => new Date(value).toLocaleDateString("it-IT"),
      editable: true,
      flex: 1,
    },
    {
      field: "phone_number",
      headerName: "Phone Number",
      editable: true,
      flex: 1,
    },
    {
      field: "personal_email",
      headerName: "Personal Email",
      editable: true,
      flex: 1,
    },
    {
      field: "work_email",
      headerName: "Work Email",
      editable: true,
      flex: 1,
    },
    {
      field: "iban",
      headerName: "IBAN",
      editable: true,
      flex: 1,
    },
    {
      field: "role",
      headerName: "Role",
      editable: true,
      flex: 1,
    },
    {
      field: "full_time",
      headerName: "Full Time",
      type: "boolean",
      editable: true,
      flex: 1,
    },
    {
      field: "is_active",
      headerName: "Active",
      type: "boolean",
      editable: true,
      flex: 1,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      cellClassName: "actions",
      flex: 1,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: isDark ? "#3b82f6" : "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  useEffect(() => {
    fetchEmployees?.();
  }, [fetchEmployees]);

  useEffect(() => {
    if (searchText === "") {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) => {
        return Object.keys(row).some((field) => {
          if (field === "id" || typeof row[field] === "object") return false;

          return String(row[field])
            .toLowerCase()
            .includes(searchText.toLowerCase());
        });
      });
      setRows(filteredRows);
    }
  }, [searchText, originalRows]);

  return (
    <div
      className={`flex flex-col ${
        isDark ? "bg-gray-700" : "bg-white"
      } p-4 rounded rounded-t-none w-full space-y-4 shadow-lg`}
    >
      <h2
        className={`text-lg font-semibold mb-4 pb-2 border-b ${
          isDark
            ? "text-teal-400 border-gray-800"
            : "text-teal-600 border-gray-200"
        }`}
      >
        List of Employees
      </h2>
      <Box
        sx={{
          height: 450,
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
          "& .MuiDataGrid-root .MuiDataGrid-row--editing .MuiDataGrid-cell": {
            backgroundColor: isDark ? "#1F2937 !important" : "#ffffff",
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
            borderBottom: isDark ? "1px solid #4B5563" : "1px solid #e5e7eb",
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none !important",
          },
          "& .MuiDataGrid-cell:focus-within": {
            outline: "none !important",
          },
          "& .MuiDataGrid-cell--editing:focus-within": {
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
          "& .MuiCheckbox-root": {
            color: isDark ? "#D1D5DB" : undefined,
          },
          "& .MuiInputBase-input": {
            color: isDark ? "#F3F4F6" : undefined,
          },
          "& input[type='date']::-webkit-calendar-picker-indicator": {
            filter: isDark ? "invert(1)" : "invert(0)",
            cursor: "pointer",
          },
          "& input[type='date']": {
            color: isDark ? "#F3F4F6" : "inherit",
            backgroundColor: "transparent",
          },
          "& .css-ok32b7-MuiDataGrid-overlay": {
            backgroundColor: "inherit",
          },
        }}
        className="shadow-md rounded"
      >
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          slots={{
            toolbar: CustomToolbar,
          }}
          slotProps={{
            toolbar: {
              setSearchText,
              searchText,
            },
          }}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
        />
      </Box>
    </div>
  );
};

export default UserManagementTab;
