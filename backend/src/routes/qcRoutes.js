import express from "express";
import { createQC, deleteQCRecords, getQCRecords } from "../controllers/qcController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";

const router = express.Router();
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Forbidden in non-development environment" });
  }
  next();
};

router.get(
  "/",
  authMiddleware,
  checkPermission("qc", "view"),
  getQCRecords
);

router.post(
  "/",
  authMiddleware,
  checkPermission("qc", "approve"),
  createQC
);

router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("qc", "approve"),
  deleteQCRecords
);

export default router;
