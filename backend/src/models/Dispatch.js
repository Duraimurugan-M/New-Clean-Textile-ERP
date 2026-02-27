import mongoose from "mongoose";

const dispatchSchema = new mongoose.Schema(
  {
    dispatchNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    materialType: {
      type: String,
      enum: ["FinishedFabric"],
      default: "FinishedFabric",
    },
    lotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      enum: ["meter", "kg"],
      default: "meter",
    },
    packingListNo: {
      type: String,
      trim: true,
    },
    transportName: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    ewayBillNumber: {
      type: String,
      trim: true,
    },
    dispatchDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Packed", "InTransit", "Delivered", "Cancelled"],
      default: "Packed",
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

const Dispatch = mongoose.model("Dispatch", dispatchSchema);
export default Dispatch;
