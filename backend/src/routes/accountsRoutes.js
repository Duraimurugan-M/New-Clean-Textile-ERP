import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import {
  createLedgerEntry,
  getLedgerEntries,
  getPurchaseLedger,
  getSalesLedger,
  getExpenseLedger,
  updateLedgerStatus,
  getAccountsSummary,
  exportLedger,
} from "../controllers/accountsController.js";

const router = express.Router();

router.get("/", authMiddleware, checkPermission("accounts", "view"), getLedgerEntries);
router.get("/summary", authMiddleware, checkPermission("accounts", "view"), getAccountsSummary);
router.get("/purchase-ledger", authMiddleware, checkPermission("accounts", "view"), getPurchaseLedger);
router.get("/sales-ledger", authMiddleware, checkPermission("accounts", "view"), getSalesLedger);
router.get("/expense-ledger", authMiddleware, checkPermission("accounts", "view"), getExpenseLedger);
router.get("/export", authMiddleware, checkPermission("accounts", "view"), exportLedger);
router.post("/", authMiddleware, checkPermission("accounts", "createInvoice"), createLedgerEntry);
router.patch("/:id/status", authMiddleware, checkPermission("accounts", "manageLedger"), updateLedgerStatus);

export default router;
