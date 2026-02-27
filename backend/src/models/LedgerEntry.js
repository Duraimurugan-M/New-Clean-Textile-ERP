import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema(
  {
    entryDate: {
      type: Date,
      default: Date.now,
    },
    entryType: {
      type: String,
      enum: [
        "PurchaseInvoice",
        "SalesInvoice",
        "Expense",
        "PaymentReceived",
        "PaymentPaid",
        "GST",
      ],
      required: true,
    },
    partyType: {
      type: String,
      enum: ["Customer", "Supplier", "Vendor", "Other"],
      default: "Other",
    },
    partyName: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ["Purchase", "Sales", "SalesOrder", "Dispatch", "Manual"],
      default: "Manual",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "PartiallyPaid", "Paid"],
      default: "Pending",
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

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
export default LedgerEntry;
