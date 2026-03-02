import express from "express";
import {
  createVendor,
  getVendors,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  deleteAllVendors,
} from "../controllers/vendorController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createVendor);
router.get("/", authMiddleware, getVendors);
router.put("/:id", authMiddleware, updateVendor);
router.patch("/:id/status", authMiddleware, updateVendorStatus);
router.delete("/delete-all", authMiddleware, deleteAllVendors); // dev only
router.delete("/:id", authMiddleware, deleteVendor);

export default router;
