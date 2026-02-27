import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import { createBeam, getBeams, updateBeamStatus } from "../controllers/beamController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("beam", "view"), getBeams);
router.post("/", authMiddleware, checkPermission("beam", "create"), createBeam);
router.patch("/:id/status", authMiddleware, checkPermission("beam", "edit"), updateBeamStatus);

export default router;
