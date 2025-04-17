import React, { useCallback, useEffect, useContext } from "react";
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
} from "@mui/x-data-grid";
import type { Employee } from "../types";
import { DeleteUser, GetAllEmployees, UpdateUser } from "../api/adminApi";
import ThemeContext from "../context/ThemeContext";
import { toast } from "react-toastify";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

const formatRowData = (rowData: Employee[]) => {
  return rowData.map((employee) => ({
    ...employee,
    job_start_date: new Date(employee.job_start_date),
  }));
};

const UserManagementTab: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  const fetchEmployees = useCallback(async () => {
    const employeesData: Employee[] = await GetAllEmployees();
    setRows(formatRowData(employeesData));
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
        List of Users
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
          slotProps={{
            toolbar: { setRows, setRowModesModel },
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
