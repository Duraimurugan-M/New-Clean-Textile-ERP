import ProductionPlan from "../models/ProductionPlan.js";
import SalesOrder from "../models/SalesOrder.js";
import QueryFeatures from "../utils/queryFeatures.js";

export const createProductionPlan = async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    if (!payload.planNumber || !payload.processType || !payload.machineCode || !payload.planDate) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const existing = await ProductionPlan.findOne({ planNumber: payload.planNumber });
    if (existing) return res.status(400).json({ message: "Plan number already exists" });

    const plan = await ProductionPlan.create(payload);

    if (payload.salesOrder) {
      await SalesOrder.findByIdAndUpdate(payload.salesOrder, { status: "InProduction" });
    }

    return res.status(201).json({
      success: true,
      message: "Production plan created successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductionPlans = async (req, res) => {
  try {
    const totalRecords = await ProductionPlan.countDocuments();
    const features = new QueryFeatures(ProductionPlan, req.query)
      .filter()
      .search(["planNumber", "processType", "machineCode", "status"])
      .sort()
      .paginate();

    const data = await features.query
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

export const updateProductionPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const plan = await ProductionPlan.findById(id);
    if (!plan) return res.status(404).json({ message: "Production plan not found" });

    if (status) plan.status = status;
    if (notes !== undefined) plan.notes = notes;
    await plan.save();

    return res.json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
