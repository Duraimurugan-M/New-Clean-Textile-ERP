import BOM from "../models/BOM.js";
import Inventory from "../models/Inventory.js";
import QueryFeatures from "../utils/queryFeatures.js";

const normalizeItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      materialType: item.materialType,
      materialName: String(item.materialName || "").trim(),
      quantity: Number(item.quantity),
      unit: String(item.unit || "kg").trim(),
      wastagePercentage: Number(item.wastagePercentage || 0),
      processStage: String(item.processStage || "").trim(),
    }));

const hasInvalidItems = (items = []) =>
  items.some(
    (item) =>
      !item.materialType ||
      !item.materialName ||
      Number.isNaN(item.quantity) ||
      item.quantity <= 0 ||
      !item.unit
  );

export const createBOM = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      bomCode: String(req.body.bomCode || "").trim(),
      productName: String(req.body.productName || "").trim(),
      productCode: String(req.body.productCode || "").trim(),
      version: Number(req.body.version || 1),
      outputQuantityPerBatch: Number(req.body.outputQuantityPerBatch),
      items: normalizeItems(req.body.items),
      createdBy: req.user._id,
    };

    if (!payload.bomCode || !payload.productName || !payload.outputMaterialType) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (!payload.effectiveFrom) {
      return res.status(400).json({ message: "Effective from date is required" });
    }

    if (payload.items.length === 0) {
      return res.status(400).json({ message: "At least one BOM item is required" });
    }
    if (hasInvalidItems(payload.items)) {
      return res.status(400).json({ message: "Each BOM item must have material type, name, quantity and unit" });
    }

    const existing = await BOM.findOne({ bomCode: payload.bomCode, version: payload.version });
    if (existing) return res.status(400).json({ message: "BOM code and version already exists" });

    const bom = await BOM.create(payload);
    return res.status(201).json({
      success: true,
      message: "BOM created successfully",
      data: bom,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBOMs = async (req, res) => {
  try {
    const totalRecords = await BOM.countDocuments();
    const features = new QueryFeatures(BOM, req.query)
      .filter()
      .search(["bomCode", "productName", "productCode", "status"])
      .sort()
      .paginate();

    const data = await features.query.populate("createdBy", "name");

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

export const getBOMById = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id).populate("createdBy", "name");
    if (!bom) return res.status(404).json({ message: "BOM not found" });
    return res.json({ success: true, data: bom });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateBOM = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id);
    if (!bom) return res.status(404).json({ message: "BOM not found" });

    const nextVersion =
      req.body.version !== undefined ? Number(req.body.version) : Number(bom.version || 1);

    const nextBomCode =
      req.body.bomCode !== undefined ? String(req.body.bomCode || "").trim() : bom.bomCode;

    const duplicate = await BOM.findOne({
      _id: { $ne: bom._id },
      bomCode: nextBomCode,
      version: nextVersion,
    });
    if (duplicate) return res.status(400).json({ message: "BOM code and version already exists" });

    if (req.body.bomCode !== undefined) bom.bomCode = nextBomCode;
    if (req.body.productName !== undefined) bom.productName = String(req.body.productName || "").trim();
    if (req.body.productCode !== undefined) bom.productCode = String(req.body.productCode || "").trim();
    if (req.body.outputMaterialType !== undefined) bom.outputMaterialType = req.body.outputMaterialType;
    if (req.body.outputQuantityPerBatch !== undefined) {
      bom.outputQuantityPerBatch = Number(req.body.outputQuantityPerBatch);
    }
    if (req.body.version !== undefined) bom.version = nextVersion;
    if (req.body.status !== undefined) bom.status = req.body.status;
    if (req.body.effectiveFrom !== undefined) bom.effectiveFrom = req.body.effectiveFrom;
    if (req.body.effectiveTo !== undefined) bom.effectiveTo = req.body.effectiveTo || null;
    if (req.body.notes !== undefined) bom.notes = String(req.body.notes || "").trim();

    if (req.body.items !== undefined) {
      const normalized = normalizeItems(req.body.items);
      if (normalized.length === 0) {
        return res.status(400).json({ message: "At least one BOM item is required" });
      }
      if (hasInvalidItems(normalized)) {
        return res.status(400).json({ message: "Each BOM item must have material type, name, quantity and unit" });
      }
      bom.items = normalized;
    }

    await bom.save();
    return res.json({
      success: true,
      message: "BOM updated successfully",
      data: bom,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateBOMStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const bom = await BOM.findById(req.params.id);
    if (!bom) return res.status(404).json({ message: "BOM not found" });

    bom.status = status;
    await bom.save();

    return res.json({
      success: true,
      message: "BOM status updated successfully",
      data: bom,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const calculateBOMRequirement = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id).lean();
    if (!bom) return res.status(404).json({ message: "BOM not found" });

    const plannedQuantity = Number(req.body.plannedQuantity);
    if (!plannedQuantity || plannedQuantity <= 0) {
      return res.status(400).json({ message: "Planned quantity must be greater than 0" });
    }

    const baseOutput = Number(bom.outputQuantityPerBatch || 1);
    const multiplier = plannedQuantity / baseOutput;

    const inventoryByMaterial = await Inventory.aggregate([
      {
        $group: {
          _id: "$materialType",
          totalQty: { $sum: "$quantity" },
        },
      },
    ]);
    const inventoryMap = Object.fromEntries(
      inventoryByMaterial.map((row) => [row._id, Number(row.totalQty || 0)])
    );

    const requirements = (bom.items || []).map((item) => {
      const baseQty = Number(item.quantity || 0) * multiplier;
      const wastageQty = baseQty * (Number(item.wastagePercentage || 0) / 100);
      const requiredQty = Number((baseQty + wastageQty).toFixed(4));
      const availableQty = Number((inventoryMap[item.materialType] || 0).toFixed(4));
      const shortageQty = Number(Math.max(requiredQty - availableQty, 0).toFixed(4));
      return {
        materialType: item.materialType,
        materialName: item.materialName,
        unit: item.unit,
        processStage: item.processStage || "",
        baseQty: Number(baseQty.toFixed(4)),
        wastageQty: Number(wastageQty.toFixed(4)),
        requiredQty,
        availableQty,
        shortageQty,
      };
    });

    const totalRequiredQty = requirements.reduce((sum, row) => sum + row.requiredQty, 0);
    const totalShortageQty = requirements.reduce((sum, row) => sum + row.shortageQty, 0);

    return res.json({
      success: true,
      data: {
        bomId: bom._id,
        bomCode: bom.bomCode,
        productName: bom.productName,
        outputMaterialType: bom.outputMaterialType,
        outputQuantityPerBatch: bom.outputQuantityPerBatch,
        plannedQuantity,
        multiplier: Number(multiplier.toFixed(4)),
        requirements,
        summary: {
          totalRequiredQty: Number(totalRequiredQty.toFixed(4)),
          totalShortageQty: Number(totalShortageQty.toFixed(4)),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
