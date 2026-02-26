import Inventory from "../models/Inventory.js";

import {
  addStock,
  getAllStock
} from "../services/inventoryService.js";

import QueryFeatures from "../utils/queryFeatures.js";

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
    const totalRecords = await Inventory.countDocuments();

    const features = new QueryFeatures(Inventory, req.query)
      .filter()
      .search(["lotNumber"])
      .sort()
      .paginate();

    const inventory = await features.query;

    res.json({
      success: true,
      data: inventory,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
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
