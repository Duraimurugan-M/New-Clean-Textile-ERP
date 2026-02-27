import LedgerEntry from "../models/LedgerEntry.js";
import QueryFeatures from "../utils/queryFeatures.js";
import { textLinesToSimplePdfBuffer, toCsv } from "../utils/exportUtils.js";

export const createLedgerEntry = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id,
    };

    if (Number(payload.amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const entry = await LedgerEntry.create(payload);
    return res.status(201).json({
      success: true,
      message: "Ledger entry created successfully",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLedgerEntries = async (req, res) => {
  try {
    const totalRecords = await LedgerEntry.countDocuments();
    const features = new QueryFeatures(LedgerEntry, req.query)
      .filter()
      .search(["entryType", "partyName", "status", "referenceType"])
      .sort()
      .paginate();

    const entries = await features.query.populate("createdBy", "name");
    return res.json({
      success: true,
      data: entries,
      currentPage: features.page,
      totalPages: Math.ceil(totalRecords / features.limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLedgerByType = async (req, res, entryTypes) => {
  try {
    const base = { entryType: { $in: entryTypes } };
    const search = String(req.query.search || "").trim();
    if (search) {
      base.$or = [
        { partyName: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const totalRecords = await LedgerEntry.countDocuments(base);
    const entries = await LedgerEntry.find(base)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name");

    return res.json({
      success: true,
      data: entries,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPurchaseLedger = async (req, res) =>
  getLedgerByType(req, res, ["PurchaseInvoice", "PaymentPaid", "GST"]);

export const getSalesLedger = async (req, res) =>
  getLedgerByType(req, res, ["SalesInvoice", "PaymentReceived", "GST"]);

export const getExpenseLedger = async (req, res) => getLedgerByType(req, res, ["Expense"]);

export const updateLedgerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const entry = await LedgerEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Ledger entry not found" });

    if (status) entry.status = status;
    if (notes !== undefined) entry.notes = notes;
    await entry.save();

    return res.json({ success: true, data: entry });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAccountsSummary = async (req, res) => {
  try {
    const grouped = await LedgerEntry.aggregate([
      {
        $group: {
          _id: "$entryType",
          totalAmount: { $sum: "$amount" },
          totalDebit: { $sum: "$debit" },
          totalCredit: { $sum: "$credit" },
          totalGST: { $sum: "$gstAmount" },
        },
      },
    ]);

    const pendingPayablesAgg = await LedgerEntry.aggregate([
      { $match: { status: { $in: ["Pending", "PartiallyPaid"] }, entryType: "PurchaseInvoice" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingReceivablesAgg = await LedgerEntry.aggregate([
      { $match: { status: { $in: ["Pending", "PartiallyPaid"] }, entryType: "SalesInvoice" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.json({
      success: true,
      data: {
        grouped,
        pendingPayables: pendingPayablesAgg[0]?.total || 0,
        pendingReceivables: pendingReceivablesAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportLedger = async (req, res) => {
  try {
    const format = String(req.query.format || "excel").toLowerCase();
    const type = String(req.query.type || "all").toLowerCase();

    const typeMap = {
      all: [],
      purchase: ["PurchaseInvoice", "PaymentPaid", "GST"],
      sales: ["SalesInvoice", "PaymentReceived", "GST"],
      expense: ["Expense"],
    };
    const filterTypes = typeMap[type] || [];
    const query = filterTypes.length ? { entryType: { $in: filterTypes } } : {};
    const rows = await LedgerEntry.find(query).sort({ createdAt: -1 }).limit(1000).lean();

    if (format === "pdf") {
      const lines = rows.map(
        (row) =>
          `${new Date(row.entryDate).toLocaleDateString()} | ${row.entryType} | ${row.partyName || "N/A"} | ${row.amount} | ${row.status}`
      );
      const buffer = textLinesToSimplePdfBuffer("Ledger Export", lines);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${type}-ledger.pdf\"`);
      return res.send(buffer);
    }

    const csv = toCsv(rows, [
      { key: "entryDate", label: "Date", value: (row) => new Date(row.entryDate).toISOString() },
      { key: "entryType", label: "Entry Type" },
      { key: "partyType", label: "Party Type" },
      { key: "partyName", label: "Party Name" },
      { key: "amount", label: "Amount" },
      { key: "gstAmount", label: "GST" },
      { key: "status", label: "Status" },
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=\"${type}-ledger.csv\"`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
