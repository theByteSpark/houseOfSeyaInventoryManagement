import { jsPDF } from 'jspdf';
import { formatDate } from '@/lib/format';
import type { Customer, Enquiry } from '@/types';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LEFT = 40;
const RIGHT = PAGE_W - 40;
const BODY_BOTTOM = 700; // the letterhead's contact band starts around y=770
const INK: [number, number, number] = [31, 36, 16];
const FIELD_COL_W = 160;

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

function diamondSummary(enquiry: Enquiry): string {
  if (!enquiry.diamondShape && !enquiry.diamondQuality && !enquiry.diamondPieces && !enquiry.diamondCaratWeight) {
    return '—';
  }
  const pcs = enquiry.diamondPieces ?? '—';
  const shape = enquiry.diamondShape ?? '—';
  const quality = enquiry.diamondQuality ?? '—';
  const carat = enquiry.diamondCaratWeight ?? '—';
  return `${pcs} pc(s) x ${shape} / ${quality}, ${carat} ct`;
}

/** A customer-facing estimate for a recorded enquiry, built from the same fields as the enquiry form. */
export async function buildEnquiryPdf(enquiry: Enquiry, customer: Customer | undefined): Promise<Blob> {
  const letterhead = await loadLetterhead();

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const drawBackground = () => doc.addImage(letterhead, 'JPEG', 0, 0, PAGE_W, PAGE_H);
  drawBackground();

  const font = (bold = false, size = 9.5) => doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
  const text = (value: string, x: number, y: number, align: 'left' | 'center' | 'right' = 'left') =>
    doc.text(value, x, y, { align, baseline: 'top' });
  doc.setTextColor(...INK).setDrawColor(...INK).setLineWidth(1);

  font(true, 13);
  text('ESTIMATE', PAGE_W / 2, 150, 'center');

  font();
  text('Billing To', LEFT, 178);
  font(true);
  text(enquiry.customerName, LEFT, 193);
  font();
  text('Date', 380, 178);
  text(`: ${formatDate(enquiry.createdAt)}`, 445, 178);

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

  const newPage = () => {
    doc.addPage();
    drawBackground();
    y = 150;
  };

  const valueX = LEFT + FIELD_COL_W;
  const valueW = RIGHT - valueX - 12;
  const drawFieldRow = (label: string, value: string, bold = false) => {
    font(bold);
    const lines = doc.splitTextToSize(value, valueW) as string[];
    const rowH = Math.max(22, lines.length * 12 + 10);
    if (y + rowH > BODY_BOTTOM) newPage();
    doc.rect(LEFT, y, FIELD_COL_W, rowH);
    doc.rect(valueX, y, RIGHT - valueX, rowH);
    font(true);
    text(label, LEFT + 8, y + 6);
    font(bold);
    lines.forEach((line, i) => text(line, valueX + 8, y + 6 + i * 12));
    y += rowH;
  };

  drawFieldRow('Subcategory', enquiry.subcategoryName ?? '—');
  drawFieldRow('Metal type', enquiry.metalType);
  drawFieldRow('Gross weight', `${enquiry.grossWeight} g`);
  drawFieldRow('Diamond', diamondSummary(enquiry));
  drawFieldRow('Selling amount', enquiry.sellingAmount !== null ? money(enquiry.sellingAmount) : '—', true);
  drawFieldRow('Notes', enquiry.notes ?? '—');

  doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(85, 85, 85);
  text(
    'This is only an estimate - the final price may vary with live metal rates and the exact weight/quality on completion.',
    RIGHT,
    y + 14,
    'right',
  );
  doc.setTextColor(...INK);

  font();
  text('For House of Seya', RIGHT, Math.max(y + 60, 690), 'right');

  return doc.output('blob');
}
