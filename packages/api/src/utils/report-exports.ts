import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Business branding for reports
const BUSINESS_INFO = {
  GCMC: {
    name: "Green Crescent Management Consultancy",
    address: "94 Laluni Street, Queenstown, Georgetown",
    phone: "(592) 226-8866",
    email: "info@greencrescentgy.com",
  },
  KAJ: {
    name: "Kareem Abdul-Jabar Tax & Accounting Services",
    address: "94 Laluni Street, Queenstown, Georgetown",
    phone: "(592) 226-8866",
    email: "info@kajtax.gy",
  },
};

type ReportColumn = {
  key: string;
  label: string;
  type?: string;
};

type ReportExportData = {
  reportName: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: Record<string, unknown>;
  filters?: {
    business?: string;
    fromDate?: string;
    toDate?: string;
  };
  generatedAt: string;
  generatedBy: string;
};

// Format cell value based on type
function formatCellValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (
    type === "currency" &&
    (typeof value === "string" || typeof value === "number")
  ) {
    const num = typeof value === "string" ? Number.parseFloat(value) : value;
    return `GYD ${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (type === "date" && value) {
    return new Date(value as string).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (
    type === "number" &&
    (typeof value === "string" || typeof value === "number")
  ) {
    const num = typeof value === "string" ? Number.parseFloat(value) : value;
    return num.toLocaleString("en-US");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

// Generate PDF report
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Report PDF generation handles multi-page layout, dynamic columns, data formatting, summary sections, and pagination
export async function generateReportPdf(
  reportData: ReportExportData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 842; // A4 landscape width
  const pageHeight = 595; // A4 landscape height
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Helper to add new page if needed
  const checkAddPage = (requiredHeight: number) => {
    if (y - requiredHeight < margin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      return true;
    }
    return false;
  };

  // Get business info
  const business = reportData.filters?.business || "GCMC";
  const businessInfo =
    BUSINESS_INFO[business as keyof typeof BUSINESS_INFO] || BUSINESS_INFO.GCMC;

  // Header - Company name
  page.drawText(businessInfo.name, {
    x: margin,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.3, 0.1),
  });
  y -= 18;

  // Contact info
  page.drawText(`${businessInfo.address} | ${businessInfo.phone}`, {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  // Report title
  page.drawText(reportData.reportName, {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 16;

  // Description
  page.drawText(reportData.description, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 20;

  // Filter info
  const filterParts: string[] = [];
  if (reportData.filters?.business) {
    filterParts.push(`Business: ${reportData.filters.business}`);
  }
  if (reportData.filters?.fromDate) {
    filterParts.push(`From: ${reportData.filters.fromDate}`);
  }
  if (reportData.filters?.toDate) {
    filterParts.push(`To: ${reportData.filters.toDate}`);
  }
  if (filterParts.length > 0) {
    page.drawText(`Filters: ${filterParts.join(" | ")}`, {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 15;
  }

  // Generated info
  page.drawText(
    `Generated: ${new Date(reportData.generatedAt).toLocaleString()} by ${reportData.generatedBy}`,
    {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    }
  );
  y -= 25;

  // Horizontal line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 15;

  // Calculate column widths
  const columns = reportData.columns;
  const columnCount = columns.length;
  const columnWidth = contentWidth / columnCount;

  // Draw table header
  let x = margin;
  page.drawRectangle({
    x: margin,
    y: y - 15,
    width: contentWidth,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });

  for (const col of columns) {
    const truncatedLabel =
      col.label.length > 15 ? `${col.label.substring(0, 13)}...` : col.label;
    page.drawText(truncatedLabel, {
      x: x + 4,
      y: y - 10,
      size: 9,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    x += columnWidth;
  }
  y -= 22;

  // Draw data rows
  let rowCount = 0;

  for (const row of reportData.data) {
    checkAddPage(20);

    // Alternate row background
    if (rowCount % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - 12,
        width: contentWidth,
        height: 18,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    x = margin;
    for (const col of columns) {
      const value = row[col.key];
      const formattedValue = formatCellValue(value, col.type);
      const truncatedValue =
        formattedValue.length > 20
          ? `${formattedValue.substring(0, 18)}...`
          : formattedValue;

      page.drawText(truncatedValue, {
        x: x + 4,
        y: y - 8,
        size: 8,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      x += columnWidth;
    }

    y -= 18;
    rowCount += 1;
  }

  // Summary section
  if (Object.keys(reportData.summary).length > 0) {
    checkAddPage(80);
    y -= 20;

    page.drawText("Summary", {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 15;

    for (const [key, value] of Object.entries(reportData.summary)) {
      checkAddPage(15);

      const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
      let formattedValue: string;

      if (typeof value === "number") {
        formattedValue = value.toLocaleString("en-US");
      } else if (typeof value === "object" && value !== null) {
        formattedValue = JSON.stringify(value);
      } else {
        formattedValue = String(value);
      }

      page.drawText(`${formattedKey}: ${formattedValue}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 14;
    }
  }

  // Footer with page numbers
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (!p) {
      continue;
    }
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: pageWidth - margin - 60,
      y: 20,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return pdfDoc.save();
}

// Generate Excel report
export async function generateReportExcel(
  reportData: ReportExportData
): Promise<Buffer> {
  // Dynamic import xlsx
  const XLSX = await import("xlsx");

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for main sheet
  const headers = reportData.columns.map((col) => col.label);
  const rows = reportData.data.map((row) =>
    reportData.columns.map((col) => {
      const value = row[col.key];
      // Keep numbers as numbers for Excel
      if (col.type === "currency" || col.type === "number") {
        if (typeof value === "string") {
          return Number.parseFloat(value) || 0;
        }
        return value;
      }
      return formatCellValue(value, col.type);
    })
  );

  // Create data sheet
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = reportData.columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Report Data");

  // Create summary sheet if there's summary data
  if (Object.keys(reportData.summary).length > 0) {
    const summaryData: (string | number)[][] = [["Metric", "Value"]];
    for (const [key, value] of Object.entries(reportData.summary)) {
      const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
      if (typeof value === "object" && value !== null) {
        summaryData.push([formattedKey, JSON.stringify(value)]);
      } else {
        summaryData.push([formattedKey, value as string | number]);
      }
    }
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  }

  // Create info sheet
  const infoData = [
    ["Report Name", reportData.reportName],
    ["Description", reportData.description],
    ["Generated At", reportData.generatedAt],
    ["Generated By", reportData.generatedBy],
    ["Row Count", reportData.data.length],
  ];
  if (reportData.filters?.business) {
    infoData.push(["Business Filter", reportData.filters.business]);
  }
  if (reportData.filters?.fromDate) {
    infoData.push(["From Date", reportData.filters.fromDate]);
  }
  if (reportData.filters?.toDate) {
    infoData.push(["To Date", reportData.filters.toDate]);
  }

  const infoWs = XLSX.utils.aoa_to_sheet(infoData);
  infoWs["!cols"] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, infoWs, "Report Info");

  // Write to buffer
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Generate CSV report
export function generateReportCsv(reportData: ReportExportData): string {
  const lines: string[] = [];

  // Header line with column labels
  const headers = reportData.columns.map(
    (col) => `"${col.label.replace(/"/g, '""')}"`
  );
  lines.push(headers.join(","));

  // Data rows
  for (const row of reportData.data) {
    const values = reportData.columns.map((col) => {
      const value = formatCellValue(row[col.key], col.type);
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}
