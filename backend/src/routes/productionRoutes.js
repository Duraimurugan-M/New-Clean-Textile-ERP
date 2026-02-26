import express from "express";
import {
  createProduction,
  getProductions,
  deleteAllProductions,
} from "../controllers/productionController.js";

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
  checkPermission("production", "view"),
  getProductions
);

router.post(
  "/",
  authMiddleware,
  checkPermission("production", "create"),
  createProduction
);

router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("production", "edit"),
  deleteAllProductions
);

export default router;
