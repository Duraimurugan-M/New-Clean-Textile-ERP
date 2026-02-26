import express from "express";
import { createSale, deleteAllSales, getSales } from "../controllers/salesController.js";
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
  checkPermission("sales", "view"),
  getSales
);

router.post(
  "/",
  authMiddleware,
  checkPermission("sales", "create"),
  createSale
);

router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("sales", "delete"),
  deleteAllSales
)

export default router;
