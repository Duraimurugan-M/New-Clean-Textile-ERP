import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import hero from "../../styles/moduleHero.module.css";
import styles from "./Calendar.module.css";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Calendar = () => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const [form, setForm] = useState({ title: "", notes: "" });
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const monthLabel = useMemo(
    () => new Date(currentYear, currentMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [currentMonth, currentYear]
  );

  const fetchEvents = async (month = currentMonth, year = currentYear) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/tools/calendar/events?month=${month + 1}&year=${year}`);
      setEvents(data.data || []);
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dayCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(currentYear, currentMonth, day));
    }
    return cells;
  }, [firstDay, daysInMonth, currentMonth, currentYear]);

  const keyOfDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const todayKey = keyOfDate(new Date());
  const isPastDateKey = (dateKey) => dateKey < todayKey;

  const selectedDateKey = keyOfDate(selectedDate);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = keyOfDate(event.eventDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedDateKey) || [];

  const changeMonth = (offset) => {
    const next = new Date(currentYear, currentMonth + offset, 1);
    setCurrentMonth(next.getMonth());
    setCurrentYear(next.getFullYear());
    setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      if (!form.title.trim()) {
        setErrorText("Title is required");
        return;
      }
      if (isPastDateKey(selectedDateKey)) {
        setErrorText("Cannot add events on past dates");
        return;
      }

      await API.post("/tools/calendar/events", {
        title: form.title.trim(),
        notes: form.notes.trim(),
        eventDate: selectedDateKey,
      });

      setForm({ title: "", notes: "" });
      await fetchEvents();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create event");
    }
  };

  const deleteEvent = async (id) => {
    try {
      await API.delete(`/tools/calendar/events/${id}`);
      await fetchEvents();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to delete event");
    }
  };

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <div>
          <p className={hero.kicker}>Tools Workspace</p>
          <h1 className={hero.title}>Calendar</h1>
          <p className={hero.subtitle}>Plan production events, task follow-ups, and daily operations schedule.</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.monthNav}>
            <button type="button" onClick={() => changeMonth(-1)}>
              Prev
            </button>
            <span>{monthLabel}</span>
            <button type="button" onClick={() => changeMonth(1)}>
              Next
            </button>
          </div>
        </div>

        {errorText ? <p className={styles.error}>{errorText}</p> : null}

        <div className={styles.layout}>
          <div className={styles.calendarCard}>
            <div className={styles.weekRow}>
              {weekDays.map((day) => (
                <div key={day} className={styles.weekCell}>
                  {day}
                </div>
              ))}
            </div>

            <div className={styles.grid}>
              {dayCells.map((date, index) => {
                if (!date) {
                  return <div key={`blank-${index}`} className={styles.blankCell} />;
                }

                const dateKey = keyOfDate(date);
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isSelected = dateKey === selectedDateKey;
                const isToday = dateKey === todayKey;
                const isPastDay = isPastDateKey(dateKey);

                return (
                  <button
                    type="button"
                    key={dateKey}
                    className={`${styles.dayCell} ${isSelected ? styles.selected : ""} ${isToday ? styles.today : ""} ${isPastDay ? styles.pastDay : ""}`}
                    onClick={() => setSelectedDate(date)}
                    disabled={isPastDay}
                  >
                    <span className={styles.dayNumber}>{date.getDate()}</span>
                    {dayEvents.length > 0 ? <span className={styles.badge}>{dayEvents.length}</span> : null}
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event._id} className={styles.eventPreview}>
                        {event.title}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sidePanel}>
            <h3>{selectedDate.toLocaleDateString("en-GB")}</h3>

            <form className={styles.form} onSubmit={handleCreateEvent}>
              <input
                type="text"
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <button type="submit">Add Event</button>
            </form>

            {isPastDateKey(selectedDateKey) ? (
              <p className={styles.empty}>Past date selected. Event creation is disabled.</p>
            ) : null}

            {loading ? <p>Loading events...</p> : null}

            <div className={styles.eventsList}>
              {selectedEvents.length === 0 ? (
                <p className={styles.empty}>No events on this day</p>
              ) : (
                selectedEvents.map((event) => (
                  <div key={event._id} className={styles.eventItem}>
                    <div>
                      <p className={styles.eventTitle}>{event.title}</p>
                      {event.notes ? <p className={styles.eventNotes}>{event.notes}</p> : null}
                    </div>
                    <button type="button" onClick={() => deleteEvent(event._id)} className={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
