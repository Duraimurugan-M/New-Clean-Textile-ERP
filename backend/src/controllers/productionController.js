import Production from "../models/Production.js";
import { addStock, deductStock } from "../services/inventoryService.js";
import StockMovement from "../models/StockMovement.js";
import Inventory from "../models/Inventory.js";
import QueryFeatures from "../utils/queryFeatures.js";
import mongoose from "mongoose";

// ✅ Create Production
export const createProduction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      inputMaterialType,
      inputLotNumber,
      inputQuantity,
      outputMaterialType,
      outputLotNumber,
      outputQuantity,
    } = req.body;

    // 🔹 Basic Validation
    if (
      !inputMaterialType ||
      !inputLotNumber ||
      !outputMaterialType ||
      !outputLotNumber
    ) {
      return res.status(400).json({ message: "All fields required" });
    }

    const inputQty = Number(inputQuantity);
    const outputQty = Number(outputQuantity);

    if (inputQty <= 0 || outputQty <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    if (outputQty > inputQty) {
      return res.status(400).json({
        message: "Output quantity cannot be greater than input quantity",
      });
    }

    session.startTransaction();

    // 🔒 Output lot must NOT exist
    const existingOutputLot = await Inventory.findOne({
      lotNumber: outputLotNumber,
    }).session(session);

    if (existingOutputLot) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Output lot already exists",
      });
    }

    // 🔒 Check input stock before deduction
    const inputStockBefore = await Inventory.findOne({
      materialType: inputMaterialType,
      lotNumber: inputLotNumber,
    }).session(session);

    if (!inputStockBefore) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Input lot not found in inventory",
      });
    }

    if (inputStockBefore.quantity < inputQty) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inputStockBefore.quantity}`,
      });
    }

    // 🔻 Deduct input stock
    await deductStock({
      materialType: inputMaterialType,
      lotNumber: inputLotNumber,
      quantity: inputQty,
      session,
    });

    // Get stock after deduction
    const inputStockAfter = await Inventory.findOne({
      materialType: inputMaterialType,
      lotNumber: inputLotNumber,
    }).session(session);

    // 📊 Calculate Wastage & Efficiency
    const wastage = inputQty - outputQty;
    const wastagePercentage = (wastage / inputQty) * 100;
    const efficiencyPercentage = (outputQty / inputQty) * 100;

    // ✅ Create Production Record
    const [production] = await Production.create([{
      inputMaterialType,
      inputLotNumber,
      inputQuantity: inputQty,
      outputMaterialType,
      outputLotNumber,
      outputQuantity: outputQty,
      wastage,
      wastagePercentage: Number(wastagePercentage.toFixed(2)),
      efficiencyPercentage: Number(efficiencyPercentage.toFixed(2)),
      status: "Completed",
      createdBy: req.user._id,
    }], { session });

    // 📘 Ledger ENTRY (INPUT OUT)
    await StockMovement.create([{
      materialType: inputMaterialType,
      lotNumber: inputLotNumber,
      movementType: "OUT",
      module: "Production",
      quantity: inputQty,
      previousStock: inputStockBefore.quantity,
      newStock: inputStockAfter.quantity,
      referenceId: production._id,
      performedBy: req.user._id,
    }], { session });

    // 🔼 Add Output Stock
    await addStock({
      materialType: outputMaterialType,
      lotNumber: outputLotNumber,
      quantity: outputQty,
      unit: inputStockBefore.unit,
      ratePerUnit: inputStockBefore.ratePerUnit || 0,
      location: "Production Warehouse",
      createdBy: req.user._id,
    }, session);

    const outputStockAfter = await Inventory.findOne({
      materialType: outputMaterialType,
      lotNumber: outputLotNumber,
    }).session(session);

    // 📘 Ledger ENTRY (OUTPUT IN)
    await StockMovement.create([{
      materialType: outputMaterialType,
      lotNumber: outputLotNumber,
      movementType: "IN",
      module: "Production",
      quantity: outputQty,
      previousStock: 0,
      newStock: outputStockAfter.quantity,
      referenceId: production._id,
      performedBy: req.user._id,
    }], { session });

    await session.commitTransaction();

    // ✅ Final Response
    res.status(201).json({
      success: true,
      message: "Production completed successfully",
      data: production,
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

// ✅ Get Productions
export const getProductions = async (req, res) => {
  try {
    const totalRecords = await Production.countDocuments();

    const features = new QueryFeatures(Production, req.query)
      .filter()
      .search(["inputLotNumber", "outputLotNumber"])
      .sort()
      .paginate();

    const productions = await features.query
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: productions,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete All (Testing Only)
export const deleteAllProductions = async (req, res) => {
  try {
    await Production.deleteMany();
    res.status(200).json({
      success: true,
      message: "All productions deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
