import express from "express";
import {
  createPurchase,
  deleteAllPurchases,
  getPurchases,
} from "../controllers/purchaseController.js";

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
  checkPermission("purchase", "view"),
  getPurchases
);

router.post(
  "/",
  authMiddleware,
  checkPermission("purchase", "create"),
  createPurchase
);

router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("purchase", "delete"),
  deleteAllPurchases
);

export default router;
