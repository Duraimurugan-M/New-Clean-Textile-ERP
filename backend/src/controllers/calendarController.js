import CalendarEvent from "../models/CalendarEvent.js";

const getMonthRange = (month, year) => {
  const safeMonth = Number(month);
  const safeYear = Number(year);

  if (
    !Number.isInteger(safeMonth) ||
    !Number.isInteger(safeYear) ||
    safeMonth < 1 ||
    safeMonth > 12 ||
    safeYear < 2000 ||
    safeYear > 2100
  ) {
    return null;
  }

  const from = new Date(Date.UTC(safeYear, safeMonth - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(safeYear, safeMonth, 1, 0, 0, 0, 0));
  return { from, to };
};

const parseEventDateInput = (value) => {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0));
};

const isPastEventDate = (date) => {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const targetKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
  return targetKey < todayKey;
};

export const createCalendarEvent = async (req, res) => {
  try {
    const { title, notes, eventDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!eventDate) {
      return res.status(400).json({ message: "Event date is required" });
    }

    const parsedDate = parseEventDateInput(eventDate);
    if (!parsedDate) {
      return res.status(400).json({ message: "Invalid event date" });
    }
    if (isPastEventDate(parsedDate)) {
      return res.status(400).json({ message: "Event date cannot be in the past" });
    }

    const event = await CalendarEvent.create({
      title: title.trim(),
      notes: notes?.trim() || "",
      eventDate: parsedDate,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const range = getMonthRange(month, year);

    if (!range) {
      return res.status(400).json({ message: "Valid month and year are required" });
    }

    const events = await CalendarEvent.find({
      createdBy: req.user._id,
      eventDate: { $gte: range.from, $lt: range.to },
    }).sort({ eventDate: 1, createdAt: 1 });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const safeTitle = String(req.body.title || "").trim();
      if (!safeTitle) {
        return res.status(400).json({ message: "Title is required" });
      }
      updates.title = safeTitle;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "notes")) {
      updates.notes = String(req.body.notes || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "eventDate")) {
      const parsedDate = parseEventDateInput(req.body.eventDate);
      if (!parsedDate) {
        return res.status(400).json({ message: "Invalid event date" });
      }
      if (isPastEventDate(parsedDate)) {
        return res.status(400).json({ message: "Event date cannot be in the past" });
      }
      updates.eventDate = parsedDate;
    }

    const event = await CalendarEvent.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      updates,
      { returnDocument: "after", runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await CalendarEvent.findOneAndDelete({
      _id: id,
      createdBy: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
