import mongoose from "mongoose";

const jobWorkSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    processType: {
      type: String,
      enum: ["Dyeing", "Warping", "Sizing", "Finishing"],
      required: true,
    },
    materialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },
    lotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    issueQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    issueUnit: {
      type: String,
      default: "kg",
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    wastageQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    wastagePercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedReturnDate: {
      type: Date,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    receiveDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Issued", "PartiallyReceived", "Received"],
      default: "Issued",
    },
    notes: {
      type: String,
      trim: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const JobWork = mongoose.model("JobWork", jobWorkSchema);

export default JobWork;
