import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from "../controllers/calendarController.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/events").get(getCalendarEvents).post(createCalendarEvent);
router.route("/events/:id").put(updateCalendarEvent).delete(deleteCalendarEvent);

export default router;
