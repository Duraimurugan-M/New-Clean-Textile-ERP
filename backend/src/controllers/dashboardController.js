import Inventory from "../models/Inventory.js";
import Production from "../models/Production.js";
import Sales from "../models/Sales.js";
import QC from "../models/QC.js";
import SalesOrder from "../models/SalesOrder.js";
import JobWork from "../models/JobWork.js";

export const getDashboardData = async (req, res) => {
  try {
    const range = req.query.range || "monthly";

    let groupFormat;
    if (range === "daily") {
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    } else if (range === "weekly") {
      groupFormat = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      };
    } else if (range === "yearly") {
      groupFormat = {
        year: { $year: "$createdAt" },
      };
    } else {
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    }

    const totalStockAgg = await Inventory.aggregate([
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
    ]);
    const totalStockQuantity = totalStockAgg[0]?.totalQuantity || 0;

    const totalStockValueAgg = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$ratePerUnit", 0] }],
            },
          },
        },
      },
    ]);
    const totalStockValue = totalStockValueAgg[0]?.totalValue || 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayProductionCount = await Production.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    const todaySalesAgg = await Sales.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const todaySalesAmount = todaySalesAgg[0]?.totalSales || 0;

    const lowStockCount = await Inventory.countDocuments({ quantity: { $lt: 50 } });
    const qcPendingCount = await QC.countDocuments({ status: { $ne: "Approved" } });
    const totalOrders = await SalesOrder.countDocuments();
    const pendingJobWorkCount = await JobWork.countDocuments({
      status: { $in: ["Issued", "PartiallyReceived"] },
    });
    const yarnStockAlertCount = await Inventory.countDocuments({
      materialType: { $in: ["RawYarn", "DyedYarn"] },
      quantity: { $lt: 50 },
    });

    const [productionHealth] = await Production.aggregate([
      {
        $group: {
          _id: null,
          avgEfficiency: { $avg: "$efficiencyPercentage" },
          avgWastage: { $avg: "$wastagePercentage" },
        },
      },
    ]);

    const topCustomers = await Sales.aggregate([
      {
        $group: {
          _id: "$customer",
          totalPurchase: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          lastPurchase: { $max: "$createdAt" },
          mostProduct: { $first: "$materialType" },
        },
      },
      { $sort: { totalPurchase: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },
      {
        $project: {
          customerName: "$customerDetails.customerName",
          totalPurchase: 1,
          totalOrders: 1,
          lastPurchase: 1,
          mostProduct: 1,
        },
      },
    ]);

    const monthlySales = await Sales.aggregate([
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    const monthlyProduction = await Production.aggregate([
      {
        $group: {
          _id: groupFormat,
          totalOutput: { $sum: "$outputQuantity" },
          avgEfficiency: { $avg: "$efficiencyPercentage" },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    const topJobWorkers = await JobWork.aggregate([
      {
        $group: {
          _id: "$vendor",
          totalIssued: { $sum: "$issueQuantity" },
          totalReceived: { $sum: "$receivedQuantity" },
          avgWastage: { $avg: "$wastagePercentage" },
        },
      },
      { $sort: { totalReceived: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendorDetails",
        },
      },
      { $unwind: { path: "$vendorDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vendorName: "$vendorDetails.vendorName",
          totalIssued: 1,
          totalReceived: 1,
          avgWastage: { $round: ["$avgWastage", 2] },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalStockQuantity,
        totalStockValue,
        todayProductionCount,
        todaySalesAmount,
        lowStockCount,
        qcPendingCount,
        totalOrders,
        pendingJobWorkCount,
        yarnStockAlertCount,
        avgEfficiency: Number((productionHealth?.avgEfficiency || 0).toFixed(2)),
        avgWastage: Number((productionHealth?.avgWastage || 0).toFixed(2)),
        topCustomers,
        monthlySales,
        monthlyProduction,
        topJobWorkers,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
