export interface LoginResponse {
  access_token: string;
  role: string;
  user_id: number;
}

export interface RegisterInputs {
  name: string;
  surname: string;
  jobStartDate: string;
  phoneNumber: string;
  personalEmail: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
  fullTime: boolean;
}

export interface RegisterApiBody {
  name: string;
  surname: string;
  job_start_date: string;
  full_time: boolean;
  phone_number: string;
  personal_email: string;
  work_email: string;
  password: string;
}

// AdminPage

export interface Employee {
  id: number;
  name: string;
  surname: string;
  job_start_date: string;
  full_time: boolean;
  phone_number: string;
  personal_email: string;
  work_email: string;
  is_active: boolean;
  role: string;
}

export interface PresenceData {
  date: string;
  employee_id?: string;
  entry_time_morning: string;
  exit_time_morning: string;
  entry_time_afternoon: string;
  exit_time_afternoon: string;
  national_holiday: boolean;
  weekend: boolean;
  day_off: boolean;
  time_off: string;
  extra_hours: string;
  notes: string;
  illness: string;
}

export interface NewPresenceData extends PresenceData {
  modified: boolean;
  has_data: boolean;
}

export interface EmployeeOverview {
  totalWorkedHoursInMonth: number;
  totalExtraHoursInMonth: number;
  totalOffHoursInMonth: number;
  totalOffDaysInMonth: number;
  totalExpectedWorkingHours: number;
  isSubmitted: boolean;
  notes: string;
}

export interface ExcelApiResponse {
  detail: string;
}

//EmployeePage

export interface DefaultHours {
  entry_time_morning: string;
  exit_time_morning: string;
  entry_time_afternoon: string;
  exit_time_afternoon: string;
}

//HolidaySection

export interface Holiday {
  id?: string;
  date: string;
  name: string;
  formattedDate?: string;
}

export interface HolidayResponse {
  detail?: string;
  message?: string;
}
