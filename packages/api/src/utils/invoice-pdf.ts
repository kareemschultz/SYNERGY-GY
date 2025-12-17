import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Business information for invoice headers
const BUSINESS_INFO = {
  GCMC: {
    name: "Green Crescent Management Consultancy",
    shortName: "GCMC",
    address: "Georgetown, Guyana",
    phone: "",
    email: "",
  },
  KAJ: {
    name: "Kareem Abdul-Jabar Tax & Accounting Services",
    shortName: "KAJ",
    address: "Georgetown, Guyana",
    phone: "",
    email: "",
  },
};

// Invoice data type
type InvoiceLineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

type InvoiceData = {
  invoiceNumber: string;
  business: "GCMC" | "KAJ";
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  clientTin: string | null;
  lineItems: InvoiceLineItem[];
  subtotal: string;
  taxAmount: string;
  discountType: string | null;
  discountValue: string | null;
  discountAmount: string | null;
  discountReason: string | null;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  notes: string | null;
  terms: string | null;
  status: string;
};

// Format currency as GYD
function formatCurrency(amount: string): string {
  const num = Number.parseFloat(amount);
  return `GYD ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate a PDF invoice
 * @param invoiceData - The invoice data to render
 * @returns Base64 encoded PDF string
 */
export async function generateInvoicePdf(
  invoiceData: InvoiceData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const businessInfo = BUSINESS_INFO[invoiceData.business];

  // Colors
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);

  let y = height - 50;
  const leftMargin = 50;
  const rightMargin = 562; // 612 - 50

  // Header - Company Name
  page.drawText(businessInfo.name, {
    x: leftMargin,
    y,
    size: 16,
    font: fontBold,
    color: darkGray,
  });
  y -= 18;

  page.drawText(businessInfo.address, {
    x: leftMargin,
    y,
    size: 10,
    font,
    color: gray,
  });
  y -= 40;

  // INVOICE title
  page.drawText("INVOICE", {
    x: leftMargin,
    y,
    size: 24,
    font: fontBold,
    color: black,
  });
  y -= 30;

  // Invoice details (right aligned)
  const rightColumnX = 400;
  let detailsY = height - 50;

  page.drawText(`Invoice #: ${invoiceData.invoiceNumber}`, {
    x: rightColumnX,
    y: detailsY,
    size: 10,
    font: fontBold,
    color: black,
  });
  detailsY -= 15;

  page.drawText(`Date: ${formatDate(invoiceData.invoiceDate)}`, {
    x: rightColumnX,
    y: detailsY,
    size: 10,
    font,
    color: black,
  });
  detailsY -= 15;

  page.drawText(`Due Date: ${formatDate(invoiceData.dueDate)}`, {
    x: rightColumnX,
    y: detailsY,
    size: 10,
    font,
    color: black,
  });
  detailsY -= 15;

  // Status badge
  page.drawText(`Status: ${invoiceData.status}`, {
    x: rightColumnX,
    y: detailsY,
    size: 10,
    font: fontBold,
    color:
      invoiceData.status === "PAID"
        ? rgb(0.1, 0.6, 0.2)
        : invoiceData.status === "OVERDUE"
          ? rgb(0.8, 0.2, 0.2)
          : gray,
  });

  // Bill To section
  page.drawText("BILL TO:", {
    x: leftMargin,
    y,
    size: 10,
    font: fontBold,
    color: gray,
  });
  y -= 15;

  page.drawText(invoiceData.clientName, {
    x: leftMargin,
    y,
    size: 12,
    font: fontBold,
    color: black,
  });
  y -= 15;

  if (invoiceData.clientEmail) {
    page.drawText(invoiceData.clientEmail, {
      x: leftMargin,
      y,
      size: 10,
      font,
      color: gray,
    });
    y -= 15;
  }

  if (invoiceData.clientAddress) {
    page.drawText(invoiceData.clientAddress, {
      x: leftMargin,
      y,
      size: 10,
      font,
      color: gray,
    });
    y -= 15;
  }

  if (invoiceData.clientTin) {
    page.drawText(`TIN: ${invoiceData.clientTin}`, {
      x: leftMargin,
      y,
      size: 10,
      font,
      color: gray,
    });
    y -= 15;
  }

  y -= 20;

  // Line items table header
  // Position saved for future reference when implementing multi-page support

  // Draw header background
  page.drawRectangle({
    x: leftMargin,
    y: y - 5,
    width: rightMargin - leftMargin,
    height: 20,
    color: lightGray,
  });

  // Table headers
  const columns = {
    description: { x: leftMargin + 5, width: 280 },
    qty: { x: 340, width: 50 },
    unitPrice: { x: 400, width: 80 },
    amount: { x: 490, width: 72 },
  };

  page.drawText("Description", {
    x: columns.description.x,
    y,
    size: 9,
    font: fontBold,
    color: darkGray,
  });
  page.drawText("Qty", {
    x: columns.qty.x,
    y,
    size: 9,
    font: fontBold,
    color: darkGray,
  });
  page.drawText("Unit Price", {
    x: columns.unitPrice.x,
    y,
    size: 9,
    font: fontBold,
    color: darkGray,
  });
  page.drawText("Amount", {
    x: columns.amount.x,
    y,
    size: 9,
    font: fontBold,
    color: darkGray,
  });

  y -= 25;

  // Line items
  for (const item of invoiceData.lineItems) {
    // Truncate description if too long
    const maxDescLength = 50;
    const description =
      item.description.length > maxDescLength
        ? `${item.description.substring(0, maxDescLength)}...`
        : item.description;

    page.drawText(description, {
      x: columns.description.x,
      y,
      size: 9,
      font,
      color: black,
    });
    page.drawText(item.quantity, {
      x: columns.qty.x,
      y,
      size: 9,
      font,
      color: black,
    });
    page.drawText(formatCurrency(item.unitPrice), {
      x: columns.unitPrice.x,
      y,
      size: 9,
      font,
      color: black,
    });
    page.drawText(formatCurrency(item.amount), {
      x: columns.amount.x,
      y,
      size: 9,
      font,
      color: black,
    });

    y -= 18;
  }

  // Draw line under items
  y -= 5;
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: rightMargin, y },
    thickness: 0.5,
    color: lightGray,
  });
  y -= 15;

  // Totals section (right aligned)
  const totalsX = 400;
  const totalsValueX = 490;

  page.drawText("Subtotal:", {
    x: totalsX,
    y,
    size: 10,
    font,
    color: gray,
  });
  page.drawText(formatCurrency(invoiceData.subtotal), {
    x: totalsValueX,
    y,
    size: 10,
    font,
    color: black,
  });
  y -= 15;

  // Discount (if applicable)
  if (
    invoiceData.discountType &&
    invoiceData.discountType !== "NONE" &&
    invoiceData.discountAmount &&
    Number.parseFloat(invoiceData.discountAmount) > 0
  ) {
    const discountLabel =
      invoiceData.discountType === "PERCENTAGE"
        ? `Discount (${invoiceData.discountValue}%):`
        : "Discount:";
    page.drawText(discountLabel, {
      x: totalsX,
      y,
      size: 10,
      font,
      color: rgb(0.8, 0.4, 0),
    });
    page.drawText(`-${formatCurrency(invoiceData.discountAmount)}`, {
      x: totalsValueX,
      y,
      size: 10,
      font,
      color: rgb(0.8, 0.4, 0),
    });
    y -= 15;
  }

  // Tax
  if (Number.parseFloat(invoiceData.taxAmount) > 0) {
    page.drawText("Tax:", {
      x: totalsX,
      y,
      size: 10,
      font,
      color: gray,
    });
    page.drawText(formatCurrency(invoiceData.taxAmount), {
      x: totalsValueX,
      y,
      size: 10,
      font,
      color: black,
    });
    y -= 15;
  }

  // Total line
  y -= 5;
  page.drawLine({
    start: { x: totalsX, y },
    end: { x: rightMargin, y },
    thickness: 1,
    color: darkGray,
  });
  y -= 15;

  // Total
  page.drawText("TOTAL:", {
    x: totalsX,
    y,
    size: 12,
    font: fontBold,
    color: black,
  });
  page.drawText(formatCurrency(invoiceData.totalAmount), {
    x: totalsValueX,
    y,
    size: 12,
    font: fontBold,
    color: black,
  });
  y -= 20;

  // Amount Paid and Due (if partial payment)
  if (Number.parseFloat(invoiceData.amountPaid) > 0) {
    page.drawText("Amount Paid:", {
      x: totalsX,
      y,
      size: 10,
      font,
      color: rgb(0.1, 0.6, 0.2),
    });
    page.drawText(formatCurrency(invoiceData.amountPaid), {
      x: totalsValueX,
      y,
      size: 10,
      font,
      color: rgb(0.1, 0.6, 0.2),
    });
    y -= 15;

    page.drawText("Amount Due:", {
      x: totalsX,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.8, 0.2, 0.2),
    });
    page.drawText(formatCurrency(invoiceData.amountDue), {
      x: totalsValueX,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.8, 0.2, 0.2),
    });
    y -= 20;
  }

  // Notes & Terms section
  y = Math.min(y, 200); // Ensure we have space at bottom

  if (invoiceData.terms) {
    y -= 20;
    page.drawText("Payment Terms:", {
      x: leftMargin,
      y,
      size: 9,
      font: fontBold,
      color: gray,
    });
    y -= 12;
    page.drawText(invoiceData.terms.substring(0, 100), {
      x: leftMargin,
      y,
      size: 9,
      font,
      color: gray,
    });
    y -= 15;
  }

  if (invoiceData.notes) {
    y -= 10;
    page.drawText("Notes:", {
      x: leftMargin,
      y,
      size: 9,
      font: fontBold,
      color: gray,
    });
    y -= 12;
    page.drawText(invoiceData.notes.substring(0, 100), {
      x: leftMargin,
      y,
      size: 9,
      font,
      color: gray,
    });
  }

  // Footer
  const footerY = 30;
  page.drawText("Thank you for your business!", {
    x: leftMargin,
    y: footerY,
    size: 10,
    font,
    color: gray,
  });

  page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
    x: 420,
    y: footerY,
    size: 8,
    font,
    color: gray,
  });

  return pdfDoc.save();
}
