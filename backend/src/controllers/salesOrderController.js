import SalesOrder from "../models/SalesOrder.js";
import QueryFeatures from "../utils/queryFeatures.js";

export const createSalesOrder = async (req, res) => {
  try {
    const { orderNumber, customer, deliveryDate, items, notes, status } = req.body;

    if (!orderNumber || !customer || !deliveryDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const existingOrder = await SalesOrder.findOne({ orderNumber });
    if (existingOrder) {
      return res.status(400).json({ message: "Order number already exists" });
    }

    const order = await SalesOrder.create({
      orderNumber,
      customer,
      deliveryDate,
      items,
      notes,
      status: status || "Confirmed",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Sales order created successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSalesOrders = async (req, res) => {
  try {
    const totalRecords = await SalesOrder.countDocuments();
    const features = new QueryFeatures(SalesOrder, req.query)
      .filter()
      .search(["orderNumber", "status"])
      .sort()
      .paginate();

    const orders = await features.query
      .populate("customer", "customerName phone")
      .populate("createdBy", "name");

    return res.json({
      success: true,
      data: orders,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateSalesOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryDate, notes } = req.body;

    const order = await SalesOrder.findById(id);
    if (!order) return res.status(404).json({ message: "Sales order not found" });

    if (status) order.status = status;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (notes !== undefined) order.notes = notes;
    await order.save();

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
