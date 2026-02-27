import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  createJobWorkIssue,
  receiveJobWork,
  getJobWorks,
} from "../controllers/jobWorkController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("jobWork", "view"), getJobWorks);

router.post(
  "/issue",
  authMiddleware,
  checkPermission("jobWork", "issue"),
  createJobWorkIssue
);

router.patch(
  "/:id/receive",
  authMiddleware,
  checkPermission("jobWork", "receive"),
  receiveJobWork
);

export default router;
