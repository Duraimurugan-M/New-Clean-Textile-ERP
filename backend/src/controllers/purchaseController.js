import Purchase from "../models/Purchase.js";
import { addStock } from "../services/inventoryService.js";
import StockMovement from "../models/StockMovement.js";
import Inventory from "../models/Inventory.js";
import QueryFeatures from "../utils/queryFeatures.js";
import mongoose from "mongoose";

export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { supplier, materialType, lotNumber, quantity, unit, ratePerUnit } =
      req.body;

    if (!supplier || !materialType || !lotNumber)
      return res.status(400).json({ message: "All fields required" });

    if (Number(quantity) <= 0)
      return res.status(400).json({ message: "Quantity must be greater than 0" });

    if (Number(ratePerUnit) <= 0)
      return res.status(400).json({ message: "Rate must be greater than 0" });

    session.startTransaction();

    const existingLot = await Inventory.findOne({ lotNumber }).session(session);
    if (existingLot) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Lot already exists" });
    }

    const totalAmount = quantity * ratePerUnit;

    const [purchase] = await Purchase.create([{
      supplier,
      materialType,
      lotNumber,
      quantity,
      unit,
      ratePerUnit,
      totalAmount,
      purchasedBy: req.user._id,
    }], { session });

    await addStock({
      materialType,
      lotNumber,
      quantity,
      unit,
      ratePerUnit,
      location: "Main Warehouse",
      createdBy: req.user._id,
    }, session);

    const stockAfter = await Inventory.findOne({ materialType, lotNumber }).session(session);

    await StockMovement.create([{
      materialType,
      lotNumber,
      movementType: "IN",
      module: "Purchase",
      quantity,
      previousStock: 0,
      newStock: stockAfter.quantity,
      referenceId: purchase._id,
      performedBy: req.user._id,
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Purchase created & stock added",
      data: purchase,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getPurchases = async (req, res) => {
  try {
    const totalRecords = await Purchase.countDocuments();

    const features = new QueryFeatures(Purchase, req.query)
      .filter()
      .search(["lotNumber"])
      .sort()
      .paginate();

    const purchases = await features.query
      .populate("supplier", "supplierName phone")
      .populate("purchasedBy", "name email");

    res.json({
      success: true,
      data: purchases,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAllPurchases = async (req, res) => {
  try {
    await Purchase.deleteMany();
    res.status(200).json({
      success: true,
      message: "All purchase records deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
