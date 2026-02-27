import mongoose from "mongoose";
import Beam from "../models/Beam.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import QueryFeatures from "../utils/queryFeatures.js";

export const createBeam = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      beamNumber,
      sourceMaterialType,
      sourceLotNumber,
      issueQuantity,
      unit,
      warpLengthMeters,
      endsCount,
      loomNumber,
      notes,
    } = req.body;

    const qty = Number(issueQuantity);
    if (!beamNumber || !sourceMaterialType || !sourceLotNumber || qty <= 0) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    session.startTransaction();

    const existingBeam = await Beam.findOne({ beamNumber }).session(session);
    if (existingBeam) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Beam number already exists" });
    }

    const stockBefore = await Inventory.findOne({
      materialType: sourceMaterialType,
      lotNumber: sourceLotNumber,
      status: "Available",
    }).session(session);

    if (!stockBefore) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Source lot not found in inventory" });
    }
    if (stockBefore.quantity < qty) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: `Insufficient stock. Available: ${stockBefore.quantity}` });
    }

    stockBefore.quantity = Number((stockBefore.quantity - qty).toFixed(2));
    if (stockBefore.quantity === 0) {
      stockBefore.status = "Consumed";
    }
    await stockBefore.save({ session });

    const [beam] = await Beam.create(
      [
        {
          beamNumber,
          sourceMaterialType,
          sourceLotNumber,
          issueQuantity: qty,
          unit: unit || stockBefore.unit || "kg",
          warpLengthMeters: Number(warpLengthMeters || 0),
          endsCount: Number(endsCount || 0),
          loomNumber,
          notes,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await StockMovement.create(
      [
        {
          materialType: sourceMaterialType,
          lotNumber: sourceLotNumber,
          movementType: "OUT",
          module: "Beam",
          quantity: qty,
          previousStock: Number((stockBefore.quantity + qty).toFixed(2)),
          newStock: stockBefore.quantity,
          referenceId: beam._id,
          performedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Beam created successfully",
      data: beam,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getBeams = async (req, res) => {
  try {
    const totalRecords = await Beam.countDocuments();
    const features = new QueryFeatures(Beam, req.query)
      .filter()
      .search(["beamNumber", "sourceLotNumber", "loomNumber", "status"])
      .sort()
      .paginate();

    const beams = await features.query.populate("createdBy", "name");
    return res.json({
      success: true,
      data: beams,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateBeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, loomNumber, notes } = req.body;

    const beam = await Beam.findById(id);
    if (!beam) return res.status(404).json({ message: "Beam not found" });

    if (status) beam.status = status;
    if (loomNumber !== undefined) beam.loomNumber = loomNumber;
    if (notes !== undefined) beam.notes = notes;

    await beam.save();
    return res.json({ success: true, data: beam });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
