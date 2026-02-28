import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1500,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

export default CalendarEvent;
