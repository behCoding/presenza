import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarComponent.css';

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
  
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchDefaultTimes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-default-hours', {
          params: { user_id: userId }
        });
        setDefaultTimes(response.data);
      } catch (error) {
        console.error("Error fetching default times.");
      }
    };

    const fetchDailyPresence = async () => {
      try {
        const month = date.toISOString().slice(0, 7);
        const response = await axios.get(`http://localhost:8000/daily-presence/${userId}/${month}`);
        setDailyPresence(response.data);
      } catch (error) {
        console.warn("No presence data found for this month.");
      }
    };

    fetchDefaultTimes();
    fetchDailyPresence();
  }, [date, userEmail]);

  const openPopup = (day) => {
    console.log("Selected day:", day);
    const dayString = day.toISOString().split('T')[0];
    const isWeekend = [0, 6].includes(day.getDay());

    const presence = monthlyPresenceData[dayString] || dailyPresence.find(p => p.date === dayString) || {
      ...defaultTimes,
      national_holiday: false,
      weekend: isWeekend,
      day_off: false,
      time_off: '',
      extra_hours: '',
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
    setShowPopup(false);
    setSelectedDay(null);
  };

  const handlePresenceChange = (field, value) => {
    const dayString = selectedDay.toISOString().split('T')[0];
    setMonthlyPresenceData(prevData => ({
      ...prevData,
      [dayString]: {
        ...prevData[dayString],
        [field]: value,
      }
    }));
  };

  const isDataChanged = () => {
    return dailyPresence.some(dayData => {
      const dayString = dayData.date;
      const savedData = monthlyPresenceData[dayString];
  
      if (!savedData) return false;
  
      // Compare relevant fields for changes
      return (
        savedData.entry_time_morning !== dayData.entry_time_morning ||
        savedData.exit_time_morning !== dayData.exit_time_morning ||
        savedData.entry_time_afternoon !== dayData.entry_time_afternoon ||
        savedData.exit_time_afternoon !== dayData.exit_time_afternoon ||
        savedData.national_holiday !== dayData.national_holiday ||
        savedData.weekend !== dayData.weekend ||
        savedData.day_off !== dayData.day_off ||
        savedData.time_off !== dayData.time_off ||
        savedData.extra_hours !== dayData.extra_hours ||
        savedData.notes !== dayData.notes
      );
    });
  };
  

  const handleSaveMonthlyPresence = async () => {
    const dataHasChanged = isDataChanged();
    const year = date.getFullYear();
    const month = date.getMonth();
  
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const allDaysOfMonth = Array.from({ length: daysInMonth }, (_, i) => {
      const day = new Date(year, month, i + 2);
      return day.toISOString().split('T')[0];});
      
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
        time_off: "00:00", // Default value
        extra_hours: "00:00", // Default value
        notes: "", // Default value
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
      entry_time_morning: defaultTimes.entry_time_morning,
      exit_time_morning: defaultTimes.exit_time_morning,
      entry_time_afternoon: defaultTimes.entry_time_afternoon,
      exit_time_afternoon: defaultTimes.exit_time_afternoon,
    };

    try {
      const response = await axios.get('http://localhost:8000/get-default-hours', {
        params: { user_id: userId }
      });

      if (response.data) {
        await axios.put('http://localhost:8000/default-hours', defaultHoursData);
        alert('Default hours updated successfully!');
      } else {
        await axios.post('http://localhost:8000/default-hours', defaultHoursData);
        alert('Default hours saved successfully!');
      }
    } catch (error) {
      console.error("Error saving default hours.");
    }
  };

  return (
    <div className="calendar-container">
      <h1>Monthly Presence Tracker</h1>
      {error && <p className="error-message">{error}</p>}
      <Calendar
        onChange={setDate}
        value={date}
        tileContent={({ date }) => {
          const dayString = date.toISOString().split('T')[0];
          const hasCustomData = !!monthlyPresenceData[dayString];
          return (
            <div onClick={() => openPopup(date)} style={{width: '100%',
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
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.entry_time_morning || ''}
              onChange={(e) => handlePresenceChange('entry_time_morning', e.target.value)}
            />
          </div>
          <div>
            <label>Morning Exit:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.exit_time_morning || ''}
              onChange={(e) => handlePresenceChange('exit_time_morning', e.target.value)}
            />
          </div>
          <div>
            <label>Afternoon Entry:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.entry_time_afternoon || ''}
              onChange={(e) => handlePresenceChange('entry_time_afternoon', e.target.value)}
            />
          </div>
          <div>
            <label>Afternoon Exit:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.exit_time_afternoon || ''}
              onChange={(e) => handlePresenceChange('exit_time_afternoon', e.target.value)}
            />
          </div>

          <div>
            <label>National Holiday:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.national_holiday || false}
              onChange={(e) => handlePresenceChange('national_holiday', e.target.checked)}
            />
          </div>
          <div>
            <label>Weekend:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.weekend || false}
              onChange={(e) => handlePresenceChange('weekend', e.target.checked)}
            />
          </div>
          <div>
            <label>Day Off:</label>
            <input
              type="checkbox"
              checked={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.day_off || false}
              onChange={(e) => handlePresenceChange('day_off', e.target.checked)}
            />
          </div>
          <div>
            <label>Time Off:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.time_off || ''}
              onChange={(e) => handlePresenceChange('time_off', e.target.value)}
            />
          </div>
          <div>
            <label>Extra hours:</label>
            <input
              type="time"
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.extra_hours || ''}
              onChange={(e) => handlePresenceChange('extra_hours', e.target.value)}
            />
          </div>
          <div>
            <label>Notes:</label>
            <textarea
              value={monthlyPresenceData[selectedDay.toISOString().split('T')[0]]?.notes || ''}
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
