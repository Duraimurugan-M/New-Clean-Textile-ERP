import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      required: true,
    },
    lotNumber: {
      type: String,
      required: true,
    },
    movementType: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    module: {
      type: String,
      enum: ["Purchase", "Production", "Sale", "JobWork", "Beam", "Dispatch"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;
