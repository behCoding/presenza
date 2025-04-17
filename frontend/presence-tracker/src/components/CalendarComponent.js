import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarComponent.css';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


const CalendarComponent = ({ userEmail }) => {
  const [date, setDate] = useState(new Date());
  const [defaultTimes, setDefaultTimes] = useState({
    entry_time_morning: '',
    exit_time_morning: '',
    entry_time_afternoon: '',
    exit_time_afternoon: '',
  });
  const [dailyPresence, setDailyPresence] = useState([]);
  const [monthlyPresenceData, setMonthlyPresenceData] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState('');
  const [isMonthChanged, setIsMonthChanged] = useState(true);
  const userId = localStorage.getItem('user_id');
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!isMonthChanged) return;
    
    const fetchDefaultTimes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-default-hours', {
          params: { user_id: userId, submitted_by_id: userId }
        });
        setDefaultTimes(response.data);
      } catch (error) {
        console.error("Error fetching default times.");
      }
    };

    const fetchDailyPresence = async () => {
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const response = await axios.get(`http://localhost:8000/employee-presence/${userId}/${year}/${month}`);
        const presenceData = response.data;
    
        if (presenceData.length === 0) {
          console.warn("No presence data found for this month. Using default hours.");
          // Fill the month with default hours
          const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
          const defaultData = Array.from({ length: daysInMonth }, (_, dayIndex) => {
            const dayDate = new Date(year, date.getMonth(), dayIndex + 1).toLocaleDateString('en-CA');
            const isWeekend = [0, 6].includes(new Date(dayDate).getDay());
            return {
              date: dayDate,
              ...defaultTimes,
              national_holiday: false,
              weekend: isWeekend,
              day_off: false,
              time_off: "00:00",
              extra_hours: "00:00",
              illness: "",
              notes: "",
            };
          });
    
          setDailyPresence(defaultData);
          const mappedDefaults = defaultData.reduce((acc, dayData) => {
            acc[dayData.date] = dayData;
            return acc;
          }, {});
          setMonthlyPresenceData(mappedDefaults);
        } else {
          setDailyPresence(presenceData);
          const mappedData = presenceData.reduce((acc, dayData) => {
            acc[dayData.date] = dayData;
            return acc;
          }, {});
          setMonthlyPresenceData(mappedData);
        }
      } catch (error) {
        console.error("Error fetching presence data:", error);
      }
    };
    
    

    fetchDefaultTimes();
    fetchDailyPresence();
    setIsMonthChanged(false);
  }, [date, userEmail]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Redirect to login page
  };

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
  
  useEffect(() => {
    checkTokenExpiration();
  }, []);

  const handleMonthChange = (newDate) => {
    setDate(newDate);
    setIsMonthChanged(true); 
  };

  const openPopup = (day) => {
    console.log("Selected day:", day);
    const dayString = day.toLocaleDateString('en-CA');
    const isWeekend = [0, 6].includes(day.getDay());

    const presence = monthlyPresenceData[dayString] || dailyPresence.find(p => p.date === dayString) || {
      ...defaultTimes,
      national_holiday: false,
      weekend: isWeekend,
      day_off: false,
      time_off: '00:00',
      extra_hours: '00:00',
      illness: '',
      notes: '',
    };

    setSelectedDay(day);
    setMonthlyPresenceData(prevData => ({
      ...prevData,
      [dayString]: presence,
    }));
    setShowPopup(true);
  };

  const closePopup = () => {
    if (selectedDay) {
      const dayString = selectedDay.toLocaleDateString('en-CA');
      setMonthlyPresenceData(prevData => ({
        ...prevData,
        [dayString]: {
          ...prevData[dayString],
          ...monthlyPresenceData[dayString], 
        },
      }));
    }
    setShowPopup(false);
    setSelectedDay(null);
  };

  const handlePresenceChange = (field, value) => {
    if (selectedDay) {
      const dayString = selectedDay.toLocaleDateString('en-CA');
      setMonthlyPresenceData(prevData => ({
        ...prevData,
        [dayString]: {
          ...prevData[dayString],
          [field]: value,
        },
      }));
    }
  };
  

  const isDataChanged = (dayString) => {
    const savedData = dailyPresence.find(p => p.date === dayString);
    const currentData = monthlyPresenceData[dayString];
  
    if (!currentData) return false; 
    if (!savedData) return true; 
  
    return (
      savedData.entry_time_morning !== currentData.entry_time_morning ||
      savedData.exit_time_morning !== currentData.exit_time_morning ||
      savedData.entry_time_afternoon !== currentData.entry_time_afternoon ||
      savedData.exit_time_afternoon !== currentData.exit_time_afternoon ||
      savedData.national_holiday !== currentData.national_holiday ||
      savedData.weekend !== currentData.weekend ||
      savedData.day_off !== currentData.day_off ||
      savedData.time_off !== currentData.time_off ||
      savedData.extra_hours !== currentData.extra_hours ||
      savedData.illness !== currentData.illness ||
      savedData.notes !== currentData.notes
    );
  };

  const isMonthDataChanged = () => {
    return Object.keys(monthlyPresenceData).some(dayString => {
      const savedData = dailyPresence.find(p => p.date === dayString);
      const currentData = monthlyPresenceData[dayString];
  
      if (!savedData) return true;
      return (
        savedData.entry_time_morning !== currentData.entry_time_morning ||
        savedData.exit_time_morning !== currentData.exit_time_morning ||
        savedData.entry_time_afternoon !== currentData.entry_time_afternoon ||
        savedData.exit_time_afternoon !== currentData.exit_time_afternoon ||
        savedData.national_holiday !== currentData.national_holiday ||
        savedData.weekend !== currentData.weekend ||
        savedData.day_off !== currentData.day_off ||
        savedData.time_off !== currentData.time_off ||
        savedData.extra_hours !== currentData.extra_hours ||
        savedData.illness !== currentData.illness ||
        savedData.notes !== currentData.notes
      );
    });
  };

  const handleSaveMonthlyPresence = async () => {
    const dataHasChanged = isMonthDataChanged();
    const year = date.getFullYear();
    const month = date.getMonth();
  
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const allDaysOfMonth = Array.from({ length: daysInMonth }, (_, i) => {
      const day = new Date(year, month, i + 1);
      return day.toLocaleDateString('en-CA');});
      
    if (!dataHasChanged) {
      const confirmSubmit = window.confirm(
        "No changes detected. Do you want to submit the presence data with default values?"
      );
      if (!confirmSubmit) return;

    }

    const presenceDataList = allDaysOfMonth.map(day => {
      const savedData = monthlyPresenceData[day] || dailyPresence.find(p => p.date === day) || {
        ...defaultTimes,
        national_holiday: false,
        weekend: [0, 6].includes(new Date(day).getDay()),  // Mark weekends as true
        day_off: false,
        time_off: "00:00",
        extra_hours: "00:00",
        illness: "",
        notes: "",
      };
  
      return {
        ...savedData,
        employee_id: userId,
        date: day,
        time_off: savedData.time_off || "00:00",
        extra_hours: savedData.extra_hours || "00:00",
      };
    });


    try {
      await axios.post(
        `http://localhost:8000/employee-dashboard?user_id=${userId}`,
        presenceDataList
      );
      alert('Monthly presence data saved successfully!');
    } catch (error) {
      console.error("Error saving monthly presence data:", error);
      alert("There was an error saving the data. Please try again.");
    }
  };

  

  const handleDefaultHoursSave = async () => {
    const defaultHoursData = {
      user_id: userId,
      submitted_by_id: userId,
      entry_time_morning: defaultTimes.entry_time_morning,
      exit_time_morning: defaultTimes.exit_time_morning,
      entry_time_afternoon: defaultTimes.entry_time_afternoon,
      exit_time_afternoon: defaultTimes.exit_time_afternoon,
    };

    try {
      const response = await axios.get('http://localhost:8000/get-default-hours', {
        params: { user_id: userId, submitted_by_id: userId }
      });

      if (response.data) {
        await axios.put('http://localhost:8000/default-hours', defaultHoursData);
        alert('Default hours updated successfully!');
      } else {
        await axios.post('http://localhost:8000/default-hours', defaultHoursData);
        alert('Default hours saved successfully!');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Handle the case where no data was found (404)
        await axios.post('http://localhost:8000/default-hours', defaultHoursData);
        alert('Default hours saved successfully!');
      } else {
        console.error("Error saving default hours:", error);
        alert("Error occurred while saving default hours.");
      }
    }
  };

  return (
    <div className="calendar-container">
      <h1>Monthly Presence Tracker</h1>
      {/* Sign Out Button */}
      <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
      {error && <p className="error-message">{error}</p>}
      <Calendar
        onChange={setDate}
        value={date}
        onActiveStartDateChange={({ activeStartDate }) => handleMonthChange(activeStartDate)}
        tileContent={({ date }) => {
          const dayString = date.toLocaleDateString('en-CA');
          const hasCustomData = isDataChanged(dayString);
          return (
            <div onClick={() => openPopup(date)}
                 style={{width: '100%',
                   height: '100%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   zIndex: 1,
                   cursor: 'pointer', }}>
                   {hasCustomData ? '✔' : 'default'}
                 </div>
              );
        }}
        view="month"
      />

      {showPopup && selectedDay && (
        <div className="popup">
          <h2>Edit Presence for {selectedDay.toDateString()}</h2>
          <div>
            <label>Morning Entry:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.entry_time_morning || ''}
              onChange={(e) => handlePresenceChange('entry_time_morning', e.target.value)}
            />
          </div>
          <div>
            <label>Morning Exit:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.exit_time_morning || ''}
              onChange={(e) => handlePresenceChange('exit_time_morning', e.target.value)}
            />
          </div>
          <div>
            <label>Afternoon Entry:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.entry_time_afternoon || ''}
              onChange={(e) => handlePresenceChange('entry_time_afternoon', e.target.value)}
            />
          </div>
          <div>
            <label>Afternoon Exit:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.exit_time_afternoon || ''}
              onChange={(e) => handlePresenceChange('exit_time_afternoon', e.target.value)}
            />
          </div>

          <div>
            <label>National Holiday:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.national_holiday || false}
              onChange={(e) => handlePresenceChange('national_holiday', e.target.checked)}
            />
          </div>
          <div>
            <label>Weekend:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.weekend || false}
              onChange={(e) => handlePresenceChange('weekend', e.target.checked)}
            />
          </div>
          <div>
            <label>Day Off:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.day_off || false}
              onChange={(e) => handlePresenceChange('day_off', e.target.checked)}
            />
          </div>
          <div>
            <label>Time Off:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.time_off || ''}
              onChange={(e) => handlePresenceChange('time_off', e.target.value)}
            />
          </div>
          <div>
            <label>Extra hours:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.extra_hours || ''}
              onChange={(e) => handlePresenceChange('extra_hours', e.target.value)}
            />
          </div>
            <div>
            <label>Illness Certificate NO.:</label>
            <textarea
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.illness || ''}
              onChange={(e) => handlePresenceChange('notes', e.target.value)}
            />
          </div>
          <div>
            <label>Notes:</label>
            <textarea
              value={monthlyPresenceData[selectedDay.toLocaleDateString('en-CA')]?.notes || ''}
              onChange={(e) => handlePresenceChange('notes', e.target.value)}
            />
          </div>
          <button onClick={closePopup}>Close</button>
        </div>
      )}

      <div className="default-times">
              <h2>Default Times</h2>
              <div>
                <label>Morning Entry:</label>
                <input
                  type="time"
                  value={defaultTimes.entry_time_morning}
                  onChange={(e) => setDefaultTimes({ ...defaultTimes, entry_time_morning: e.target.value })}
                />
              </div>
              <div>
                <label>Morning Exit:</label>
                <input
                  type="time"
                  value={defaultTimes.exit_time_morning}
                  onChange={(e) => setDefaultTimes({ ...defaultTimes, exit_time_morning: e.target.value })}
                />
              </div>
              <div>
                <label>Afternoon Entry:</label>
                <input
                  type="time"
                  value={defaultTimes.entry_time_afternoon}
                  onChange={(e) => setDefaultTimes({ ...defaultTimes, entry_time_afternoon: e.target.value })}
                />
              </div>
              <div>
                <label>Afternoon Exit:</label>
                <input
                  type="time"
                  value={defaultTimes.exit_time_afternoon}
                  onChange={(e) => setDefaultTimes({ ...defaultTimes, exit_time_afternoon: e.target.value })}
                />
              </div>
              <button className="save-button" onClick={handleSaveMonthlyPresence}>Save Presence for Month</button>
              <button className="default-hours-button" onClick={handleDefaultHoursSave}>Save Default Hours</button>
            </div>
          </div>
  );
};

export default CalendarComponent;
