import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { connectDB } from '$lib/server/db';
import { Roster, RosterSlot, User, Holiday } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const workbook = new ExcelJS.Workbook();
	const fontName = 'Arial Narrow';

	await connectDB();

	const month = url.searchParams.get('month');
	if (!month) {
		return new Response('Month required', { status: 400 });
	}

	const roster = await Roster.findOne({ month, isCopy: false })
		.sort({ generatedAt: -1 })
		.lean();

	if (!roster) {
		return new Response('Roster not found', { status: 404 });
	}

	const slots = await RosterSlot.find({ rosterId: (roster as unknown as { rosterId: string }).rosterId })
		.sort({ date: 1, slotType: 1 })
		.lean();

	const holidays = await Holiday.find({}).lean();
	const holidayDates = new Set(holidays.map((h) => h.date));

	// Get unique dates and sort
	const dates = [...new Set(slots.map((s) => s.date))].sort();

	// Build slot matrix: date -> slotType -> slot
	const matrix = new Map<string, Map<string, (typeof slots)[0]>>();
	for (const s of slots) {
		if (!matrix.has(s.date)) matrix.set(s.date, new Map());
		matrix.get(s.date)!.set(s.slotType, s);
	}

	// ─── WORKSHEET ───────────────────────────────────────────────
	const ws = workbook.addWorksheet('Roster');

	// Extract month/year
	const [y, m] = month.split('-');
	const monthDate = new Date(month + 'T00:00:00');
	const monthName = monthDate.toLocaleDateString('ms-MY', { month: 'long' }).toUpperCase();
	const year = y;

	// ─── ROW 1: TITLE ────────────────────────────────────────────
	ws.mergeCells('A1:V1');
	const titleCell = ws.getCell('A1');
	titleCell.value = 'JADUAL KERJA LEBIH MASA JABATAN FARMASI HOSPITAL KENINGAU (PPF & PA)';
	titleCell.font = { name: fontName, bold: true, size: 34 };
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
	for (let c = 1; c <= 22; c++) {
		const cell = row2.getCell(c);
		cell.font = { name: fontName, bold: true, size: 19 };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFD9E2F3' }
		} as ExcelJS.Fill;
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	}

	// ─── ROW 3: MONTH / YEAR / TIMES ─────────────────────────────
	const row3 = ws.getRow(3);
	row3.getCell(1).value = monthName;
	row3.getCell(2).value = parseInt(year);
	// Weekday time slots (C-F)
	for (let c = 3; c <= 6; c++) row3.getCell(c).value = '6PM - 10PM';
	// Weekend/holiday time slots (G-O)
	row3.getCell(7).value = '8AM - 3PM';
	row3.getCell(8).value = '8AM - 3PM';
	row3.getCell(9).value = '8AM - 3PM';
	row3.getCell(10).value = '3PM - 10PM';
	row3.getCell(11).value = '3PM - 10PM';
	row3.getCell(12).value = '8AM - 3PM';
	row3.getCell(13).value = '8AM - 3PM';
	row3.getCell(14).value = '3PM - 10PM';
	row3.getCell(15).value = '3PM - 10PM';
	// Prabungkus time slots (P-R)
	for (let c = 16; c <= 18; c++) row3.getCell(c).value = '8AM - 2PM';
	// Farmasi Kecemasan (S-V)
	for (let c = 19; c <= 22; c++) row3.getCell(c).value = 'SETIAP HARI';

	row3.height = 22;
	for (let c = 1; c <= 22; c++) {
		const cell = row3.getCell(c);
		cell.font = { name: fontName, bold: true, size: 19 };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFD9E2F3' }
		} as ExcelJS.Fill;
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	}

	// ─── ROW 4: DEPARTMENT / SLOT LABELS ─────────────────────────
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
	for (let c = 1; c <= 22; c++) {
		const cell = row4.getCell(c);
		cell.font = { name: fontName, bold: true, size: 19 };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFD9E2F3' }
		} as ExcelJS.Fill;
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	}

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
	for (let c = 1; c <= 22; c++) {
		const cell = row5.getCell(c);
		cell.font = { name: fontName, bold: true, size: 19 };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFD9E2F3' }
		} as ExcelJS.Fill;
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	}

	// ─── MERGE HEADER CELLS ──────────────────────────────────────
	ws.mergeCells('C2:F2');
	ws.mergeCells('G2:Q2');
	ws.mergeCells('R2:V2');
	// Merge row 4 department group headers
	ws.mergeCells('C4:E4');  // FARMASI AMBULATORI weekday
	ws.mergeCells('G4:K4');  // FARMASI AMBULATORI weekend
	ws.mergeCells('L4:O4');  // FARMASI PESAKIT DALAM weekend
	ws.mergeCells('P4:R4');  // PRABUNGKUS

	// ─── DAY NAME MAPPINGS ───────────────────────────────────────
	const dayNamesMalay: Record<number, string> = {
		0: 'AHAD', 1: 'ISNIN', 2: 'SELASA', 3: 'RABU',
		4: 'KHAMIS', 5: 'JUMAAT', 6: 'SABTU'
	};

	// ─── DATA ROWS (starting row 6) ──────────────────────────────
	let rowNum = 6;
	for (const date of dates) {
		const dow = new Date(date + 'T00:00:00').getDay();
		const isHoliday = holidayDates.has(date);
		const dayLabel = isHoliday ? 'CUTI UMUM' : dayNamesMalay[dow] || '';
		const dayNum = parseInt(date.split('-')[2]);
		const isWeekend = dow === 0 || dow === 6;

		const dateSlots = matrix.get(date) || new Map();

		const row = ws.getRow(rowNum);

		// Column A: TARIKH (day number)
		row.getCell(1).value = dayNum;
		// Column B: HARI
		row.getCell(2).value = dayLabel;

		if (isHoliday || isWeekend) {
			// ─── WEEKEND / HOLIDAY SLOTS ──────────────────────────
			// G: OPD_1
			row.getCell(7).value = dateSlots.get('OPD_1')?.employeeName || '';
			// H: OPD_2
			row.getCell(8).value = dateSlots.get('OPD_2')?.employeeName || '';

			if (isHoliday) {
				// Holiday: I=OPD_3, J=OPD_4, K=OPD_5 (full set)
				row.getCell(9).value = dateSlots.get('OPD_3')?.employeeName || '';
				row.getCell(10).value = dateSlots.get('OPD_4')?.employeeName || '';
				row.getCell(11).value = dateSlots.get('OPD_5')?.employeeName || '';
				// L-O: IPP_1 to IPP_4
				row.getCell(12).value = dateSlots.get('IPP_1')?.employeeName || '';
				row.getCell(13).value = dateSlots.get('IPP_2')?.employeeName || '';
				row.getCell(14).value = dateSlots.get('IPP_3')?.employeeName || '';
				row.getCell(15).value = dateSlots.get('IPP_4')?.employeeName || '';
			} else {
				// Saturday/Sunday: I empty, J=OPD_3, K=OPD_4
				row.getCell(9).value = '';
				row.getCell(10).value = dateSlots.get('OPD_3')?.employeeName || '';
				row.getCell(11).value = dateSlots.get('OPD_4')?.employeeName || '';
				// L-N: IPP_1 to IPP_3, O empty
				row.getCell(12).value = dateSlots.get('IPP_1')?.employeeName || '';
				row.getCell(13).value = dateSlots.get('IPP_2')?.employeeName || '';
				row.getCell(14).value = dateSlots.get('IPP_3')?.employeeName || '';
				row.getCell(15).value = '';
			}

			// P-R: PP slots
			row.getCell(16).value = dateSlots.get('PP_PPF')?.employeeName || '';
			row.getCell(17).value = dateSlots.get('PP_PRA_1')?.employeeName || '';
			row.getCell(18).value = dateSlots.get('PP_PRA_2')?.employeeName || '';
			// C-F: empty on weekends/holidays
			row.getCell(3).value = '';
			row.getCell(4).value = '';
			row.getCell(5).value = '';
			row.getCell(6).value = '';
		} else {
			// ─── WEEKDAY SLOTS ────────────────────────────────────
			// C-F: OPD_1, OPD_2, OPD_3, IPP_1
			row.getCell(3).value = dateSlots.get('OPD_1')?.employeeName || '';
			row.getCell(4).value = dateSlots.get('OPD_2')?.employeeName || '';
			row.getCell(5).value = dateSlots.get('OPD_3')?.employeeName || '';
			row.getCell(6).value = dateSlots.get('IPP_1')?.employeeName || '';
			// G-R: empty
			for (let c = 7; c <= 18; c++) row.getCell(c).value = '';
		}

		// S: empty (10PM-12AM separator column)
		row.getCell(19).value = '';
		// T: AE
		row.getCell(20).value = dateSlots.get('AE')?.employeeName || '';
		// U: empty (12AM-8AM separator column)
		row.getCell(21).value = '';
		// V: POST-AE
		row.getCell(22).value = dateSlots.get('POST-AE')?.employeeName || '';

		// Style data row
		row.height = isHoliday || isWeekend ? 22 : 18;
		for (let c = 1; c <= 22; c++) {
			const cell = row.getCell(c);
			cell.font = { name: fontName, size: 16 };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};

			// Background colors
			if (isHoliday) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFFCE4D6' }  // light peach
				} as ExcelJS.Fill;
			} else if (isWeekend) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFF2F2F2' }  // very light gray
				} as ExcelJS.Fill;
			}
		}

		// Bold the date and day columns
		row.getCell(1).font = { name: fontName, size: 16, bold: true };
		row.getCell(2).font = { name: fontName, size: 16, bold: true };

		rowNum++;
	}

	// ─── FOOTER ──────────────────────────────────────────────────
	rowNum++;

	const footerRow1 = ws.getRow(rowNum);
	footerRow1.getCell(1).value = 'DISEDIAKAN OLEH :';
	footerRow1.getCell(20).value = 'DI LULUSKAN OLEH:';
	ws.mergeCells(`A${rowNum}:D${rowNum}`);
	ws.mergeCells(`T${rowNum}:V${rowNum}`);
	footerRow1.getCell(1).font = { name: fontName, bold: true, size: 12 };
	footerRow1.getCell(20).font = { name: fontName, bold: true, size: 12 };
	footerRow1.height = 20;
	rowNum++;

	const footerRow2 = ws.getRow(rowNum);
	footerRow2.getCell(1).value = 'SELYVESTER @ JULKARNAIN KUNDIAN';
	footerRow2.getCell(20).value = 'VICTOR LIM';
	ws.mergeCells(`A${rowNum}:D${rowNum}`);
	ws.mergeCells(`T${rowNum}:V${rowNum}`);
	footerRow2.getCell(1).font = { name: fontName, size: 12 };
	footerRow2.getCell(20).font = { name: fontName, size: 12 };
	footerRow2.height = 20;
	rowNum++;

	const footerRow3 = ws.getRow(rowNum);
	footerRow3.getCell(1).value = 'Ketua Penolong Pegawai Farmasi';
	footerRow3.getCell(20).value = 'Ketua Jabatan Farmasi';
	ws.mergeCells(`A${rowNum}:D${rowNum}`);
	ws.mergeCells(`T${rowNum}:V${rowNum}`);
	footerRow3.getCell(1).font = { name: fontName, italic: true, size: 12 };
	footerRow3.getCell(20).font = { name: fontName, italic: true, size: 12 };
	footerRow3.height = 20;
	rowNum++;

	const footerRow4 = ws.getRow(rowNum);
	footerRow4.getCell(1).value = '26.02.2026';
	footerRow4.getCell(20).value = '26.02.2026';
	ws.mergeCells(`A${rowNum}:D${rowNum}`);
	ws.mergeCells(`T${rowNum}:V${rowNum}`);
	footerRow4.getCell(1).font = { name: fontName, size: 12 };
	footerRow4.getCell(20).font = { name: fontName, size: 12 };
	footerRow4.height = 20;

	// ─── COLUMN WIDTHS ───────────────────────────────────────────
	ws.getColumn(1).width = 6;    // TARIKH
	ws.getColumn(2).width = 14;   // HARI
	ws.getColumn(3).width = 14;   // OPD_1 (weekday)
	ws.getColumn(4).width = 14;   // OPD_2 (weekday)
	ws.getColumn(5).width = 14;   // OPD_3 (weekday)
	ws.getColumn(6).width = 14;   // IPP_1 (weekday)
	ws.getColumn(7).width = 14;   // OPD_1 (weekend)
	ws.getColumn(8).width = 14;   // OPD_2 (weekend)
	ws.getColumn(9).width = 14;   // OPD_3 (weekend/holiday)
	ws.getColumn(10).width = 14;  // OPD_4/OPD_3
	ws.getColumn(11).width = 14;  // OPD_5/OPD_4
	ws.getColumn(12).width = 14;  // IPP_1
	ws.getColumn(13).width = 14;  // IPP_2
	ws.getColumn(14).width = 14;  // IPP_3
	ws.getColumn(15).width = 14;  // IPP_4/empty
	ws.getColumn(16).width = 14;  // PP_PPF
	ws.getColumn(17).width = 14;  // PP_PRA_1
	ws.getColumn(18).width = 14;  // PP_PRA_2
	ws.getColumn(19).width = 13;  // 10PM-12AM (empty separator)
	ws.getColumn(20).width = 14;  // AE
	ws.getColumn(21).width = 13;  // 12AM-8AM (empty separator)
	ws.getColumn(22).width = 14;  // POST-AE

	// ─── PRINT SETUP ─────────────────────────────────────────────
	ws.pageSetup.orientation = 'landscape';
	ws.pageSetup.paperSize = 9; // A4
	ws.pageSetup.fitToPage = true;
	ws.pageSetup.fitToWidth = 1;
	ws.pageSetup.fitToHeight = 0;
	ws.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 };

	// ─── SUMMARY SHEET ───────────────────────────────────────────
	const summaryWs = workbook.addWorksheet('Summary');
	const summaryHeaders = ['EmployeeID', 'Name', 'Department', 'Role', 'Total Hours', 'Max Hours', '% Utilization'];
	const shRow = summaryWs.getRow(1);
	summaryHeaders.forEach((h, i) => {
		shRow.getCell(i + 1).value = h;
		shRow.getCell(i + 1).font = { name: fontName, bold: true, size: 11 };
		shRow.getCell(i + 1).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFD9E2F3' }
		} as ExcelJS.Fill;
		shRow.getCell(i + 1).border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
	});

	const empHours: Map<string, number> = new Map();
	for (const s of slots) {
		if (s.slotType === 'POST-AE') continue;
		empHours.set(s.employeeId, (empHours.get(s.employeeId) || 0) + s.hours);
	}

	const empList = await User.find({ active: true }).lean();
	let sr = 2;
	for (const emp of empList) {
		const totalHours = empHours.get(emp.employeeId) || 0;
		const maxHrs = emp.maxHoursPerMonth || 56;
		const row = summaryWs.getRow(sr);
		row.getCell(1).value = emp.employeeId;
		row.getCell(2).value = emp.name;
		row.getCell(3).value = emp.dept;
		row.getCell(4).value = emp.role;
		row.getCell(5).value = totalHours;
		row.getCell(6).value = maxHrs;
		row.getCell(7).value = maxHrs > 0 ? Math.round((totalHours / maxHrs) * 100) / 100 : 0;
		for (let c = 1; c <= 7; c++) {
			row.getCell(c).font = { name: fontName, size: 11 };
			row.getCell(c).border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		}
		sr++;
	}

	summaryWs.getColumn(1).width = 12;
	summaryWs.getColumn(2).width = 28;
	summaryWs.getColumn(3).width = 12;
	summaryWs.getColumn(4).width = 8;
	summaryWs.getColumn(5).width = 14;
	summaryWs.getColumn(6).width = 12;
	summaryWs.getColumn(7).width = 14;

	// ─── GENERATE BUFFER ─────────────────────────────────────────
	const buffer = await workbook.xlsx.writeBuffer();

	const monthStr = month.replace(/-/g, '').slice(0, 6);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="Jadual_OT_${monthStr}.xlsx"`
		}
	});
};