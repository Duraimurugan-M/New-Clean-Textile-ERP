import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  calculateBOMRequirement,
  createBOM,
  getBOMById,
  getBOMs,
  updateBOM,
  updateBOMStatus,
} from "../controllers/bomController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("bom", "view"), getBOMs);
router.get("/:id", authMiddleware, checkPermission("bom", "view"), getBOMById);
router.post("/", authMiddleware, checkPermission("bom", "create"), createBOM);
router.put("/:id", authMiddleware, checkPermission("bom", "edit"), updateBOM);
router.patch("/:id/status", authMiddleware, checkPermission("bom", "edit"), updateBOMStatus);
router.post(
  "/:id/calculate-requirement",
  authMiddleware,
  checkPermission("bom", "view"),
  calculateBOMRequirement
);

export default router;
