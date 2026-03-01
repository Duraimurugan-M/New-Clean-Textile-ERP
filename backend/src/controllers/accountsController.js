import LedgerEntry from "../models/LedgerEntry.js";
import QueryFeatures from "../utils/queryFeatures.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const formatDateTime = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
};

const fileTimestamp = () => {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  return `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

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

    const toDateTime = (value) => formatDateTime(value);

    if (format === "pdf") {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        info: {
          Title: "Ledger Export",
          Author: "Ematix Textile ERP",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const tableColumns = [
        { key: "entryDate", label: "Entry Date", width: 64 },
        { key: "entryType", label: "Type", width: 66 },
        { key: "partyName", label: "Party", width: 96 },
        { key: "amount", label: "Amount", width: 54 },
        { key: "gstAmount", label: "GST", width: 44 },
        { key: "status", label: "Status", width: 44 },
      ];

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const headerHeight = 62;
      doc
        .save()
        .rect(doc.page.margins.left, doc.page.margins.top, pageWidth, headerHeight)
        .fill("#0B5F87")
        .restore();

      doc
        .fillColor("#FFFFFF")
        .fontSize(17)
        .font("Helvetica-Bold")
        .text(`EMATIX TEXTILE ERP - ${type.toUpperCase()} LEDGER`, doc.page.margins.left + 12, doc.page.margins.top + 14);

      doc
        .fillColor("#EAF5FF")
        .fontSize(10)
        .font("Helvetica")
        .text(`Generated: ${new Date().toLocaleString()}`, doc.page.margins.left + 12, doc.page.margins.top + 38);

      let y = doc.page.margins.top + headerHeight + 18;

      const drawTableHeader = () => {
        let x = doc.page.margins.left;
        doc.rect(x, y, pageWidth, 22).fill("#E7F1FA");
        doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9);
        for (const col of tableColumns) {
          doc.text(col.label, x + 4, y + 7, { width: col.width - 8, ellipsis: true });
          x += col.width;
        }
        y += 22;
      };

      const drawRow = (row, index) => {
        let x = doc.page.margins.left;
        const rowHeight = 20;

        if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.page.margins.top;
          drawTableHeader();
        }

        if (index % 2 === 0) {
          doc.rect(x, y, pageWidth, rowHeight).fill("#F9FCFF");
        }

        doc.fillColor("#1F2937").font("Helvetica").fontSize(8.5);
        const values = [
          toDateTime(row.entryDate),
          row.entryType || "-",
          row.partyName || "N/A",
          Number(row.amount || 0).toFixed(2),
          Number(row.gstAmount || 0).toFixed(2),
          row.status || "-",
        ];

        x = doc.page.margins.left;
        values.forEach((value, i) => {
          doc.text(String(value), x + 4, y + 6, { width: tableColumns[i].width - 8, ellipsis: true });
          x += tableColumns[i].width;
        });

        y += rowHeight;
      };

      drawTableHeader();
      rows.forEach((row, idx) => drawRow(row, idx));

      const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const totalGST = rows.reduce((sum, row) => sum + Number(row.gstAmount || 0), 0);

      y += 8;
      if (y + 44 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.rect(doc.page.margins.left, y, pageWidth, 36).fill("#0F172A");
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Total Amount: Rs ${totalAmount.toFixed(2)}`, doc.page.margins.left + 10, y + 12);
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Total GST: Rs ${totalGST.toFixed(2)}`, doc.page.margins.left + 220, y + 12);

      doc.end();

      const buffer = await new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${type}-ledger-${fileTimestamp()}.pdf\"`
      );
      return res.send(buffer);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger");

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `EMATIX TEXTILE ERP - ${type.toUpperCase()} LEDGER`;
    titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B5F87" },
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:H2");
    const metaCell = worksheet.getCell("A2");
    metaCell.value = `Generated on ${new Date().toLocaleString()}`;
    metaCell.font = { size: 10, color: { argb: "FF334155" } };
    metaCell.alignment = { horizontal: "left" };

    const headerRowIndex = 4;
    const headers = [
      "Entry Date",
      "Entry Type",
      "Party Type",
      "Party Name",
      "Amount",
      "GST",
      "Status",
      "Reference",
    ];
    const headerRow = worksheet.getRow(headerRowIndex);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7F1FA" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
    headerRow.height = 22;

    rows.forEach((row, index) => {
      const excelRow = worksheet.addRow([
        toDateTime(row.entryDate),
        row.entryType || "",
        row.partyType || "",
        row.partyName || "",
        Number(row.amount || 0),
        Number(row.gstAmount || 0),
        row.status || "",
        row.referenceType || "",
      ]);

      excelRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        if (index % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FCFF" },
          };
        }
      });
      excelRow.getCell(5).numFmt = "#,##0.00";
      excelRow.getCell(6).numFmt = "#,##0.00";
    });

    worksheet.columns = [
      { width: 14 },
      { width: 18 },
      { width: 14 },
      { width: 24 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
    ];

    const summaryStart = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${summaryStart}:D${summaryStart}`);
    worksheet.getCell(`A${summaryStart}`).value = "SUMMARY";
    worksheet.getCell(`A${summaryStart}`).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getCell(`A${summaryStart}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };

    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalGST = rows.reduce((sum, row) => sum + Number(row.gstAmount || 0), 0);

    worksheet.getCell(`E${summaryStart}`).value = "Total Amount";
    worksheet.getCell(`F${summaryStart}`).value = totalAmount;
    worksheet.getCell(`F${summaryStart}`).numFmt = "#,##0.00";
    worksheet.getCell(`G${summaryStart}`).value = "Total GST";
    worksheet.getCell(`H${summaryStart}`).value = totalGST;
    worksheet.getCell(`H${summaryStart}`).numFmt = "#,##0.00";

    const excelBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${type}-ledger-${fileTimestamp()}.xlsx\"`
    );
    return res.send(Buffer.from(excelBuffer));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
