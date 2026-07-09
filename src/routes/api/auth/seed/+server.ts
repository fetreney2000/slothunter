import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { ensureAdminExists } from '$lib/server/auth';
import {
	User, Config, Holiday, AE_Assignment, Preselection, Unavailability
} from '$lib/server/models';

// Seed the database with initial data from the Excel workbook
export const POST: RequestHandler = async ({ request }) => {
	await connectDB();

	const body = await request.json();
	const { action, secret } = body;

	// Simple protection - require a seed secret
	if (secret !== 'slothunter-seed-2026') {
		return json({ error: 'Invalid seed secret' }, { status: 403 });
	}

	try {
	if (action === 'admin' || action === 'all') {
		const adminEmail = body.adminEmail || 'otadmin@gmail.com';
		const adminPassword = body.adminPassword || '1234';
		const { hashPassword } = await import('$lib/server/auth');
		const existing = await User.findOne({ email: adminEmail.toLowerCase() });
		if (!existing) {
			const hash = await hashPassword(adminPassword);
			await User.create({
				employeeId: 'ADMIN',
				name: 'Pentadbir',
				dept: 'OPD',
				role: 'PPF',
				email: adminEmail.toLowerCase(),
				passwordHash: hash,
				maxHoursPerMonth: 0,
				active: true,
				salary: 0,
				annualAE: 0, annualHalfPaidAE: 0, annualPaidAE: 0, annualPHAE: 0, annualPH: 0,
				userRole: 'Admin'
			});
		} else {
			// Update password if admin already exists
			const hash = await hashPassword(adminPassword);
			existing.passwordHash = hash;
			await existing.save();
		}
	}

		if (action === 'employees' || action === 'all') {
			await seedEmployees();
		}

		if (action === 'config' || action === 'all') {
			await seedConfig();
		}

		if (action === 'holidays' || action === 'all') {
			await seedHolidays();
		}

		if (action === 'ae' || action === 'all') {
			await seedAEAssignments();
		}

		if (action === 'preselections' || action === 'all') {
			await seedPreselections();
		}

		if (action === 'unavailability' || action === 'all') {
			await seedUnavailability();
		}

		return json({ success: true, message: `Seeded: ${action}` });
	} catch (err) {
		console.error('Seed error:', err);
		return json({ error: String(err) }, { status: 500 });
	}
};

const employees = [
	{ employeeId: 'E001', name: 'Fetre', dept: 'IPP', role: 'PPF', email: 'fetreney2000@hotmail.com', maxHoursPerMonth: 56, salary: 5121.05, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E002', name: 'Anieda', dept: 'IPP', role: 'PPF', email: 'bisacodylsupp@gmail.com', maxHoursPerMonth: 56, salary: 5920.28, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E003', name: 'Herman', dept: 'IPP', role: 'PPF', email: 'danielherman82@gmail.com', maxHoursPerMonth: 56, salary: 5514.89, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 2, annualPHAE: 0, annualPH: 1 },
	{ employeeId: 'E004', name: 'Audery', dept: 'IPP', role: 'PPF', email: 'auderyjulius@gmail.com', maxHoursPerMonth: 56, salary: 4064.07, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 2, annualPHAE: 1, annualPH: 3 },
	{ employeeId: 'E005', name: 'Qurratu', dept: 'IPP', role: 'PPF', email: 'rratuain98@gmail.com', maxHoursPerMonth: 56, salary: 2752.04, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 4 },
	{ employeeId: 'E006', name: 'Josie', dept: 'IPP', role: 'PPF', email: 'jodann.mol@gmail.com', maxHoursPerMonth: 56, salary: 5920.28, annualAE: 3, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 1 },
	{ employeeId: 'E007', name: 'Jubaidah', dept: 'IPP', role: 'PPF', email: 'jubaiyaakob@gmail.com', maxHoursPerMonth: 56, salary: 6125.15, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 1, annualPH: 4 },
	{ employeeId: 'E008', name: 'Cecelia', dept: 'IPP', role: 'PPF', email: 'ceceliaenting@moh.gov.my', maxHoursPerMonth: 56, salary: 5700.25, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 1, annualPH: 3 },
	{ employeeId: 'E009', name: 'Usili', dept: 'IPP', role: 'PPF', email: 'usiligiging@gmail.com', maxHoursPerMonth: 56, salary: 5943.39, annualAE: 3, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 4 },
	{ employeeId: 'E010', name: 'Diana', dept: 'IPP', role: 'PPF', email: 'dianakoumin85@gmail.com', maxHoursPerMonth: 56, salary: 5341.08, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 4 },
	{ employeeId: 'E011', name: 'Ainun', dept: 'OPD', role: 'PPF', email: 'ainray5606@gmail.com', maxHoursPerMonth: 56, salary: 6113.59, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 0, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E012', name: 'Rusdi', dept: 'OPD', role: 'PPF', email: 'rusdirustin017@gmail.com', maxHoursPerMonth: 56, salary: 5931.83, annualAE: 2, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E013', name: 'Belton', dept: 'OPD', role: 'PPF', email: 'unclebob0547@gmail.com', maxHoursPerMonth: 56, salary: 6731.71, annualAE: 2, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E014', name: 'Ngachiran', dept: 'OPD', role: 'PPF', email: 'ngachiranujang@gmail.com', maxHoursPerMonth: 56, salary: 6410.58, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E015', name: 'Riky', dept: 'OPD', role: 'PPF', email: 'rikyarman@gmail.com', maxHoursPerMonth: 56, salary: 5000, annualAE: 3, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E016', name: 'Wedayati', dept: 'OPD', role: 'PPF', email: 'weduts78@gmail.com', maxHoursPerMonth: 56, salary: 5997.65, annualAE: 3, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E017', name: 'Isawati', dept: 'OPD', role: 'PPF', email: 'isawatiyaakob79@gmail.com', maxHoursPerMonth: 56, salary: 5700.25, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 0, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E018', name: 'Raidah', dept: 'OPD', role: 'PPF', email: 'oncell8910@gmail.com', maxHoursPerMonth: 56, salary: 6113.59, annualAE: 2, annualHalfPaidAE: 0, annualPaidAE: 1, annualPHAE: 1, annualPH: 4 },
	{ employeeId: 'E019', name: 'Hilda', dept: 'OPD', role: 'PPF', email: 'hildajoseph821@gmail.com', maxHoursPerMonth: 56, salary: 5821.82, annualAE: 3, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 2 },
	{ employeeId: 'E020', name: 'Julinah', dept: 'OPD', role: 'PPF', email: 'julinahmichael75@gmail.com', maxHoursPerMonth: 56, salary: 6113.59, annualAE: 2, annualHalfPaidAE: 0, annualPaidAE: 2, annualPHAE: 1, annualPH: 3 },
	{ employeeId: 'E021', name: 'Yarnie', dept: 'OPD', role: 'PPF', email: 'yarnie@gmail.com', maxHoursPerMonth: 56, salary: 5920.28, active: false },
	{ employeeId: 'E022', name: 'Brendan', dept: 'IPP', role: 'PPF', email: 'saviojesusbosco@gmail.com', maxHoursPerMonth: 56, salary: 5000, active: false },
	{ employeeId: 'E023', name: 'Solehah', dept: 'OPD', role: 'PPF', email: 'norsolehahsaibine@gmail.com', maxHoursPerMonth: 56, salary: 4064.07, annualAE: 2, annualHalfPaidAE: 0, annualPaidAE: 0, annualPHAE: 0, annualPH: 3 },
	{ employeeId: 'E024', name: 'Selyvester', dept: 'OPD', role: 'PPF', email: 'selykarnain26@gmail.com', maxHoursPerMonth: 56, salary: 6097.68, annualAE: 2, annualHalfPaidAE: 1, annualPaidAE: 1, annualPHAE: 0, annualPH: 2 },
	{ employeeId: 'E025', name: 'Lusia', dept: 'IPP', role: 'PRA', email: 'lusia@gmail.com', maxHoursPerMonth: 40, salary: 3000, annualPH: 3 },
	{ employeeId: 'E026', name: 'Eliezer', dept: 'OPD', role: 'PRA', email: 'eliezer@gmail.com', maxHoursPerMonth: 40, salary: 3000, annualPH: 3 },
	{ employeeId: 'E027', name: 'Jowonis', dept: 'OPD', role: 'PRA', email: 'jowonis@gmail.com', maxHoursPerMonth: 40, salary: 3000, annualPH: 3 },
	{ employeeId: 'E028', name: 'Nelson', dept: 'OPD', role: 'PRA', email: 'nelson@gmail.com', maxHoursPerMonth: 40, salary: 3000, annualPH: 3 }
];

async function seedEmployees() {
	const { hashPassword } = await import('$lib/server/auth');
	for (const emp of employees) {
		const existing = await User.findOne({ employeeId: emp.employeeId });
		if (existing) continue;

		const passwordHash = await hashPassword(emp.employeeId.toLowerCase());
		await User.create({
			...emp,
			passwordHash,
			active: emp.active !== false,
			annualAE: emp.annualAE || 0,
			annualHalfPaidAE: emp.annualHalfPaidAE || 0,
			annualPaidAE: emp.annualPaidAE || 0,
			annualPHAE: emp.annualPHAE || 0,
			annualPH: emp.annualPH || 0,
			userRole: 'Staff'
		});
	}
}

async function seedConfig() {
	const existing = await Config.countDocuments();
	if (existing > 0) return;

	await Config.create({
		adminEmail: 'otadmin@gmail.com',
		defaultMaxHours: 40,
		unavailabilityCutoffDay: 15,
		rosterMonth: new Date('2026-06-01'),
		lastRosterUrl: '',
		lastSummaryUrl: '',
		lastGeneratedMonth: new Date('2026-06-01')
	});
}

async function seedHolidays() {
	const data = [
		{ date: '2026-05-01', name: 'Hari Pekerja' },
		{ date: '2026-05-27', name: 'Hari Raya Aidil Adha' },
		{ date: '2026-05-30', name: 'Hari Kaamatan' },
		{ date: '2026-06-01', name: 'Hari Keputeraan Rasmi Seri Paduka Baginda Yang di-Pertuan Agong' },
		{ date: '2026-06-02', name: 'Cuti Ganti Pesta Kaamatan' },
		{ date: '2026-06-17', name: 'Awal Muharam (Maal Hijrah)' }
	];

	for (const h of data) {
		await Holiday.findOneAndUpdate({ date: h.date }, h, { upsert: true });
	}
}

async function seedAEAssignments() {
	const month = '2026-06-01';
	const data: Record<string, string> = {
		'2026-06-01': 'IPP', '2026-06-02': 'OPD', '2026-06-03': 'IPP',
		'2026-06-05': 'IPP', '2026-06-06': 'OPD', '2026-06-07': 'IPP',
		'2026-06-08': 'OPD', '2026-06-09': 'IPP', '2026-06-10': 'OPD',
		'2026-06-12': 'OPD', '2026-06-13': 'OPD', '2026-06-14': 'IPP',
		'2026-06-15': 'OPD', '2026-06-16': 'IPP', '2026-06-17': 'OPD',
		'2026-06-19': 'IPP', '2026-06-20': 'IPP', '2026-06-21': 'OPD',
		'2026-06-22': 'IPP', '2026-06-23': 'OPD', '2026-06-24': 'IPP',
		'2026-06-26': 'OPD', '2026-06-27': 'IPP', '2026-06-28': 'IPP',
		'2026-06-29': 'OPD', '2026-06-30': 'IPP'
	};

	for (const [date, dept] of Object.entries(data)) {
		await AE_Assignment.findOneAndUpdate(
			{ month, date },
			{ month, date, department: dept },
			{ upsert: true }
		);
	}
}

async function seedPreselections() {
	// No preselections for the initial seed - admin can add these via the UI
}

async function seedUnavailability() {
	const data: Record<string, string[]> = {
		'E001': ['2026-06-04', '2026-06-09', '2026-06-11', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-23', '2026-06-25', '2026-06-30'],
		'E003': ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07'],
		'E005': ['2026-06-12', '2026-06-13', '2026-06-14'],
		'E006': ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-11', '2026-06-19', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'],
		'E008': ['2026-06-01', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-14', '2026-06-21', '2026-06-28'],
		'E011': ['2026-06-13', '2026-06-14', '2026-06-15'],
		'E016': ['2026-06-13', '2026-06-14', '2026-06-15'],
		'E017': ['2026-06-01', '2026-06-02', '2026-06-13', '2026-06-14', '2026-06-15'],
		'E018': ['2026-06-13', '2026-06-14', '2026-06-15'],
		'E019': ['2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-13', '2026-06-14', '2026-06-21', '2026-06-28'],
		'E020': ['2026-06-06', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'],
		'E023': ['2026-06-06', '2026-06-27', '2026-06-28']
	};

	for (const [empId, dates] of Object.entries(data)) {
		for (const date of dates) {
			await Unavailability.findOneAndUpdate(
				{ employeeId: empId, date },
				{ employeeId: empId, date, timestamp: new Date('2026-05-14') },
				{ upsert: true }
			);
		}
	}
}