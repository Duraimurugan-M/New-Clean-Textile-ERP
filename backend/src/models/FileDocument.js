import mongoose from "mongoose";

const fileDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["PurchaseBill", "SalesBill", "DispatchBill", "QCReport", "Other"],
      default: "Other",
    },
    relatedModule: {
      type: String,
      enum: ["Purchase", "Sales", "Dispatch", "QC", "Inventory", "General"],
      default: "General",
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      default: "",
    },
    resourceType: {
      type: String,
      default: "raw",
    },
    bytes: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const FileDocument = mongoose.model("FileDocument", fileDocumentSchema);

export default FileDocument;
