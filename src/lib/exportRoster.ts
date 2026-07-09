/**
 * Client-side Excel export for the OT Roster.
 * Uses exceljs in the browser to generate an .xlsx matching the official template.
 * Runs entirely client-side — no server endpoint needed.
 */
const FONT = 'Arial Narrow';

export interface SlotData {
	date: string;
	day: string;
	slotType: string;
	employeeName: string;
}

export async function exportRosterToExcel(
	month: string, // YYYY-MM-01
	slots: SlotData[],
	holidayDates: Set<string>
): Promise<void> {
	// Dynamic import — exceljs browser build needs runtime resolution
	const ExcelJS = await import('exceljs');
	const workbook = new ExcelJS.Workbook();
	const ws = workbook.addWorksheet('Roster');

	// Extract month/year
	const monthDate = new Date(month + 'T00:00:00');
	const monthName = monthDate.toLocaleDateString('ms-MY', { month: 'long' }).toUpperCase();
	const [y] = month.split('-');
	const year = parseInt(y);

	// Build slot matrix: date -> slotType -> employeeName
	const matrix = new Map<string, Map<string, string>>();
	for (const s of slots) {
		if (!matrix.has(s.date)) matrix.set(s.date, new Map());
		matrix.get(s.date)!.set(s.slotType, s.employeeName || '');
	}

	// Get unique sorted dates in the month
	const daysInMonth = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate();
	const dates: string[] = [];
	for (let d = 1; d <= daysInMonth; d++) {
		dates.push(`${month.slice(0, 7)}-${String(d).padStart(2, '0')}`);
	}

	const dayNames: Record<number, string> = {
		0: 'AHAD', 1: 'ISNIN', 2: 'SELASA', 3: 'RABU',
		4: 'KHAMIS', 5: 'JUMAAT', 6: 'SABTU'
	};

	// ─── ROW 1: TITLE ────────────────────────────────────────────
	ws.mergeCells('A1:V1');
	const titleCell = ws.getCell('A1');
	titleCell.value = 'JADUAL KERJA LEBIH MASA JABATAN FARMASI HOSPITAL KENINGAU (PPF & PA)';
	titleCell.font = { name: FONT, bold: true, size: 34 };
	titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
	ws.getRow(1).height = 46;

	// ─── ROW 2: SUB-HEADER CATEGORIES ────────────────────────────
	ws.mergeCells('C2:F2');
	ws.mergeCells('G2:Q2');
	ws.mergeCells('R2:V2');

	const row2 = ws.getRow(2);
	row2.getCell(1).value = 'BULAN';
	row2.getCell(2).value = 'TAHUN';
	row2.getCell(3).value = 'HARI BEKERJA BIASA';
	row2.getCell(7).value = 'HARI REHAT BIASA / CUTI UMUM';
	row2.getCell(18).value = 'FARMASI KECEMASAN';
	row2.height = 22;
	styleHeaderRow(row2);

	// ─── ROW 3: MONTH / YEAR / TIMES ─────────────────────────────
	const row3 = ws.getRow(3);
	row3.getCell(1).value = monthName;
	row3.getCell(2).value = year;
	for (let c = 3; c <= 6; c++) row3.getCell(c).value = '6PM - 10PM';
	row3.getCell(7).value = '8AM - 3PM';
	row3.getCell(8).value = '8AM - 3PM';
	row3.getCell(9).value = '8AM - 3PM';
	row3.getCell(10).value = '3PM - 10PM';
	row3.getCell(11).value = '3PM - 10PM';
	row3.getCell(12).value = '8AM - 3PM';
	row3.getCell(13).value = '8AM - 3PM';
	row3.getCell(14).value = '3PM - 10PM';
	row3.getCell(15).value = '3PM - 10PM';
	for (let c = 16; c <= 18; c++) row3.getCell(c).value = '8AM - 2PM';
	for (let c = 19; c <= 22; c++) row3.getCell(c).value = 'SETIAP HARI';
	row3.height = 22;
	styleHeaderRow(row3);

	// ─── ROW 4: DEPARTMENT LABELS ────────────────────────────────
	const row4 = ws.getRow(4);
	row4.getCell(1).value = 'TARIKH';
	row4.getCell(2).value = 'HARI';
	row4.getCell(3).value = 'FARMASI AMBULATORI';
	row4.getCell(4).value = 'FARMASI AMBULATORI';
	row4.getCell(5).value = 'FARMASI AMBULATORI';
	row4.getCell(6).value = 'FARMASI PESAKIT DALAM';
	for (let c = 7; c <= 11; c++) row4.getCell(c).value = 'FARMASI AMBULATORI';
	for (let c = 12; c <= 15; c++) row4.getCell(c).value = 'FARMASI PESAKIT DALAM';
	for (let c = 16; c <= 18; c++) row4.getCell(c).value = 'PRABUNGKUS';
	row4.getCell(19).value = '10PM - 12AM';
	row4.getCell(20).value = '10PM - 12AM';
	row4.getCell(21).value = '12AM - 8AM';
	row4.getCell(22).value = '12AM - 8AM';
	row4.height = 45;
	styleHeaderRow(row4);

	// Merge department group headers
	ws.mergeCells('C4:E4');
	ws.mergeCells('G4:K4');
	ws.mergeCells('L4:O4');
	ws.mergeCells('P4:R4');

	// ─── ROW 5: SLOT TYPE LABELS ─────────────────────────────────
	const row5 = ws.getRow(5);
	row5.getCell(3).value = 'OPD_1';
	row5.getCell(4).value = 'OPD_2';
	row5.getCell(5).value = 'OPD_3';
	row5.getCell(6).value = 'IPP_1';
	row5.getCell(7).value = 'OPD_1';
	row5.getCell(8).value = 'OPD_2';
	row5.getCell(9).value = 'OPD_3';
	row5.getCell(10).value = 'OPD_4';
	row5.getCell(11).value = 'OPD_5';
	row5.getCell(12).value = 'IPP_1';
	row5.getCell(13).value = 'IPP_2';
	row5.getCell(14).value = 'IPP_3';
	row5.getCell(15).value = 'IPP_4';
	row5.getCell(16).value = 'PP_PPF';
	row5.getCell(17).value = 'PP_PRA_1';
	row5.getCell(18).value = 'PP_PRA_2';
	row5.getCell(19).value = '';
	row5.getCell(20).value = 'AE';
	row5.getCell(21).value = '';
	row5.getCell(22).value = 'POST-AE';
	row5.height = 30;
	styleHeaderRow(row5);

	// ─── DATA ROWS (starting row 6) ──────────────────────────────
	let rowNum = 6;
	for (const date of dates) {
		const dow = new Date(date + 'T00:00:00').getDay();
		const isHoliday = holidayDates.has(date);
		const dayLabel = isHoliday ? 'CUTI UMUM' : dayNames[dow] || '';
		const dayNum = parseInt(date.split('-')[2]);
		const isWeekend = dow === 0 || dow === 6;

		const dateSlots = matrix.get(date) || new Map();
		const row = ws.getRow(rowNum);

		row.getCell(1).value = dayNum;
		row.getCell(2).value = dayLabel;

		if (isHoliday || isWeekend) {
			row.getCell(7).value = dateSlots.get('OPD_1') || '';
			row.getCell(8).value = dateSlots.get('OPD_2') || '';

			if (isHoliday) {
				row.getCell(9).value = dateSlots.get('OPD_3') || '';
				row.getCell(10).value = dateSlots.get('OPD_4') || '';
				row.getCell(11).value = dateSlots.get('OPD_5') || '';
				row.getCell(12).value = dateSlots.get('IPP_1') || '';
				row.getCell(13).value = dateSlots.get('IPP_2') || '';
				row.getCell(14).value = dateSlots.get('IPP_3') || '';
				row.getCell(15).value = dateSlots.get('IPP_4') || '';
			} else {
				row.getCell(9).value = '';
				row.getCell(10).value = dateSlots.get('OPD_3') || '';
				row.getCell(11).value = dateSlots.get('OPD_4') || '';
				row.getCell(12).value = dateSlots.get('IPP_1') || '';
				row.getCell(13).value = dateSlots.get('IPP_2') || '';
				row.getCell(14).value = dateSlots.get('IPP_3') || '';
				row.getCell(15).value = '';
			}

			row.getCell(16).value = dateSlots.get('PP_PPF') || '';
			row.getCell(17).value = dateSlots.get('PP_PRA_1') || '';
			row.getCell(18).value = dateSlots.get('PP_PRA_2') || '';
			row.getCell(3).value = '';
			row.getCell(4).value = '';
			row.getCell(5).value = '';
			row.getCell(6).value = '';
		} else {
			row.getCell(3).value = dateSlots.get('OPD_1') || '';
			row.getCell(4).value = dateSlots.get('OPD_2') || '';
			row.getCell(5).value = dateSlots.get('OPD_3') || '';
			row.getCell(6).value = dateSlots.get('IPP_1') || '';
			for (let c = 7; c <= 18; c++) row.getCell(c).value = '';
		}

		row.getCell(19).value = '';
		row.getCell(20).value = dateSlots.get('AE') || '';
		row.getCell(21).value = '';
		row.getCell(22).value = dateSlots.get('POST-AE') || '';

		row.height = isHoliday || isWeekend ? 22 : 18;
		for (let c = 1; c <= 22; c++) {
			const cell = row.getCell(c);
			cell.font = { name: FONT, size: 16 };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
			if (isHoliday) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
			} else if (isWeekend) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
			}
		}
		row.getCell(1).font = { name: FONT, size: 16, bold: true };
		row.getCell(2).font = { name: FONT, size: 16, bold: true };

		rowNum++;
	}

	// ─── FOOTER ──────────────────────────────────────────────────
	rowNum++;
	addFooterRow(ws, rowNum, 'DISEDIAKAN OLEH :', 'DI LULUSKAN OLEH:', true); rowNum++;
	addFooterRow(ws, rowNum, 'SELYVESTER @ JULKARNAIN KUNDIAN', 'VICTOR LIM'); rowNum++;
	addFooterRow(ws, rowNum, 'Ketua Penolong Pegawai Farmasi', 'Ketua Jabatan Farmasi', false, true); rowNum++;
	addFooterRow(ws, rowNum, '26.02.2026', '26.02.2026');

	// ─── COLUMN WIDTHS ───────────────────────────────────────────
	const colWidths = [6, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 14, 13, 14];
	colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

	// ─── PRINT SETUP ─────────────────────────────────────────────
	ws.pageSetup.orientation = 'landscape';
	ws.pageSetup.paperSize = 9;
	ws.pageSetup.fitToPage = true;
	ws.pageSetup.fitToWidth = 1;
	ws.pageSetup.fitToHeight = 0;
	ws.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 };

	// ─── SUMMARY SHEET ───────────────────────────────────────────
	addSummarySheet(workbook, slots, month);

	// ─── DOWNLOAD ────────────────────────────────────────────────
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	const monthStr = month.replace(/-/g, '').slice(0, 6);
	a.download = `Jadual_OT_${monthStr}.xlsx`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ─── HELPERS ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styleHeaderRow(row: any): void {
	for (let c = 1; c <= 22; c++) {
		const cell = row.getCell(c);
		cell.font = { name: FONT, bold: true, size: 19 };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFooterRow(ws: any, r: number, left: string, right: string, bold = false, italic = false): void {
	const row = ws.getRow(r);
	row.getCell(1).value = left;
	row.getCell(20).value = right;
	ws.mergeCells(`A${r}:D${r}`);
	ws.mergeCells(`T${r}:V${r}`);
	row.getCell(1).font = { name: FONT, size: 12, bold, italic };
	row.getCell(20).font = { name: FONT, size: 12, bold, italic };
	row.height = 20;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSummarySheet(workbook: any, slots: SlotData[], month: string): void {
	const ws = workbook.addWorksheet('Summary');
	const headers = ['EmployeeID', 'Name', 'Department', 'Role', 'Total Hours', 'Max Hours', '% Utilization'];
	const hRow = ws.getRow(1);
	headers.forEach((h, i) => {
		const c = hRow.getCell(i + 1);
		c.value = h;
		c.font = { name: FONT, bold: true, size: 11 };
		c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
		c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
	});

	// Compute hours per employee
	const empData = new Map<string, { name: string; dept: string; role: string; maxHours: number; hours: number }>();
	for (const s of slots) {
		if (s.slotType === 'POST-AE') continue;
		if (!s.employeeName) continue;
		const key = s.employeeName;
		if (!empData.has(key)) {
			empData.set(key, { name: s.employeeName, dept: '', role: '', maxHours: 56, hours: 0 });
		}
		const d = empData.get(key)!;
		// hours from slot - we approximate based on day type
		const date = s.date;
		const dow = new Date(date + 'T00:00:00').getDay();
		const isWeekend = dow === 0 || dow === 6;
		d.hours += s.slotType === 'AE' ? (dow === 5 || dow === 6 || dow === 0 ? 9 : 2) : (isWeekend ? 7 : 4);
	}

	let sr = 2;
	for (const [, data] of empData) {
		const r = ws.getRow(sr);
		r.getCell(1).value = data.name;
		r.getCell(2).value = data.name;
		r.getCell(3).value = data.dept;
		r.getCell(4).value = data.role;
		r.getCell(5).value = data.hours;
		r.getCell(6).value = data.maxHours;
		r.getCell(7).value = data.maxHours > 0 ? Math.round((data.hours / data.maxHours) * 100) / 100 : 0;
		for (let c = 1; c <= 7; c++) {
			r.getCell(c).font = { name: FONT, size: 11 };
			r.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
		}
		sr++;
	}

	[12, 28, 12, 8, 14, 12, 14].forEach((w, i) => ws.getColumn(i + 1).width = w);
}