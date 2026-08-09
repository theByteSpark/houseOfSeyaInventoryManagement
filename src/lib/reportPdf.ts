import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function sanitizeForPdf(text: string): string {
  return text.replace(/₹/g, 'Rs. ');
}

interface ReportSummaryStat {
  label: string;
  value: string;
}

interface ReportTable {
  title: string;
  head: string[];
  body: (string | number)[][];
}

export function generateReportPdf(
  reportName: string,
  filters: string,
  stats: ReportSummaryStat[],
  tables: ReportTable[],
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizeForPdf(reportName), margin, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(sanitizeForPdf(`Generated: ${new Date().toLocaleString()}`), margin, 58);

  if (filters) {
    doc.text(sanitizeForPdf(`Filters: ${filters}`), margin, 72);
  }

  doc.setTextColor(0);

  let y = filters ? 90 : 76;

  if (stats.length > 0) {
    const statBoxWidth = (pageWidth - margin * 2 - 16) / stats.length;
    stats.forEach((stat, i) => {
      const x = margin + i * (statBoxWidth + 8);
      doc.setDrawColor(220);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, y, statBoxWidth, 50, 4, 4, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(sanitizeForPdf(stat.label.toUpperCase()), x + 10, y + 18);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(sanitizeForPdf(stat.value), x + 10, y + 38);
    });
    y += 70;
  }

  tables.forEach((table) => {
    autoTable(doc, {
      head: [table.head.map(sanitizeForPdf)],
      body: table.body.map((row) => row.map((cell) => sanitizeForPdf(String(cell)))),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: (data) => {
        y = (data.cursor?.y ?? y) + 20;
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' },
    );
  }

  const filename = `${reportName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
