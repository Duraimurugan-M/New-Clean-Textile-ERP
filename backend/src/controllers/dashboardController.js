import Inventory from "../models/Inventory.js";
import Production from "../models/Production.js";
import Sales from "../models/Sales.js";
import QC from "../models/QC.js";

export const getDashboardData = async (req, res) => {
  try {

    /* ================= RANGE LOGIC ================= */

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

    /* ================= KPI SECTION ================= */

    // 1️⃣ Total Stock Quantity
    const totalStockAgg = await Inventory.aggregate([
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
    ]);

    const totalStockQuantity =
      totalStockAgg.length > 0 ? totalStockAgg[0].totalQuantity : 0;

    // 2️⃣ Total Stock Value
    const totalStockValueAgg = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$quantity", 0] },
                { $ifNull: ["$ratePerUnit", 0] },
              ],
            },
          },
        },
      },
    ]);

    const totalStockValue =
      totalStockValueAgg.length > 0 ? totalStockValueAgg[0].totalValue : 0;

    // 3️⃣ Today's Production
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayProductionCount = await Production.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    // 4️⃣ Today's Sales
    const todaySalesAgg = await Sales.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);

    const todaySalesAmount =
      todaySalesAgg.length > 0 ? todaySalesAgg[0].totalSales : 0;

    // 5️⃣ Low Stock
    const lowStockCount = await Inventory.countDocuments({
      quantity: { $lt: 50 },
    });

    // 6️⃣ QC Pending
    const qcPendingCount = await QC.countDocuments({
      status: { $ne: "Approved" },
    });

    /* ================= TOP CUSTOMERS ================= */

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

    /* ================= SALES CHART ================= */

    const monthlySales = await Sales.aggregate([
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      data: {
        totalStockQuantity,
        totalStockValue,
        todayProductionCount,
        todaySalesAmount,
        lowStockCount,
        qcPendingCount,
        topCustomers,
        monthlySales,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
