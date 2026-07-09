import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Roster, RosterSlot, User, Holiday } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return new Response('Unauthorized', { status: 401 });
	}

	const ExcelJS = await import('exceljs');
	const workbook = new ExcelJS.Workbook();

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

	const employees = await User.find({}).lean();
	const holidays = await Holiday.find({}).lean();

	const empMap = new Map<string, { name: string; dept: string; role: string }>();
	for (const e of employees) {
		empMap.set(e.employeeId, { name: e.name, dept: e.dept, role: e.role });
	}

	const holidayDates = new Set(holidays.map((h) => h.date));

	// Get unique dates and sort
	const dates = [...new Set(slots.map((s) => s.date))].sort();

	// Build slot matrix: date -> slotType -> slot
	const matrix = new Map<string, Map<string, (typeof slots)[0]>>();
	for (const s of slots) {
		if (!matrix.has(s.date)) matrix.set(s.date, new Map());
		matrix.get(s.date)!.set(s.slotType, s);
	}

	// Create main sheet: Roster
	const ws = workbook.addWorksheet('Roster');

	// Title row
	const titleRow = ws.addRow(['JADUAL KERJA LEBIH MASA JABATAN FARMASI HOSPITAL KENINGAU (PPF & PA)']);
	ws.mergeCells('A1:V1');
	titleRow.getCell(1).font = { bold: true, size: 14 };
	titleRow.alignment = { horizontal: 'center' };

	// Month/Year row
	const monthName = new Date(month + 'T00:00:00').toLocaleDateString('ms-MY', {
		month: 'long',
		year: 'numeric'
	});
	ws.addRow([`Bulan: ${monthName}`]);

	// Header rows
	const header1 = [
		'TARIKH', 'HARI',
		'HARI BEKERJA BIASA', '', '', '',
		'HARI REHAT / CUTI UMUM', '', '', '', '', '', '', '', '', '', '',
		'FARMASI KECEMASAN', '', '', ''
	];
	ws.addRow(header1);

	const header2 = [
		'', '',
		'FARMASI AMBULATORI', '', '', 'FARMASI PESAKIT DALAM',
		'FARMASI AMBULATORI', '', '', '', '', 'FARMASI PESAKIT DALAM', '', '', '',
		'PRABUNGKUS', '', '',
		'', 'AE', '', 'POST-AE'
	];
	ws.addRow(header2);

	const header3 = [
		'', '',
		'OPD_1', 'OPD_2', 'OPD_3', 'IPP_1',
		'OPD_1', 'OPD_2', 'OPD_3', 'OPD_4', 'OPD_5',
		'IPP_1', 'IPP_2', 'IPP_3', 'IPP_4',
		'PP_PPF', 'PP_PRA_1', 'PP_PRA_2',
		'', '10PM-12AM', '', '12AM-8AM'
	];
	ws.addRow(header3);

	// Merge header cells
	ws.mergeCells('C3:F3');
	ws.mergeCells('G3:Q3');
	ws.mergeCells('S3:V3');
	ws.mergeCells('C4:D4');
	ws.mergeCells('G4:J4');
	ws.mergeCells('K4:N4');

	// Style headers
	for (let r = 3; r <= 5; r++) {
		for (let c = 1; c <= 22; c++) {
			const cell = ws.getCell(r, c);
			cell.font = { bold: true, size: 9 };
			cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		}
	}

	// Data rows
	const dayNames: Record<number, string> = {
		0: 'AHAD', 1: 'ISNIN', 2: 'SELASA', 3: 'RABU',
		4: 'KHAMIS', 5: 'JUMAAT', 6: 'SABTU'
	};

	// Slot types in column order
	const colSlotTypes = [
		'OPD_1', 'OPD_2', 'OPD_3', 'IPP_1',  // C-F (weekday)
		'OPD_1', 'OPD_2', 'OPD_3', 'OPD_4', 'OPD_5',  // G-K (weekend/holiday)
		'IPP_1', 'IPP_2', 'IPP_3', 'IPP_4',  // L-O
		'PP_PPF', 'PP_PRA_1', 'PP_PRA_2',  // P-R
		'', 'AE', '', 'POST-AE'  // S-V
	];

	for (const date of dates) {
		const dow = new Date(date + 'T00:00:00').getDay();
		const isHoliday = holidayDates.has(date);
		const dayLabel = isHoliday ? 'CUTI UMUM' : dayNames[dow] || '';
		const dayNum = parseInt(date.split('-')[2]);

		const dateSlots = matrix.get(date) || new Map();

		const row = [
			dayNum,
			dayLabel,
			dateSlots.get('OPD_1')?.employeeName || '',
			dateSlots.get('OPD_2')?.employeeName || '',
			dateSlots.get('OPD_3')?.employeeName || '',
			dateSlots.get('IPP_1')?.employeeName || '',
			...(isHoliday || dow === 0 || dow === 6
				? [
					dateSlots.get('OPD_1')?.employeeName || '',
					dateSlots.get('OPD_2')?.employeeName || '',
					dateSlots.get('OPD_3')?.employeeName || '',
					dateSlots.get('OPD_4')?.employeeName || '',
					dateSlots.get('OPD_5')?.employeeName || '',
					dateSlots.get('IPP_1')?.employeeName || '',
					dateSlots.get('IPP_2')?.employeeName || '',
					dateSlots.get('IPP_3')?.employeeName || '',
					dateSlots.get('IPP_4')?.employeeName || '',
					dateSlots.get('PP_PPF')?.employeeName || '',
					dateSlots.get('PP_PRA_1')?.employeeName || '',
					dateSlots.get('PP_PRA_2')?.employeeName || ''
				]
				: Array(13).fill('')),
			'',
			dateSlots.get('AE')?.employeeName || '',
			'',
			dateSlots.get('POST-AE')?.employeeName || ''
		];

		const dataRow = ws.addRow(row);

		// Style data row
		for (let c = 1; c <= 22; c++) {
			const cell = dataRow.getCell(c);
			cell.font = { size: 9 };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};

			// Highlight weekends/holidays
			if (dow === 0 || dow === 6 || isHoliday) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: isHoliday ? 'FFE0E0E0' : 'FFF0F0F0' }
				} as unknown as import('exceljs').Fill;
			}
		}
	}

	// Set column widths to match template
	ws.getColumn(1).width = 5;   // TARIKH
	ws.getColumn(2).width = 12;  // HARI
	// Weekday columns (C-F): OPD_1, OPD_2, OPD_3, IPP_1
	ws.getColumn(3).width = 11;  // OPD_1
	ws.getColumn(4).width = 11;  // OPD_2
	ws.getColumn(5).width = 11;  // OPD_3
	ws.getColumn(6).width = 11;  // IPP_1
	// Weekend/holiday columns (G-K): OPD_1-5
	ws.getColumn(7).width = 11;  // OPD_1
	ws.getColumn(8).width = 11;  // OPD_2
	ws.getColumn(9).width = 11;  // OPD_3
	ws.getColumn(10).width = 11; // OPD_4
	ws.getColumn(11).width = 11; // OPD_5
	// IPP columns (L-O): IPP_1-4
	ws.getColumn(12).width = 11; // IPP_1
	ws.getColumn(13).width = 11; // IPP_2
	ws.getColumn(14).width = 11; // IPP_3
	ws.getColumn(15).width = 11; // IPP_4
	// Prabungkus (P-R): PP_PPF, PP_PRA_1, PP_PRA_2
	ws.getColumn(16).width = 11; // PP_PPF
	ws.getColumn(17).width = 11; // PP_PRA_1
	ws.getColumn(18).width = 11; // PP_PRA_2
	// Farmasi Kecemasan (S-V)
	ws.getColumn(19).width = 10; // 10PM-12AM
	ws.getColumn(20).width = 10; // AE
	ws.getColumn(21).width = 10; // 12AM-8AM
	ws.getColumn(22).width = 10; // POST-AE

	// Summary sheet
	const summaryWs = workbook.addWorksheet('Summary');
	summaryWs.addRow(['EmployeeID', 'Name', 'Department', 'Role', 'Total Hours', 'Max Hours', '% Utilization']);

	const empHours: Map<string, number> = new Map();
	for (const s of slots) {
		if (s.slotType === 'POST-AE') continue;
		empHours.set(s.employeeId, (empHours.get(s.employeeId) || 0) + s.hours);
	}

	const empList = await User.find({ active: true }).lean();
	for (const emp of empList) {
		const totalHours = empHours.get(emp.employeeId) || 0;
		const maxHrs = emp.maxHoursPerMonth || 56;
		summaryWs.addRow([
			emp.employeeId,
			emp.name,
			emp.dept,
			emp.role,
			totalHours,
			maxHrs,
			maxHrs > 0 ? Math.round((totalHours / maxHrs) * 100) / 100 : 0
		]);
	}

	// Footer section
	ws.addRow([]);
	const footerRow1 = ws.addRow(['DISEDIAKAN OLEH :', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'DI LULUSKAN OLEH:', '', '']);
	ws.mergeCells(`A${footerRow1.number}:D${footerRow1.number}`);
	ws.mergeCells(`T${footerRow1.number}:V${footerRow1.number}`);
	footerRow1.getCell(1).font = { bold: true, size: 10 };
	footerRow1.getCell(20).font = { bold: true, size: 10 };

	const footerRow2 = ws.addRow(['SELYVESTER @ JULKARNAIN KUNDIAN', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'VICTOR LIM', '', '']);
	ws.mergeCells(`A${footerRow2.number}:D${footerRow2.number}`);
	ws.mergeCells(`T${footerRow2.number}:V${footerRow2.number}`);

	const footerRow3 = ws.addRow(['Ketua Penolong Pegawai Farmasi', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Ketua Jabatan Farmasi', '', '']);
	ws.mergeCells(`A${footerRow3.number}:D${footerRow3.number}`);
	ws.mergeCells(`T${footerRow3.number}:V${footerRow3.number}`);
	footerRow3.getCell(1).font = { italic: true, size: 9 };
	footerRow3.getCell(20).font = { italic: true, size: 9 };

	const footerRow4 = ws.addRow(['26.02.2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '26.02.2026', '', '']);
	ws.mergeCells(`A${footerRow4.number}:D${footerRow4.number}`);
	ws.mergeCells(`T${footerRow4.number}:V${footerRow4.number}`);

	// Generate buffer
	const buffer = await workbook.xlsx.writeBuffer();

	const monthStr = month.replace(/-/g, '').slice(0, 6);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="Jadual_OT_${monthStr}.xlsx"`
		}
	});
};