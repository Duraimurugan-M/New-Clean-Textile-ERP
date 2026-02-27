import Inventory from "../models/Inventory.js";

import {
  addStock
} from "../services/inventoryService.js";

// ➕ Add Stock
export const createStock = async (req, res) => {
  try {
    const stock = await addStock({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: stock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📦 Get All Stock
export const getInventory = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const page = Number(queryObj.page) || 1;
    const limit = Number(queryObj.limit) || 10;
    const sortBy = queryObj.sortBy || "createdAt";
    const order = queryObj.order === "asc" ? 1 : -1;
    const search = String(queryObj.search || "").trim();

    delete queryObj.page;
    delete queryObj.limit;
    delete queryObj.sortBy;
    delete queryObj.order;
    delete queryObj.search;

    if (queryObj.lowStock !== undefined) {
      delete queryObj.lowStock;
      queryObj.quantity = { $lt: 50 };
    }

    const filters = { ...queryObj };
    if (search) {
      filters.lotNumber = { $regex: search, $options: "i" };
    }

    const totalRecords = await Inventory.countDocuments(filters);
    const inventory = await Inventory.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: inventory,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➖ Reduce Stock
export const consumeStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    const stock = await Inventory.findById(id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (stock.quantity < qty) {
      return res
        .status(400)
        .json({ message: `Insufficient stock. Available: ${stock.quantity}` });
    }

    stock.quantity -= qty;
    if (stock.quantity === 0) {
      stock.status = "Consumed";
    }

    const updatedStock = await stock.save();

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: updatedStock,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🧹 Delete All Stock (For Development/Testing)
export const deleteAllStock = async (req, res) => {
  try {
    await Inventory.deleteMany();
    res.status(200).json({
      success: true,
      message: "All stock deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
