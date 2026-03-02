import QC from "../models/QC.js";
import Inventory from "../models/Inventory.js";

export const createQC = async (req, res) => {
  try {
    const {
      lotNumber,
      gsm,
      width,
      shrinkage,
      defectPercentage,
      grade,
      status,
    } = req.body;

    // 🔍 Check lot exists
    const inventoryLot = await Inventory.findOne({
      lotNumber,
      materialType: "FinishedFabric",
    });

    if (!inventoryLot)
      return res.status(404).json({ message: "Lot not found" });

    // 🔒 Check QC already done
    const existingQC = await QC.findOne({ lotNumber });
    if (existingQC)
      return res.status(400).json({ message: "QC already completed for this lot" });

    const qc = await QC.create({
      lotNumber,
      materialType: "FinishedFabric",
      gsm,
      width,
      shrinkage,
      defectPercentage,
      grade,
      status,
      inspectedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "QC completed successfully",
      data: qc,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQCRecords = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const page = Number(queryObj.page) || 1;
    const limit = Number(queryObj.limit) || 10;
    const sortBy = queryObj.sortBy || "createdAt";
    const order = queryObj.order === "asc" ? 1 : -1;
    const search = String(queryObj.search || "").trim();
    const requestedStatus = queryObj.status;

    const filters = {};
    if (requestedStatus && requestedStatus !== "Pending") {
      filters.status = requestedStatus;
    }
    if (search) {
      filters.$or = [
        { lotNumber: { $regex: search, $options: "i" } },
        { grade: { $regex: search, $options: "i" } },
      ];
    }

    if (requestedStatus === "Pending") {
      const qcNonApproved = await QC.find({ status: { $ne: "Approved" } })
        .sort({ [sortBy]: order })
        .populate("inspectedBy", "name")
        .lean();

      const inventoryLots = await Inventory.find({
        materialType: "FinishedFabric",
        quantity: { $gt: 0 },
      })
        .select("lotNumber materialType createdAt")
        .lean();

      const qcAllLots = new Set((await QC.find().select("lotNumber").lean()).map((q) => q.lotNumber));
      const noQcPending = inventoryLots
        .filter((lot) => !qcAllLots.has(lot.lotNumber))
        .map((lot) => ({
          _id: `pending-${lot.lotNumber}`,
          lotNumber: lot.lotNumber,
          materialType: "FinishedFabric",
          status: "Pending",
          grade: "-",
          gsm: 0,
          width: 0,
          shrinkage: 0,
          defectPercentage: 0,
          createdAt: lot.createdAt,
          inspectedBy: null,
        }));

      let merged = [...qcNonApproved, ...noQcPending];
      if (search) {
        const regex = new RegExp(search, "i");
        merged = merged.filter((row) => regex.test(row.lotNumber) || regex.test(row.grade || ""));
      }

      merged.sort((a, b) => {
        const aRaw = a[sortBy] ?? a.createdAt ?? "";
        const bRaw = b[sortBy] ?? b.createdAt ?? "";
        const aDate = new Date(aRaw);
        const bDate = new Date(bRaw);
        const bothDateValid = !Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime());
        if (bothDateValid) {
          return order === 1 ? aDate - bDate : bDate - aDate;
        }
        const aStr = String(aRaw).toLowerCase();
        const bStr = String(bRaw).toLowerCase();
        if (aStr < bStr) return order === 1 ? -1 : 1;
        if (aStr > bStr) return order === 1 ? 1 : -1;
        return 0;
      });

      const totalRecords = merged.length;
      const paged = merged.slice((page - 1) * limit, (page - 1) * limit + limit);
      return res.json({
        success: true,
        data: paged,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
      });
    }

    const totalRecords = await QC.countDocuments(filters);
    const qc = await QC.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("inspectedBy", "name");

    res.json({
      success: true,
      data: qc,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete all qc rocords (Dev only)
export const deleteQCRecords = async (req, res) => {
  try {
    await QC.deleteMany();
    res.json({ success: true, message: "All QC records deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
