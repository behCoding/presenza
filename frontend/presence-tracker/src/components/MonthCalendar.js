import React from "react";

const MonthCalendar = ({ year, month, defaultHours, dailyPresence }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleDayPresenceChange = (day, field, value) => {
    // Update dailyPresence state with field and value for the specific day
    setDailyPresence((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
      {[...Array(daysInMonth).keys()].map((i) => {
        const day = i + 1;
        const isWeekend = new Date(year, month, day).getDay() % 6 === 0;
        const presence = dailyPresence[day] || {
          ...defaultHours,
          national_holiday: false,
          weekend: isWeekend,
          day_off: false,
          notes: "",
        };

        return (
          <div key={day} style={{ border: "1px solid #ddd", padding: "10px" }}>
            <h3>{day}</h3>
            <label>Morning Entry:</label>
            <input
              type="time"
              value={presence.entry_time_morning}
              onChange={(e) => handleDayPresenceChange(day, "entry_time_morning", e.target.value)}
            />
            <label>Morning Exit:</label>
            <input
              type="time"
              value={presence.exit_time_morning}
              onChange={(e) => handleDayPresenceChange(day, "exit_time_morning", e.target.value)}
            />
            <label>Afternoon Entry:</label>
            <input
              type="time"
              value={presence.entry_time_afternoon}
              onChange={(e) => handleDayPresenceChange(day, "entry_time_afternoon", e.target.value)}
            />
            <label>Afternoon Exit:</label>
            <input
              type="time"
              value={presence.exit_time_afternoon}
              onChange={(e) => handleDayPresenceChange(day, "exit_time_afternoon", e.target.value)}
            />
            <label>National Holiday:</label>
            <input
              type="checkbox"
              checked={presence.national_holiday}
              onChange={(e) => handleDayPresenceChange(day, "national_holiday", e.target.checked)}
            />
            <label>Day Off:</label>
            <input
              type="checkbox"
              checked={presence.day_off}
              onChange={(e) => handleDayPresenceChange(day, "day_off", e.target.checked)}
            />
            <label>Notes:</label>
            <input
              type="text"
              value={presence.notes}
              onChange={(e) => handleDayPresenceChange(day, "notes", e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MonthCalendar;
