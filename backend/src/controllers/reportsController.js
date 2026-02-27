import Production from "../models/Production.js";
import Inventory from "../models/Inventory.js";
import JobWork from "../models/JobWork.js";
import Sales from "../models/Sales.js";
import LedgerEntry from "../models/LedgerEntry.js";
import { textLinesToSimplePdfBuffer, toCsv } from "../utils/exportUtils.js";

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getOperationalReport = async (req, res) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const createdAtFilter = {};
    if (from) createdAtFilter.$gte = from;
    if (to) createdAtFilter.$lte = to;

    const match = Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {};

    const [productionAgg] = await Production.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInput: { $sum: "$inputQuantity" },
          totalOutput: { $sum: "$outputQuantity" },
          avgEfficiency: { $avg: "$efficiencyPercentage" },
          avgWastage: { $avg: "$wastagePercentage" },
        },
      },
    ]);

    const inventoryAgg = await Inventory.aggregate([
      {
        $group: {
          _id: "$materialType",
          totalQty: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$ratePerUnit"] } },
        },
      },
    ]);

    const jobWorkAgg = await JobWork.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgWastage: { $avg: "$wastagePercentage" },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        production: productionAgg || {
          totalInput: 0,
          totalOutput: 0,
          avgEfficiency: 0,
          avgWastage: 0,
        },
        inventory: inventoryAgg,
        jobWork: jobWorkAgg,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProfitReport = async (req, res) => {
  try {
    const [salesAgg] = await Sales.aggregate([
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);
    const [purchaseAgg] = await LedgerEntry.aggregate([
      { $match: { entryType: "PurchaseInvoice" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    const [expenseAgg] = await LedgerEntry.aggregate([
      { $match: { entryType: "Expense" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);

    const revenue = salesAgg?.revenue || 0;
    const purchaseCost = purchaseAgg?.amount || 0;
    const expenseCost = expenseAgg?.amount || 0;
    const profit = revenue - purchaseCost - expenseCost;
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;

    return res.json({
      success: true,
      data: {
        revenue,
        purchaseCost,
        expenseCost,
        profit,
        margin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportOperationsReport = async (req, res) => {
  try {
    const format = String(req.query.format || "excel").toLowerCase();
    const inventoryRows = await Inventory.find().lean();
    const prodRows = await Production.find().sort({ createdAt: -1 }).limit(500).lean();

    if (format === "pdf") {
      const lines = [
        `Inventory Rows: ${inventoryRows.length}`,
        ...inventoryRows.slice(0, 30).map((row) => `${row.materialType} | ${row.lotNumber} | Qty:${row.quantity}`),
        "-----",
        ...prodRows.slice(0, 30).map((row) => `${row.processType || "Other"} | ${row.inputLotNumber} -> ${row.outputLotNumber} | Eff:${row.efficiencyPercentage || 0}%`),
      ];
      const buffer = textLinesToSimplePdfBuffer("Operations Report", lines);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=\"operations-report.pdf\"");
      return res.send(buffer);
    }

    const csv = toCsv(inventoryRows, [
      { key: "materialType", label: "Material Type" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "ratePerUnit", label: "Rate/Unit" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"operations-report.csv\"");
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportProfitReport = async (req, res) => {
  try {
    const format = String(req.query.format || "excel").toLowerCase();
    const [salesAgg] = await Sales.aggregate([
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);
    const [purchaseAgg] = await LedgerEntry.aggregate([
      { $match: { entryType: "PurchaseInvoice" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    const [expenseAgg] = await LedgerEntry.aggregate([
      { $match: { entryType: "Expense" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);

    const row = {
      revenue: salesAgg?.revenue || 0,
      purchaseCost: purchaseAgg?.amount || 0,
      expenseCost: expenseAgg?.amount || 0,
    };
    row.profit = row.revenue - row.purchaseCost - row.expenseCost;
    row.margin = row.revenue > 0 ? Number(((row.profit / row.revenue) * 100).toFixed(2)) : 0;

    if (format === "pdf") {
      const lines = [
        `Revenue: ${row.revenue}`,
        `Purchase Cost: ${row.purchaseCost}`,
        `Expense Cost: ${row.expenseCost}`,
        `Profit: ${row.profit}`,
        `Margin %: ${row.margin}`,
      ];
      const buffer = textLinesToSimplePdfBuffer("Profit Report", lines);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=\"profit-report.pdf\"");
      return res.send(buffer);
    }

    const csv = toCsv([row], [
      { key: "revenue", label: "Revenue" },
      { key: "purchaseCost", label: "Purchase Cost" },
      { key: "expenseCost", label: "Expense Cost" },
      { key: "profit", label: "Profit" },
      { key: "margin", label: "Margin %" },
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"profit-report.csv\"");
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
