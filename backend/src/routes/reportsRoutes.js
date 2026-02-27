import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  getOperationalReport,
  getProfitReport,
  exportOperationsReport,
  exportProfitReport,
} from "../controllers/reportsController.js";

const router = express.Router();

router.get("/operations", authMiddleware, checkPermission("reports", "view"), getOperationalReport);
router.get("/profit", authMiddleware, checkPermission("reports", "view"), getProfitReport);
router.get("/operations/export", authMiddleware, checkPermission("reports", "export"), exportOperationsReport);
router.get("/profit/export", authMiddleware, checkPermission("reports", "export"), exportProfitReport);

export default router;
