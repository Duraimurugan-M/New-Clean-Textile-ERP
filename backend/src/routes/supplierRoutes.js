import express from "express";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier,
} from "../controllers/supplierController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createSupplier);
router.get("/", authMiddleware, getSuppliers);
router.put("/:id", authMiddleware, updateSupplier);
router.patch("/:id/status", authMiddleware, updateSupplierStatus);
router.delete("/:id", authMiddleware, deleteSupplier);

export default router;
