import mongoose from "mongoose";

const beamSchema = new mongoose.Schema(
  {
    beamNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sourceMaterialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn"],
      required: true,
    },
    sourceLotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    issueQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      default: "kg",
    },
    warpLengthMeters: {
      type: Number,
      min: 0,
      default: 0,
    },
    endsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    loomNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Created", "Assigned", "Consumed", "Cancelled"],
      default: "Created",
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

const Beam = mongoose.model("Beam", beamSchema);
export default Beam;
