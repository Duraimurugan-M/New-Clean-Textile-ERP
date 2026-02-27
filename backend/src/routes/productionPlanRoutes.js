import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  createProductionPlan,
  getProductionPlans,
  updateProductionPlanStatus,
} from "../controllers/productionPlanController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("production", "view"), getProductionPlans);
router.post("/", authMiddleware, checkPermission("production", "create"), createProductionPlan);
router.patch("/:id/status", authMiddleware, checkPermission("production", "edit"), updateProductionPlanStatus);

export default router;
