import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },

    lotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    ratePerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      default: "kg",
    },

    location: {
      type: String,
      default: "Main Warehouse",
    },

    status: {
      type: String,
      enum: ["Available", "Consumed", "Rejected", "InProcess"],
      default: "Available",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
