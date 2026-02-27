import mongoose from "mongoose";

const salesOrderItemSchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      enum: ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      enum: ["kg", "meter"],
      default: "meter",
    },
    ratePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    plannedLotNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    items: {
      type: [salesOrderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one order item is required",
      },
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Confirmed",
        "InProduction",
        "ReadyForDispatch",
        "Dispatched",
        "Completed",
        "Cancelled",
      ],
      default: "Confirmed",
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

salesOrderSchema.pre("validate", function (next) {
  const items = this.items || [];
  this.totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  this.totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.ratePerUnit || 0),
    0
  );
  next();
});

const SalesOrder = mongoose.model("SalesOrder", salesOrderSchema);
export default SalesOrder;
