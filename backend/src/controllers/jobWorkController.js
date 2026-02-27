import mongoose from "mongoose";
import JobWork from "../models/JobWork.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import QueryFeatures from "../utils/queryFeatures.js";

const updateWastage = (jobWork) => {
  const wastageQuantity = Number((jobWork.issueQuantity - jobWork.receivedQuantity).toFixed(2));
  const wastagePercentage =
    jobWork.issueQuantity > 0
      ? Number(((wastageQuantity / jobWork.issueQuantity) * 100).toFixed(2))
      : 0;

  jobWork.wastageQuantity = Math.max(wastageQuantity, 0);
  jobWork.wastagePercentage = Math.max(wastagePercentage, 0);
  jobWork.pendingQuantity = Math.max(
    Number((jobWork.issueQuantity - jobWork.receivedQuantity).toFixed(2)),
    0
  );
};

export const createJobWorkIssue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      vendor,
      processType,
      materialType,
      lotNumber,
      issueQuantity,
      expectedReturnDate,
      notes,
    } = req.body;

    const qty = Number(issueQuantity);
    if (!vendor || !processType || !materialType || !lotNumber) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Issue quantity must be greater than 0" });
    }

    session.startTransaction();

    const stockBefore = await Inventory.findOne({
      materialType,
      lotNumber,
      status: "Available",
    }).session(session);

    if (!stockBefore) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Inventory lot not found" });
    }

    if (stockBefore.quantity < qty) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Insufficient stock. Available: ${stockBefore.quantity}`,
      });
    }

    stockBefore.quantity = Number((stockBefore.quantity - qty).toFixed(2));
    if (stockBefore.quantity === 0) {
      stockBefore.status = "Consumed";
    }
    await stockBefore.save({ session });

    const [jobWork] = await JobWork.create(
      [
        {
          vendor,
          processType,
          materialType,
          lotNumber,
          issueQuantity: qty,
          issueUnit: stockBefore.unit || "kg",
          expectedReturnDate,
          notes,
          issuedBy: req.user._id,
          status: "Issued",
          pendingQuantity: qty,
          receivedQuantity: 0,
        },
      ],
      { session }
    );

    await StockMovement.create(
      [
        {
          materialType,
          lotNumber,
          movementType: "OUT",
          module: "JobWork",
          quantity: qty,
          previousStock: Number((stockBefore.quantity + qty).toFixed(2)),
          newStock: stockBefore.quantity,
          referenceId: jobWork._id,
          performedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Job work issued successfully",
      data: jobWork,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const receiveJobWork = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const {
      receivedQuantity,
      receivedMaterialType,
      receivedLotNumber,
      location,
      notes,
    } = req.body;

    const qty = Number(receivedQuantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Received quantity must be greater than 0" });
    }

    session.startTransaction();

    const jobWork = await JobWork.findById(id).session(session);
    if (!jobWork) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Job work record not found" });
    }

    if (jobWork.status === "Received") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Job work already fully received" });
    }

    if (qty > jobWork.pendingQuantity) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Received quantity cannot exceed pending quantity (${jobWork.pendingQuantity})`,
      });
    }

    const finalMaterialType = receivedMaterialType || jobWork.materialType;
    const finalLotNumber = receivedLotNumber || jobWork.lotNumber;

    let stock = await Inventory.findOne({
      materialType: finalMaterialType,
      lotNumber: finalLotNumber,
    }).session(session);

    let previousStock = 0;
    if (stock) {
      previousStock = stock.quantity;
      stock.quantity = Number((stock.quantity + qty).toFixed(2));
      stock.status = "Available";
      await stock.save({ session });
    } else {
      const [createdStock] = await Inventory.create(
        [
          {
            materialType: finalMaterialType,
            lotNumber: finalLotNumber,
            quantity: qty,
            unit: jobWork.issueUnit,
            location: location || "Job Work Return",
            status: "Available",
            createdBy: req.user._id,
          },
        ],
        { session }
      );
      stock = createdStock;
    }

    jobWork.receivedQuantity = Number((jobWork.receivedQuantity + qty).toFixed(2));
    jobWork.pendingQuantity = Number((jobWork.issueQuantity - jobWork.receivedQuantity).toFixed(2));
    jobWork.status = jobWork.pendingQuantity === 0 ? "Received" : "PartiallyReceived";
    jobWork.receiveDate = new Date();
    jobWork.receivedBy = req.user._id;
    if (notes) jobWork.notes = notes;
    updateWastage(jobWork);
    await jobWork.save({ session });

    await StockMovement.create(
      [
        {
          materialType: finalMaterialType,
          lotNumber: finalLotNumber,
          movementType: "IN",
          module: "JobWork",
          quantity: qty,
          previousStock,
          newStock: stock.quantity,
          referenceId: jobWork._id,
          performedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Job work received successfully",
      data: jobWork,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getJobWorks = async (req, res) => {
  try {
    const totalRecords = await JobWork.countDocuments();

    const features = new QueryFeatures(JobWork, req.query)
      .filter()
      .search(["lotNumber", "processType", "status"])
      .sort()
      .paginate();

    const jobWorks = await features.query
      .populate("vendor", "vendorName jobType status")
      .populate("issuedBy", "name")
      .populate("receivedBy", "name");

    res.json({
      success: true,
      data: jobWorks,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
