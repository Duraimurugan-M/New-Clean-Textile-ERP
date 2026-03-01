import mongoose from "mongoose";

const bomItemSchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric", "Chemical", "Other"],
      required: true,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    unit: {
      type: String,
      trim: true,
      default: "kg",
    },
    wastagePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    processStage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const bomSchema = new mongoose.Schema(
  {
    bomCode: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productCode: {
      type: String,
      trim: true,
      default: "",
    },
    outputMaterialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },
    outputQuantityPerBatch: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [bomItemSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one BOM item is required",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

bomSchema.index({ bomCode: 1, version: 1 }, { unique: true });

const BOM = mongoose.model("BOM", bomSchema);
export default BOM;
