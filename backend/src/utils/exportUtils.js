const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const toCsv = (rows, columns) => {
  const header = columns.map((col) => escapeCsv(col.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => escapeCsv(typeof col.value === "function" ? col.value(row) : row[col.key]))
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
};

// Minimal PDF generator for text-table exports.
export const textLinesToSimplePdfBuffer = (title, lines) => {
  const safeTitle = String(title || "Report").replace(/[()]/g, "");
  const normalized = [safeTitle, ...lines.map((line) => String(line).replace(/[()]/g, ""))];

  let y = 800;
  const textCommands = normalized
    .slice(0, 45)
    .map((line) => {
      const cmd = `BT /F1 10 Tf 40 ${y} Td (${line.slice(0, 120)}) Tj ET`;
      y -= 16;
      return cmd;
    })
    .join("\n");

  const contentStream = `${textCommands}\n`;
  const pdfParts = [];
  const xref = [];
  let offset = 0;

  const push = (chunk) => {
    const buf = Buffer.from(chunk, "binary");
    pdfParts.push(buf);
    offset += buf.length;
  };

  push("%PDF-1.4\n");

  xref.push(offset);
  push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");

  xref.push(offset);
  push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");

  xref.push(offset);
  push(
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
  );

  xref.push(offset);
  push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n");

  xref.push(offset);
  push(`5 0 obj << /Length ${Buffer.byteLength(contentStream, "binary")} >> stream\n`);
  push(contentStream);
  push("endstream endobj\n");

  const xrefStart = offset;
  push(`xref\n0 ${xref.length + 1}\n`);
  push("0000000000 65535 f \n");
  xref.forEach((entry) => {
    push(`${String(entry).padStart(10, "0")} 00000 n \n`);
  });
  push(`trailer << /Size ${xref.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return Buffer.concat(pdfParts);
};
