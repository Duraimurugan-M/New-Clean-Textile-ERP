import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  createSalesOrder,
  getSalesOrders,
  updateSalesOrderStatus,
} from "../controllers/salesOrderController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("salesOrder", "view"), getSalesOrders);
router.post("/", authMiddleware, checkPermission("salesOrder", "create"), createSalesOrder);
router.patch("/:id/status", authMiddleware, checkPermission("salesOrder", "edit"), updateSalesOrderStatus);

export default router;
