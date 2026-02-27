import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  createDispatch,
  getDispatches,
  updateDispatchStatus,
} from "../controllers/dispatchController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("dispatch", "view"), getDispatches);
router.post("/", authMiddleware, checkPermission("dispatch", "create"), createDispatch);
router.patch("/:id/status", authMiddleware, checkPermission("dispatch", "edit"), updateDispatchStatus);

export default router;
