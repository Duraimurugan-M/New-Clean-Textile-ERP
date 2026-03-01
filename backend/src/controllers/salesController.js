import Sales from "../models/Sales.js";
import StockMovement from "../models/StockMovement.js";
import Inventory from "../models/Inventory.js";
import { deductStock } from "../services/inventoryService.js";
import QC from "../models/QC.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Customer from "../models/Customer.js";
import QueryFeatures from "../utils/queryFeatures.js";
import mongoose from "mongoose";

// ✅ Create Sale
export const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { customer, materialType, lotNumber, quantity, ratePerUnit } =
      req.body;

    if (materialType !== "FinishedFabric") {
      return res.status(400).json({
        message: "Only Finished Fabric can be sold",
      });
    }

    const qty = Number(quantity);
    const rate = Number(ratePerUnit);

    if (!customer || !lotNumber || isNaN(qty) || isNaN(rate)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    if (qty <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    session.startTransaction();

    // 🔒 QC Check
    const qcRecord = await QC.findOne({ lotNumber }).session(session);
    if (!qcRecord) {
      await session.abortTransaction();
      return res.status(400).json({ message: "QC not completed" });
    }

    if (qcRecord.status !== "Approved") {
      await session.abortTransaction();
      return res.status(400).json({ message: "QC not approved" });
    }

    // 🔒 Check Inventory
    const stockBefore = await Inventory.findOne({
      materialType: "FinishedFabric",
      lotNumber,
    }).session(session);

    if (!stockBefore) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Lot not found" });
    }

    if (stockBefore.quantity < qty) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Insufficient stock. Available: ${stockBefore.quantity}`,
      });
    }

    // 🔻 Deduct stock
    await deductStock({
      materialType: "FinishedFabric",
      lotNumber,
      quantity: qty,
      session,
    });

    // Get updated stock
    const stockAfter = await Inventory.findOne({
      materialType: "FinishedFabric",
      lotNumber,
    }).session(session);

    const totalAmount = qty * rate;
    const customerDoc = await Customer.findById(customer).session(session);

    const [sale] = await Sales.create([{
      customer,
      materialType: "FinishedFabric",
      lotNumber,
      quantity: qty,
      ratePerUnit: rate,
      totalAmount,
      soldBy: req.user._id,
    }], { session });

    // 📘 Ledger Entry
    await StockMovement.create([{
      materialType: "FinishedFabric",
      lotNumber,
      movementType: "OUT",
      module: "Sale",
      quantity: qty,
      previousStock: stockBefore.quantity,
      newStock: stockAfter.quantity,
      referenceId: sale._id,
      performedBy: req.user._id,
    }], { session });

    await LedgerEntry.create(
      [
        {
          entryType: "SalesInvoice",
          partyType: "Customer",
          partyName: customerDoc?.customerName || "Customer",
          referenceType: "Sales",
          referenceId: sale._id,
          taxableAmount: totalAmount,
          gstAmount: 0,
          amount: totalAmount,
          debit: 0,
          credit: totalAmount,
          status: "Pending",
          notes: `Auto entry from sales ${lotNumber}`,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: sale,
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

// ✅ Get Sales
export const getSales = async (req, res) => {
  try {
    const totalRecords = await Sales.countDocuments();

    const features = new QueryFeatures(Sales, req.query)
      .filter()
      .search(["lotNumber"])
      .sort()
      .paginate();

    const sales = await features.query
      .populate("customer", "customerName phone")
      .populate("soldBy", "name");

    res.json({
      success: true,
      data: sales,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete All Sales (Admin Only)
export const deleteAllSales = async (req, res) => {
  try {
    await Sales.deleteMany();
    res.json({
      success: true,
      message: "All sales records deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
