import express from "express";
import {
  createStock,
  consumeStock,
  deleteAllStock,
  getInventory,
} from "../controllers/inventoryController.js";

import  authMiddleware  from "../middleware/authMiddleware.js";
import  checkPermission  from "../middleware/permissionMiddleware.js";

const router = express.Router();
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Forbidden in non-development environment" });
  }
  next();
};

// Add stock (Store In-Charge or Purchase Manager)
router.post(
  "/",
  authMiddleware,
  checkPermission("inventory", "edit"),
  createStock
);

// View stock
router.get(
  "/",
  authMiddleware,
  checkPermission("inventory", "view"),
  getInventory
);

// Reduce stock (used in production later)
router.put(
  "/:id/reduce",
  authMiddleware,
  checkPermission("inventory", "edit"),
  consumeStock
);

// Delete all stocks in development/testing phase
router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("inventory", "edit"),
  deleteAllStock
);

export default router;
