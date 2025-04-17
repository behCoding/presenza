import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AdminDashboard.css';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [presenceData, setPresenceData] = useState([]);
  const [emailText, setEmailText] = useState("Hello,\nPlease ensure that you have submitted your attendance presence.\nKind Regards,\nAdminstration");
  const [selectedDayData, setSelectedDayData] = useState(null); 
  const [isPopupOpen, setIsPopupOpen] = useState(false); 
  const navigate = useNavigate(); 
  const [employeeOverview, setEmployeeOverview] = useState({
    totalWorkedHoursInMonth: 0,
    totalExtraHoursInMonth: 0,
    totalOffHoursInMonth: 0,
    totalOffDaysInMonth: 0,
    totalExpectedWorkingHours: 0,
    isSubmitted: false,
    notes: ''
  });
  const [missingEmployees, setMissingEmployees] = useState([]);


  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Redirect to login if token is missing
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        // Token is expired, redirect to login
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('token'); // Clear invalid token
      navigate('/login'); // Redirect to login on error
    }
  };

    // Sign out function
    const handleSignOut = () => {
      localStorage.removeItem('token');
      navigate('/login'); // Redirect to login page
    };
  
    // Check token expiration on component mount
    useEffect(() => {
      checkTokenExpiration();
      fetchEmployees();
    }, []);

  
  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:8000/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Fetched Employees:", response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8000/users/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployeeDetails(response.data);
    } catch (error) {
      console.error("Error fetching employee details:", error);
    }
  };

  const fetchPresenceData = async (employeeId, month, year) => {
    if (!employeeId || !month || !year) return; 
    try {
      const response = await axios.get(`http://localhost:8000/employee-presence/${employeeId}/${year}/${month}`);
      setPresenceData(response.data);
    } catch (error) {
      console.error("Error fetching presence data:", error);
    }
  };

  const fetchOverviewData = async (employeeId, month, year) => {
    if (!employeeId || !month || !year) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/employee-total_presence/${employeeId}/${year}/${month}`
      );
      console.log('Overview Data:', response.data);
      setEmployeeOverview(response.data); // Store the overview data
    } catch (error) {
      console.error("Error fetching employee overview data:", error);
    }
  };

  useEffect(() => {
    if (selectedEmployee && selectedMonth && selectedYear) {
      fetchOverviewData(selectedEmployee, selectedMonth, selectedYear);
      fetchPresenceData(selectedEmployee, selectedMonth, selectedYear);
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    fetchEmployeeDetails(employeeId);
  };

  const handleExportExcel = async (employeeId, year, month, employeeDetails) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/export_modified_presence_overview/${employeeId}/${year}/${month}`,
        {
          responseType: "blob", 
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `presence_overview_${year}_${month}_${employeeDetails.name}_${employeeDetails.surname}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data to Excel:", error);
      alert("An error occurred while exporting data. Please try again.");
    }
  };
  
  

  const handleSendEmail = async () => {
    if (!selectedYear || !selectedMonth) {
      alert("Please select a year and a month first.");
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:8000/send_email_to_missing',
        {
          yearMonth: `${selectedYear}-${selectedMonth}`, // Send the selected year and month
          text: emailText,
        }
      );
      alert("Emails sent to all missing employees!");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send emails.");
    }
  };
  
  const fetchMissingEmployees = async () => {
    if (!selectedYear || !selectedMonth) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/retrieve_not_submitted_presence/${selectedYear}/${selectedMonth}`
      );
      setMissingEmployees(response.data);
    } catch (error) {
      console.error("Error fetching missing employees:", error);
    }
  };

  const handleAddHoliday = async () => {
    console.log('Holiday', holidayDate)
    try {
      const response = await axios.post(
        'http://localhost:8000/add_national_holiday',
        {
          nationalHolidayDate: new Date(holidayDate).toISOString().split('T')[0],
        },
        { headers: { "Content-Type": "application/json" } } 
      );
      alert("Added successfully!");
    } catch (error) {
      console.error("Error in adding:", error);
      alert("Failed to add holiday.");
    }
  }

  useEffect(() => {
    fetchMissingEmployees();
  }, [selectedYear, selectedMonth]);


  // Calculate activeStartDate for the calendar based on selected month and year
  const getCalendarStartDate = () => {
    if (selectedYear && selectedMonth) {
      return new Date(selectedYear, selectedMonth - 1); // Month is zero-indexed in Date
    }
    return new Date(); // Default to current date if no month/year is selected
  };


    	
  const handleDayClick = (date) => {
    const dateString = date.toLocaleDateString('en-CA');
    const dayData = presenceData.find((p) => p.date === dateString);
    console.log('dayData', dayData)
    if (dayData) {
      setSelectedDayData(dayData);
      setIsPopupOpen(true);
    }
  };
  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedDayData(null);
  };
 
  return (
    <div className="admin-dashboard">
      <div className="navbar">
        <h1>Admin Dashboard</h1>
        {/* Sign Out Button */}
        <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
      </div>

      {/* Month and Year Selection */}
      <div className="filter-section">    
        <label>Year:</label>
        <select onChange={(e) => setSelectedYear(e.target.value)} value={selectedYear}>
          <option value="">Select Year</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        
        <label>Month:</label>
        <select onChange={(e) => setSelectedMonth(e.target.value)} value={selectedMonth}>
          <option value="">Select Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>

      {/* Missing Employees Section */}
      <div className="missing-employees-section">
        <h2>Missing Presence for Employees:</h2>
        {missingEmployees.length > 0 ? (
          <ul>
            {missingEmployees.map((employee) => (
              <li key={employee.id}>
                {employee.name} {employee.surname}
              </li>
            ))}
          </ul>
        ) : (
          <p>No employees found.</p>
        )}
      </div>

      {/* Employee List */}
      <div className="employee-list">
        <h2>Employees</h2>
        <ul>
          {employees.map((employee) => (
            <li key={employee.id} onClick={() => handleEmployeeSelect(employee.id)}>
              {employee.name} {employee.surname}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <input type='date' value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
        <button onClick={handleAddHoliday}>Add Holiday</button>
      </div>

      {/* Employee Details */}
      {selectedEmployee && (
        <div className="employee-details">
          <h2>Employee Details</h2>
          <p><strong>Name:</strong> {employeeDetails.name}</p>
          <p><strong>Surname:</strong> {employeeDetails.surname}</p>
          <p><strong>Job Start Date:</strong> {employeeDetails.job_start_date}</p>
          <p><strong>Full-Time:</strong> {employeeDetails.full_time ? 'Yes' : 'No'}</p>
          <p><strong>Phone Number:</strong> {employeeDetails.phone_number}</p>
          <p><strong>Personal Email:</strong> {employeeDetails.personal_email}</p>
          <p><strong>Work Email:</strong> {employeeDetails.work_email}</p>
          <p><strong>Role:</strong> {employeeDetails.role}</p>
        </div>
      )}

      {/* Employee Presence Data */}
      {selectedEmployee && (
        <div className="presence-data">
          <h2>Employee Presence Data</h2>
          <p><strong>Total Worked Hours:</strong> {employeeOverview.totalWorkedHoursInMonth || 'N/A'}</p>
          <p><strong>Expected Working Hours:</strong> {employeeOverview.totalExpectedWorkingHours || 'N/A'}</p>
          <p><strong>Total Extra Hours:</strong> {employeeOverview.totalExtraHoursInMonth || 'N/A'}</p>
          <p><strong>Total Off Hours:</strong> {employeeOverview.totalOffHoursInMonth || 'N/A'}</p>
          <p><strong>Total Off Days:</strong> {employeeOverview.totalOffDaysInMonth || 'N/A'}</p>
          <p><strong>Notes:</strong> {employeeOverview.notes || 'N/A'}</p>


          {/* Calendar Component */}
          <Calendar
            activeStartDate={getCalendarStartDate()}
            onClickDay={handleDayClick}
            tileContent={({ date }) => {
              const dateString = date.toLocaleDateString('en-CA');
              const dayData = presenceData.find((p) => p.date === dateString);

              if (dayData) {
                if (dayData.national_holiday) {
                  return <span className="holiday-marker">🏖️</span>;
                }
                if (dayData.weekend) {
                  return <span className="weekend-marker">🛌</span>;
                }
                if (dayData.day_off) {
                  return <span className="day-off-marker">🌴</span>;
                }
                return <span className="present-marker">✔️</span>;
              }
              return <span className="absent-marker">X</span>;
            }}
          />
        </div>
      )}


      {/* Day Details Popup */}
      {isPopupOpen && selectedDayData && (
        <div className="day-popup">
          <div className="day-popup-content">
            <h2>Details for {selectedDayData.date}</h2>
            <p><strong>Morning Entry:</strong> {selectedDayData.entry_time_morning || 'N/A'}</p>
            <p><strong>Morning Exit:</strong> {selectedDayData.exit_time_morning || 'N/A'}</p>
            <p><strong>Afternoon Entry:</strong> {selectedDayData.entry_time_afternoon || 'N/A'}</p>
            <p><strong>Afternoon Exit:</strong> {selectedDayData.exit_time_afternoon || 'N/A'}</p>
            <p><strong>National Holiday:</strong> {selectedDayData.national_holiday ? '✔' : 'X'}</p>
            <p><strong>Weekend:</strong> {selectedDayData.weekend ?'✔' : 'X'}</p>
            <p><strong>Day Off:</strong> {selectedDayData.day_off ? '✔' : 'X'}</p>
            <p><strong>Time Off:</strong> {selectedDayData.time_off || '00:00'}</p>
            <p><strong>Extra Hours:</strong> {selectedDayData.extra_hours || '00:00'}</p>
            <p><strong>Notes:</strong> {selectedDayData.notes || 'None'}</p>
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}

      {/* Email and Export Section */}
      <div className="email-section">
        <h2>Send Email to Missing Employees</h2>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          rows="4"
        />
        <button onClick={handleSendEmail}>Send Email</button>
      </div>

      <button
        onClick={() => {
          if (!selectedEmployee || !selectedYear || !selectedMonth) {
            alert("Please select an employee, year, and month before exporting.");
            return;
          }
          handleExportExcel(selectedEmployee, selectedYear, selectedMonth,employeeDetails);
        }}
      >
        Export Data to Excel
      </button>
    </div>
  );
};

export default AdminDashboard;
