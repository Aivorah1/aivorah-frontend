/**
 * The one fixed Student Report template, as a PDF (web only). Same for every
 * school: only the logo and name change (from the school's profile/branding).
 *   Header: logo top left, school name top centre, generated date/time top right.
 *   Table:  S.No | Subject Name | Marks | Pass / Fail, then a Total marks row.
 *   Below:  overall rating and remark.
 * Colours follow the teacher palette used by the other PDFs (exportPdf.ts).
 */
import type { StudentReport } from '../services/studentReportApi';
import { classLabel, formatGeneratedAt, formatMarks } from './reportFormat';

type RGB = [number, number, number];
const GOLD: RGB = [154, 123, 46];
const GOLD_BG: RGB = [250, 244, 229];
const DARK: RGB = [30, 27, 20];
const MUTED: RGB = [120, 112, 95];
const BORDER: RGB = [225, 215, 190];
const RED: RGB = [176, 58, 46];
const GREEN: RGB = [46, 125, 80];

async function imageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildReportPdf(report: StudentReport) {
  // import(): jsPDF is its own chunk, fetched only when a report is downloaded or shared.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const ML = 16;
  const MR = 16;
  const col = W - ML - MR;
  let y = 14;

  // ── Header: logo | school name | generated ───────────────────────────
  const logo = report.school.logoUrl ? await imageDataUrl(report.school.logoUrl) : null;
  if (logo) {
    try {
      const fmt = /^data:image\/jpe?g/i.test(logo) ? 'JPEG' : 'PNG';
      doc.addImage(logo, fmt, ML, y - 4, 22, 22);
    } catch {
      // A logo the PDF library cannot read is left out rather than failing the report.
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  const nameLines = doc.splitTextToSize(report.school.name || 'School', col - 2 * 48);
  doc.text(nameLines, W / 2, y + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Generated', W - MR, y, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(formatGeneratedAt(report.generatedAt), W - MR, y + 5, { align: 'right' });

  y += Math.max(22, 6 + nameLines.length * 7);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(ML, y, W - MR, y);

  // ── Title and student ────────────────────────────────────────────────
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...GOLD);
  doc.text('Student Report Card', W / 2, y, { align: 'center' });
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Academic Year ${report.academicYear}`, W / 2, y, { align: 'center' });

  y += 9;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const s = report.student;
  doc.setFont('helvetica', 'bold');
  doc.text('Student:', ML, y);
  doc.setFont('helvetica', 'normal');
  doc.text(s.name, ML + 18, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', W / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(classLabel(s.grade, s.section), W / 2 + 24, y);
  if (s.admissionNumber) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Admission No:', ML, y);
    doc.setFont('helvetica', 'normal');
    doc.text(s.admissionNumber, ML + 27, y);
  }

  // ── Table ────────────────────────────────────────────────────────────
  y += 8;
  const cols = [
    { title: 'S.No', w: 16, align: 'center' as const },
    { title: 'Subject Name', w: col - 16 - 36 - 36, align: 'left' as const },
    { title: 'Marks', w: 36, align: 'center' as const },
    { title: 'Pass / Fail', w: 36, align: 'center' as const },
  ];
  const rowH = 8;
  const cellX = (i: number) => ML + cols.slice(0, i).reduce((a, c) => a + c.w, 0);
  const textX = (i: number) => (cols[i].align === 'center' ? cellX(i) + cols[i].w / 2 : cellX(i) + 3);

  doc.setFillColor(...GOLD);
  doc.rect(ML, y, col, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  cols.forEach((c, i) => doc.text(c.title, textX(i), y + 5.4, { align: c.align }));
  y += rowH;

  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  report.rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(...GOLD_BG);
      doc.rect(ML, y, col, rowH, 'F');
    }
    doc.setTextColor(...DARK);
    doc.text(String(r.sno), textX(0), y + 5.4, { align: 'center' });
    doc.text(doc.splitTextToSize(r.subject, cols[1].w - 6)[0], textX(1), y + 5.4);
    doc.text(`${formatMarks(r.marks)} / ${r.maxMarks}`, textX(2), y + 5.4, { align: 'center' });
    doc.setTextColor(...(r.result === 'Pass' ? GREEN : RED));
    doc.setFont('helvetica', 'bold');
    doc.text(r.result, textX(3), y + 5.4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.line(ML, y + rowH, ML + col, y + rowH);
    y += rowH;
  });
  if (!report.rows.length) {
    doc.setTextColor(...MUTED);
    doc.text('No marks have been uploaded yet.', W / 2, y + 5.4, { align: 'center' });
    y += rowH;
  }

  doc.setFillColor(...GOLD_BG);
  doc.rect(ML, y, col, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Total marks', textX(1), y + 5.4);
  doc.text(`${formatMarks(report.total.obtained)} / ${report.total.max}`, textX(2), y + 5.4, { align: 'center' });
  if (report.percentage !== null) doc.text(`${report.percentage}%`, textX(3), y + 5.4, { align: 'center' });
  doc.setDrawColor(...GOLD);
  doc.rect(ML, y - rowH * (Math.max(report.rows.length, 1) + 1), col, rowH * (Math.max(report.rows.length, 1) + 2));
  y += rowH;

  // ── Overall rating and remark ────────────────────────────────────────
  if (report.rating) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GOLD);
    doc.text(`Overall Rating: ${report.rating.label}`, ML, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(doc.splitTextToSize(report.rating.remark, col), ML, y);
  }

  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Pass mark: ${report.passMark} out of ${report.maxMarks} in each subject.`, ML, 285);
  return doc;
}
