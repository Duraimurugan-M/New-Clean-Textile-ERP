import express from "express";
import StockMovement from "../models/StockMovement.js";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";
import QueryFeatures from "../utils/queryFeatures.js";

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
  checkPermission("reports", "view"),
  async (req, res) => {
  try {
    const totalRecords = await StockMovement.countDocuments();

    const features = new QueryFeatures(StockMovement, req.query)
      .filter()
      .search(["lotNumber"])
      .sort()
      .paginate();

    const movements = await features.query
      .populate("performedBy", "name");

    res.json({
      success: true,
      data: movements,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all stock movement records (Dev Only)
router.delete(
  "/delete-all",
  devOnly,
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  async (req, res) => {
  try {
    await StockMovement.deleteMany();

    res.json({ success: true, message: "All stock movements Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
