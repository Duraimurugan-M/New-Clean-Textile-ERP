import mongoose from "mongoose";

const productionPlanSchema = new mongoose.Schema(
  {
    planNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
    },
    processType: {
      type: String,
      enum: ["Dyeing", "Bleaching", "Weaving", "Washing", "Finishing", "Beam", "Other"],
      required: true,
    },
    machineCode: {
      type: String,
      trim: true,
      required: true,
    },
    shift: {
      type: String,
      enum: ["A", "B", "C", "General"],
      default: "General",
    },
    planDate: {
      type: Date,
      required: true,
    },
    requiredMaterialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    plannedOutputMaterialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },
    plannedOutputQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    capacityHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Planned", "InProgress", "Completed", "Cancelled"],
      default: "Planned",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const ProductionPlan = mongoose.model("ProductionPlan", productionPlanSchema);
export default ProductionPlan;
