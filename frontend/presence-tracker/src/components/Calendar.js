import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Calendar = ({ userId, selectedYear, selectedMonth }) => {
  const [dailyPresence, setDailyPresence] = useState([]);
  const [defaultHours, setDefaultHours] = useState({});
  const [error, setError] = useState("");

  // Fetch default hours for the user
  const fetchDefaultHours = async () => {
    try {
      const response = await axios.get(`/default-hours?user_id=${userId}`);
      setDefaultHours(response.data);
    } catch (err) {
      setError("Failed to fetch default hours");
      console.error(err);
    }
  };

  // Fetch daily presence records for the selected month
  const fetchDailyPresence = async () => {
    try {
      const response = await axios.get(`/daily-presence`, {
        params: { user_id: userId, year: selectedYear, month: selectedMonth }
      });
      setDailyPresence(response.data);
    } catch (err) {
      setError("Failed to fetch daily presence records");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDefaultHours();
    fetchDailyPresence();
  }, [selectedYear, selectedMonth]);

  return (
    <div>
      <h2>Calendar for {selectedYear}-{selectedMonth}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Entry Morning</th>
            <th>Exit Morning</th>
            <th>Entry Afternoon</th>
            <th>Exit Afternoon</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {dailyPresence.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.entry_time_morning || defaultHours.entry_time_morning}</td>
              <td>{day.exit_time_morning || defaultHours.exit_time_morning}</td>
              <td>{day.entry_time_afternoon || defaultHours.entry_time_afternoon}</td>
              <td>{day.exit_time_afternoon || defaultHours.exit_time_afternoon}</td>
              <td>{day.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Calendar;
