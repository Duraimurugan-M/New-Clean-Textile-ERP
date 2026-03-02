import mongoose from "mongoose";
import Dispatch from "../models/Dispatch.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import SalesOrder from "../models/SalesOrder.js";
import { deductStock } from "../services/inventoryService.js";
import QueryFeatures from "../utils/queryFeatures.js";
import QC from "../models/QC.js";

export const createDispatch = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      dispatchNumber,
      salesOrder,
      customer,
      materialType,
      lotNumber,
      quantity,
      unit,
      packingListNo,
      transportName,
      vehicleNumber,
      ewayBillNumber,
      dispatchDate,
      expectedDeliveryDate,
      notes,
    } = req.body;

    const qty = Number(quantity);
    if (!dispatchNumber || !customer || !lotNumber || qty <= 0) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    session.startTransaction();

    const existingDispatch = await Dispatch.findOne({ dispatchNumber }).session(session);
    if (existingDispatch) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Dispatch number already exists" });
    }

    const mType = materialType || "FinishedFabric";
    if (mType === "FinishedFabric") {
      const qcRecord = await QC.findOne({ lotNumber }).sort({ createdAt: -1 }).session(session);
      if (!qcRecord || qcRecord.status !== "Approved") {
        await session.abortTransaction();
        return res.status(400).json({ message: "Dispatch allowed only for QC-approved finished lot" });
      }
    }
    const stockBefore = await Inventory.findOne({
      materialType: mType,
      lotNumber,
      status: "Available",
    }).session(session);

    if (!stockBefore) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Dispatch lot not found in inventory" });
    }
    if (stockBefore.quantity < qty) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: `Insufficient stock. Available: ${stockBefore.quantity}` });
    }

    await deductStock({
      materialType: mType,
      lotNumber,
      quantity: qty,
      session,
    });

    const stockAfter = await Inventory.findOne({ materialType: mType, lotNumber }).session(session);

    const [dispatchRecord] = await Dispatch.create(
      [
        {
          dispatchNumber,
          salesOrder: salesOrder || undefined,
          customer,
          materialType: mType,
          lotNumber,
          quantity: qty,
          unit: unit || stockBefore.unit || "meter",
          packingListNo,
          transportName,
          vehicleNumber,
          ewayBillNumber,
          dispatchDate,
          expectedDeliveryDate,
          notes,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await StockMovement.create(
      [
        {
          materialType: mType,
          lotNumber,
          movementType: "OUT",
          module: "Dispatch",
          quantity: qty,
          previousStock: stockBefore.quantity,
          newStock: stockAfter.quantity,
          referenceId: dispatchRecord._id,
          performedBy: req.user._id,
        },
      ],
      { session }
    );

    if (salesOrder) {
      await SalesOrder.findByIdAndUpdate(salesOrder, { status: "Dispatched" }).session(session);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Dispatch created successfully",
      data: dispatchRecord,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getDispatches = async (req, res) => {
  try {
    const totalRecords = await Dispatch.countDocuments();
    const features = new QueryFeatures(Dispatch, req.query)
      .filter()
      .search(["dispatchNumber", "lotNumber", "vehicleNumber", "status"])
      .sort()
      .paginate();

    const data = await features.query
      .populate("customer", "customerName phone")
      .populate("salesOrder", "orderNumber status")
      .populate("createdBy", "name");

    return res.json({
      success: true,
      data,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateDispatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveredAt, notes } = req.body;

    const dispatchRecord = await Dispatch.findById(id);
    if (!dispatchRecord) return res.status(404).json({ message: "Dispatch not found" });

    if (status) dispatchRecord.status = status;
    if (deliveredAt) dispatchRecord.deliveredAt = deliveredAt;
    if (notes !== undefined) dispatchRecord.notes = notes;
    if (status === "Delivered" && !dispatchRecord.deliveredAt) {
      dispatchRecord.deliveredAt = new Date();
    }
    await dispatchRecord.save();

    return res.json({ success: true, data: dispatchRecord });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
