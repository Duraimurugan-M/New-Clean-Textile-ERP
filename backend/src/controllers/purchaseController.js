import Purchase from "../models/Purchase.js";
import { addStock } from "../services/inventoryService.js";
import StockMovement from "../models/StockMovement.js";
import Inventory from "../models/Inventory.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Supplier from "../models/Supplier.js";
import mongoose from "mongoose";

export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { supplier, materialType, lotNumber, quantity, unit, ratePerUnit } =
      req.body;
    const normalizedLot = String(lotNumber || "").trim();

    if (!supplier || !materialType || !normalizedLot)
      return res.status(400).json({ message: "All fields required" });

    if (Number(quantity) <= 0)
      return res.status(400).json({ message: "Quantity must be greater than 0" });

    if (Number(ratePerUnit) <= 0)
      return res.status(400).json({ message: "Rate must be greater than 0" });

    session.startTransaction();

    const existingLot = await Inventory.findOne({ lotNumber: normalizedLot }).session(session);
    if (existingLot) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Lot already exists" });
    }

    const totalAmount = quantity * ratePerUnit;

    const [purchase] = await Purchase.create([{
      supplier,
      materialType,
      lotNumber: normalizedLot,
      quantity,
      unit,
      ratePerUnit,
      totalAmount,
      purchasedBy: req.user._id,
    }], { session });

    const supplierDoc = await Supplier.findById(supplier).session(session);

    await addStock({
      materialType,
      lotNumber: normalizedLot,
      quantity,
      unit,
      ratePerUnit,
      location: "Main Warehouse",
      createdBy: req.user._id,
    }, session);

    const stockAfter = await Inventory.findOne({ materialType, lotNumber: normalizedLot }).session(session);

    await StockMovement.create([{
      materialType,
      lotNumber: normalizedLot,
      movementType: "IN",
      module: "Purchase",
      quantity,
      previousStock: 0,
      newStock: stockAfter.quantity,
      referenceId: purchase._id,
      performedBy: req.user._id,
    }], { session });

    await LedgerEntry.create(
      [
        {
          entryType: "PurchaseInvoice",
          partyType: "Supplier",
          partyName: supplierDoc?.supplierName || "Supplier",
          referenceType: "Purchase",
          referenceId: purchase._id,
          taxableAmount: totalAmount,
          gstAmount: 0,
          amount: totalAmount,
          debit: totalAmount,
          credit: 0,
          status: "Pending",
          notes: `Auto entry from purchase ${normalizedLot}`,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

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
    const queryObj = { ...req.query };
    const page = Number(queryObj.page) || 1;
    const limit = Number(queryObj.limit) || 10;
    const sortBy = queryObj.sortBy || "createdAt";
    const order = queryObj.order === "asc" ? 1 : -1;
    const search = String(queryObj.search || "").trim();

    const filters = {};
    if (queryObj.materialType) filters.materialType = queryObj.materialType;
    if (search) filters.lotNumber = { $regex: search, $options: "i" };

    const totalRecords = await Purchase.countDocuments(filters);
    const purchases = await Purchase.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("supplier", "supplierName phone")
      .populate("purchasedBy", "name email");

    res.json({
      success: true,
      data: purchases,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
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
