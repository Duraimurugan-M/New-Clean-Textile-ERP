import Production from "../models/Production.js";
import Inventory from "../models/Inventory.js";
import JobWork from "../models/JobWork.js";
import Sales from "../models/Sales.js";
import Purchase from "../models/Purchase.js";
import QC from "../models/QC.js";
import Dispatch from "../models/Dispatch.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Vendor from "../models/Vendor.js";
import SalesOrder from "../models/SalesOrder.js";
import ProductionPlan from "../models/ProductionPlan.js";
import Beam from "../models/Beam.js";
import BOM from "../models/BOM.js";
import StockMovement from "../models/StockMovement.js";
import LedgerEntry from "../models/LedgerEntry.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { textLinesToSimplePdfBuffer, toCsv } from "../utils/exportUtils.js";

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const fileTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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

const moduleConfigs = {
  purchase: {
    model: Purchase,
    populate: [{ path: "supplier", select: "supplierName" }],
    columns: [
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
      { key: "supplier", label: "Supplier", formatter: (row) => row.supplier?.supplierName || "-" },
      { key: "materialType", label: "Material" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "ratePerUnit", label: "Rate/Unit" },
      { key: "totalAmount", label: "Total Amount" },
    ],
  },
  sales: {
    model: Sales,
    populate: [{ path: "customer", select: "customerName" }],
    columns: [
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
      { key: "customer", label: "Customer", formatter: (row) => row.customer?.customerName || "-" },
      { key: "materialType", label: "Material" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "ratePerUnit", label: "Rate/Unit" },
      { key: "totalAmount", label: "Total Amount" },
    ],
  },
  inventory: {
    model: Inventory,
    columns: [
      { key: "materialType", label: "Material" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "unit", label: "Unit" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
  },
  production: {
    model: Production,
    columns: [
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
      { key: "processType", label: "Process" },
      { key: "inputLotNumber", label: "Input Lot" },
      { key: "outputLotNumber", label: "Output Lot" },
      { key: "inputQuantity", label: "Input Qty" },
      { key: "outputQuantity", label: "Output Qty" },
      { key: "efficiencyPercentage", label: "Efficiency %" },
    ],
  },
  qc: {
    model: QC,
    columns: [
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
      { key: "lotNumber", label: "Lot Number" },
      { key: "gsm", label: "GSM" },
      { key: "defectPercentage", label: "Defect %" },
      { key: "grade", label: "Grade" },
      { key: "status", label: "Status" },
    ],
  },
  dispatch: {
    model: Dispatch,
    populate: [{ path: "customer", select: "customerName" }],
    columns: [
      { key: "dispatchDate", label: "Dispatch Date", formatter: (row) => new Date(row.dispatchDate).toLocaleDateString() },
      { key: "dispatchNumber", label: "Dispatch No" },
      { key: "customer", label: "Customer", formatter: (row) => row.customer?.customerName || "-" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" },
    ],
  },
  jobwork: {
    model: JobWork,
    populate: [{ path: "vendor", select: "vendorName" }],
    columns: [
      { key: "issueDate", label: "Issue Date", formatter: (row) => new Date(row.issueDate).toLocaleDateString() },
      { key: "vendor", label: "Vendor", formatter: (row) => row.vendor?.vendorName || "-" },
      { key: "processType", label: "Process" },
      { key: "materialType", label: "Material" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "issueQuantity", label: "Issued Qty" },
      { key: "receivedQuantity", label: "Received Qty" },
      { key: "status", label: "Status" },
    ],
  },
  stockmovement: {
    model: StockMovement,
    columns: [
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
      { key: "module", label: "Module" },
      { key: "movementType", label: "Type" },
      { key: "materialType", label: "Material" },
      { key: "lotNumber", label: "Lot Number" },
      { key: "quantity", label: "Quantity" },
      { key: "newStock", label: "New Stock" },
    ],
  },
  customer: {
    model: Customer,
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "contactPerson", label: "Contact Person" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "isActive", label: "Active", formatter: (row) => (row.isActive ? "Yes" : "No") },
    ],
  },
  supplier: {
    model: Supplier,
    columns: [
      { key: "supplierName", label: "Supplier" },
      { key: "contactPerson", label: "Contact Person" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "isActive", label: "Active", formatter: (row) => (row.isActive ? "Yes" : "No") },
    ],
  },
  vendor: {
    model: Vendor,
    columns: [
      { key: "vendorName", label: "Vendor" },
      { key: "contactPerson", label: "Contact Person" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "jobType", label: "Job Type" },
      { key: "status", label: "Status" },
    ],
  },
  salesorder: {
    model: SalesOrder,
    populate: [{ path: "customer", select: "customerName" }],
    columns: [
      { key: "orderNumber", label: "Order No" },
      { key: "orderDate", label: "Order Date", formatter: (row) => new Date(row.orderDate).toLocaleDateString() },
      { key: "customer", label: "Customer", formatter: (row) => row.customer?.customerName || "-" },
      { key: "deliveryDate", label: "Delivery Date", formatter: (row) => new Date(row.deliveryDate).toLocaleDateString() },
      { key: "totalQuantity", label: "Quantity" },
      { key: "totalAmount", label: "Amount" },
      { key: "status", label: "Status" },
    ],
  },
  productionplan: {
    model: ProductionPlan,
    columns: [
      { key: "planNumber", label: "Plan No" },
      { key: "planDate", label: "Plan Date", formatter: (row) => new Date(row.planDate).toLocaleDateString() },
      { key: "processType", label: "Process" },
      { key: "machineCode", label: "Machine" },
      { key: "requiredMaterialType", label: "Material" },
      { key: "requiredQuantity", label: "Req Qty" },
      { key: "status", label: "Status" },
    ],
  },
  beam: {
    model: Beam,
    columns: [
      { key: "beamNumber", label: "Beam No" },
      { key: "sourceMaterialType", label: "Material" },
      { key: "sourceLotNumber", label: "Source Lot" },
      { key: "issueQuantity", label: "Issue Qty" },
      { key: "loomNumber", label: "Loom" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Date", formatter: (row) => new Date(row.createdAt).toLocaleDateString() },
    ],
  },
  bom: {
    model: BOM,
    columns: [
      { key: "bomCode", label: "BOM Code" },
      { key: "productName", label: "Product" },
      { key: "productCode", label: "Product Code" },
      { key: "outputMaterialType", label: "Output Material" },
      { key: "outputQuantityPerBatch", label: "Output Qty/Batch" },
      { key: "version", label: "Version" },
      { key: "status", label: "Status" },
      { key: "effectiveFrom", label: "Effective From", formatter: (row) => new Date(row.effectiveFrom).toLocaleDateString() },
    ],
  },
};

const getModuleRows = async (moduleKey, search, sortBy, order) => {
  const config = moduleConfigs[moduleKey];
  if (!config) return null;

  const query = {};
  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = config.columns
      .filter((col) => typeof col.key === "string")
      .slice(0, 4)
      .map((col) => ({ [col.key]: regex }));
  }

  let dbQuery = config.model.find(query).sort({ [sortBy || "createdAt"]: order === "asc" ? 1 : -1 }).limit(3000);
  (config.populate || []).forEach((p) => {
    dbQuery = dbQuery.populate(p);
  });
  const rows = await dbQuery.lean();

  return { config, rows };
};

const buildPdfBuffer = (title, columns, rows) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 32 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.rect(doc.page.margins.left, doc.page.margins.top, pageWidth, 66).fill("#0B5F87");
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(title, doc.page.margins.left + 10, doc.page.margins.top + 12);
    doc
      .fillColor("#EAF5FF")
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Generated: ${formatDateTime(new Date())}`,
        doc.page.margins.left + 10,
        doc.page.margins.top + 38
      );

    let y = doc.page.margins.top + 78;
    const colCount = columns.length;
    const colWidth = pageWidth / colCount;

    const drawHeader = () => {
      doc.rect(doc.page.margins.left, y, pageWidth, 20).fill("#E7F1FA");
      doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(8.5);
      columns.forEach((col, i) => {
        doc.text(col.label, doc.page.margins.left + i * colWidth + 3, y + 6, { width: colWidth - 6, ellipsis: true });
      });
      y += 20;
    };

    drawHeader();

    rows.forEach((row, idx) => {
      const rowHeight = 18;
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      if (idx % 2 === 0) doc.rect(doc.page.margins.left, y, pageWidth, rowHeight).fill("#F9FCFF");
      doc.fillColor("#1F2937").font("Helvetica").fontSize(8);
      columns.forEach((col, i) => {
        const value = col.formatter ? col.formatter(row) : row[col.key];
        doc.text(String(value ?? "-"), doc.page.margins.left + i * colWidth + 3, y + 5, { width: colWidth - 6, ellipsis: true });
      });
      y += rowHeight;
    });

    doc.end();
  });

const buildExcelBuffer = async (title, columns, rows) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Report");

  ws.mergeCells(1, 1, 1, columns.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5F87" } };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, columns.length);
  const generatedCell = ws.getCell(2, 1);
  generatedCell.value = `Generated on ${formatDateTime(new Date())}`;
  generatedCell.font = { size: 10, color: { argb: "FF334155" } };
  generatedCell.alignment = { horizontal: "left", vertical: "middle" };

  const headerRow = ws.getRow(4);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.label;
    cell.font = { bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F1FA" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  rows.forEach((row, idx) => {
    const values = columns.map((col) => (col.formatter ? col.formatter(row) : row[col.key]));
    const r = ws.addRow(values);
    r.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (idx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FCFF" } };
      }
    });
  });

  ws.columns = columns.map((col) => ({ width: Math.max(14, Math.min(26, String(col.label).length + 8)) }));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const exportModuleReport = async (req, res) => {
  try {
    const moduleKey = String(req.query.module || "").toLowerCase();
    const format = String(req.query.format || "excel").toLowerCase();
    const search = String(req.query.search || "").trim();
    const sortBy = String(req.query.sortBy || "createdAt");
    const order = req.query.order === "asc" ? "asc" : "desc";

    const result = await getModuleRows(moduleKey, search, sortBy, order);
    if (!result) return res.status(400).json({ message: "Unsupported module for export" });

    const title = `EMATIX TEXTILE ERP - ${moduleKey.toUpperCase()} REPORT`;
    const { config, rows } = result;
    const baseFileName = `${moduleKey}-report-${fileTimestamp()}`;

    if (format === "pdf") {
      const pdfBuffer = await buildPdfBuffer(title, config.columns, rows);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${baseFileName}.pdf\"`);
      return res.send(pdfBuffer);
    }

    const xlsxBuffer = await buildExcelBuffer(title, config.columns, rows);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=\"${baseFileName}.xlsx\"`);
    return res.send(xlsxBuffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
