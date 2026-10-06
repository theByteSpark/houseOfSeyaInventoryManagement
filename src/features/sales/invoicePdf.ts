import { jsPDF } from 'jspdf';
import { formatDate } from '@/lib/format';
import type { Customer, Sale } from '@/types';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LEFT = 40;
const RIGHT = PAGE_W - 40;
const BODY_BOTTOM = 700; // the letterhead's contact band starts around y=770
const INK: [number, number, number] = [31, 36, 16];

// Table columns: [x, width]
const COL = {
  sl: [LEFT, 35],
  desc: [LEFT + 35, 265],
  qty: [LEFT + 300, 50],
  price: [LEFT + 350, 80],
  total: [LEFT + 430, RIGHT - (LEFT + 430)],
} as const;

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Built-in PDF fonts can't draw the rupee glyph, so use a plain-text prefix.
const money = (n: number) => `Rs. ${inr.format(n)}`;

let letterheadPromise: Promise<string> | null = null;
function loadLetterhead(): Promise<string> {
  letterheadPromise ??= fetch('/letterhead.jpg')
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    );
  return letterheadPromise;
}

/**
 * Fully paid -> TAX INVOICE dated by when payment completed. Until then
 * (sold / partially paid) the document is a CREDIT NOTE for the balance.
 */
export async function buildSalePdf(sale: Sale, customer: Customer | undefined): Promise<Blob> {
  const letterhead = await loadLetterhead();
  const isPaid = sale.status === 'PAID';
  const title = isPaid ? 'TAX INVOICE' : 'CREDIT NOTE';
  const documentDate = isPaid ? (sale.paidAt ?? sale.soldAt ?? sale.createdAt) : (sale.soldAt ?? sale.createdAt);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const drawBackground = () => doc.addImage(letterhead, 'JPEG', 0, 0, PAGE_W, PAGE_H);
  drawBackground();

  const font = (bold = false, size = 9.5) => doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
  const text = (value: string, x: number, y: number, align: 'left' | 'center' | 'right' = 'left') =>
    doc.text(value, x, y, { align, baseline: 'top' });
  doc.setTextColor(...INK).setDrawColor(...INK).setLineWidth(1);

  font(true, 13);
  text(title, PAGE_W / 2, 150, 'center');

  font();
  text('Billing To', LEFT, 178);
  font(true);
  text(sale.customerName, LEFT, 193);
  font();
  text(isPaid ? 'Invoice' : 'Credit Note', 380, 178);
  text(`: ${sale.saleNumber}`, 445, 178);
  text('Date', 380, 196);
  text(`: ${formatDate(documentDate)}`, 445, 196);

  let y = 222;
  const detail = (label: string, value: string | null | undefined) => {
    if (!value) return;
    const lines = doc.splitTextToSize(value, 330) as string[];
    text(`${label}:`, LEFT, y);
    lines.forEach((line, i) => text(line, LEFT + 50, y + i * 12));
    y += lines.length * 12 + 6;
  };
  detail('Phone', customer?.phone);
  detail('Email', customer?.email);
  detail('Address', customer?.address);
  y = Math.max(y, 262) + 10;

  const HEAD_H = 24;
  const drawRow = (top: number, height: number) => {
    doc.rect(LEFT, top, RIGHT - LEFT, height);
    for (const [x] of [COL.desc, COL.qty, COL.price, COL.total]) doc.line(x, top, x, top + height);
  };
  const drawHeader = (top: number) => {
    drawRow(top, HEAD_H);
    font();
    text('SL', COL.sl[0] + COL.sl[1] / 2, top + 8, 'center');
    text('ITEMS DESCRIPTION', COL.desc[0] + COL.desc[1] / 2, top + 8, 'center');
    text('QTY', COL.qty[0] + COL.qty[1] / 2, top + 8, 'center');
    text('PRICE', COL.price[0] + COL.price[1] / 2, top + 8, 'center');
    text('TOTAL', COL.total[0] + COL.total[1] / 2, top + 8, 'center');
  };
  const newPage = () => {
    doc.addPage();
    drawBackground();
    y = 150;
  };

  drawHeader(y);
  y += HEAD_H;

  sale.items.forEach((item, index) => {
    font();
    const lines = doc.splitTextToSize(`${item.productName} (${item.designNumber})`, COL.desc[1] - 12) as string[];
    const rowH = Math.max(24, lines.length * 12 + 12);
    if (y + rowH > BODY_BOTTOM) {
      newPage();
      drawHeader(y);
      y += HEAD_H;
    }
    drawRow(y, rowH);
    text(String(index + 1), COL.sl[0] + COL.sl[1] / 2, y + 8, 'center');
    lines.forEach((line, i) => text(line, COL.desc[0] + 6, y + 8 + i * 12));
    text(String(item.quantity), COL.qty[0] + COL.qty[1] / 2, y + 8, 'center');
    text(money(item.unitPrice), COL.price[0] + COL.price[1] - 6, y + 8, 'right');
    text(money(item.lineTotal), COL.total[0] + COL.total[1] - 6, y + 8, 'right');
    y += rowH;
  });

  const halfTax = Math.round((sale.tax / 2) * 100) / 100;
  const rows: { label: string; value: string; bold?: boolean }[] = [
    { label: 'SUBTOTAL', value: money(sale.subtotal), bold: true },
    { label: 'CGST @1.5% (incl.)', value: money(halfTax) },
    { label: 'SGST @1.5% (incl.)', value: money(sale.tax - halfTax) },
  ];
  if (sale.discountValue > 0) rows.push({ label: 'DISCOUNT', value: `-${money(sale.discountValue)}` });
  rows.push({ label: 'TOTAL', value: money(sale.total), bold: true });
  if (!isPaid) {
    rows.push({ label: 'RECEIVED', value: money(sale.receivedAmount) });
    rows.push({ label: 'BALANCE DUE', value: money(Math.max(sale.balanceDue, 0)), bold: true });
  }

  const ROW_H = 20;
  const labelX = COL.price[0] - 70;
  const labelW = COL.total[0] - labelX;
  y += 24;
  if (y + rows.length * ROW_H + 60 > BODY_BOTTOM + 40) newPage();
  for (const row of rows) {
    doc.rect(labelX, y, labelW, ROW_H);
    doc.rect(COL.total[0], y, COL.total[1], ROW_H);
    font(row.bold);
    text(row.label, labelX + 8, y + 6);
    text(row.value, COL.total[0] + COL.total[1] - 6, y + 6, 'right');
    y += ROW_H;
  }

  if (!isPaid) {
    doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(85, 85, 85);
    text('Credit note for the balance due. A tax invoice is issued once the sale is paid in full.', RIGHT, y + 14, 'right');
    doc.setTextColor(...INK);
  }

  font();
  text('For House of Seya', RIGHT, Math.max(y + 60, 690), 'right');

  return doc.output('blob');
}
