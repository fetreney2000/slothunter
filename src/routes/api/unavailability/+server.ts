import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Unavailability } from '$lib/server/models';
import { Config } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const employeeId = url.searchParams.get('employeeId') || locals.user.employeeId;
	const month = url.searchParams.get('month'); // YYYY-MM-01

	const query: Record<string, unknown> = { employeeId };
	if (month) {
		// Get all dates in that month
		query.date = {
			$gte: month,
			$lt: month.slice(0, 7) + '-' + '32'
		};
	}

	const records = await Unavailability.find(query).sort({ date: 1 }).lean();
	return json({ records });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	// Check cutoff date
	const config = (await Config.findOne().lean()) as unknown as {
		rosterMonth: Date;
		unavailabilityCutoffDay: number;
	} | null;
	if (config) {
		const now = new Date();
		const rosterMonth = new Date(config.rosterMonth);
		const cutoff = new Date(rosterMonth);
		cutoff.setDate(config.unavailabilityCutoffDay);

		if (now > cutoff && config.rosterMonth) {
			const clonedReq = request.clone();
			const body = await clonedReq.json();
			const requestMonth = body.month;
			if (requestMonth && new Date(requestMonth) <= rosterMonth) {
				return json(
					{ error: `Tarikh tutup unavailability telah tamat (hari ke-${config.unavailabilityCutoffDay})` },
					{ status: 403 }
				);
			}
		}
	}

	const { dates, employeeId } = await request.json();
	const targetId = employeeId || locals.user.employeeId;

	// Staff can only set their own unavailability
	if (locals.user.role !== 'admin' && targetId !== locals.user.employeeId) {
		return json({ error: 'Hanya boleh tetapkan tarikh anda sendiri' }, { status: 403 });
	}

	if (!dates || !Array.isArray(dates) || dates.length === 0) {
		return json({ error: 'Tarikh diperlukan' }, { status: 400 });
	}

	const results = [];
	for (const date of dates) {
		const record = await Unavailability.findOneAndUpdate(
			{ employeeId: targetId, date },
			{ employeeId: targetId, date, timestamp: new Date() },
			{ upsert: true, new: true }
		);
		results.push(record);
	}

	return json({ success: true, count: results.length });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const { dates, employeeId } = await request.json();
	const targetId = employeeId || locals.user.employeeId;

	// Staff can only delete their own
	if (locals.user.role !== 'admin' && targetId !== locals.user.employeeId) {
		return json({ error: 'Hanya boleh padam tarikh anda sendiri' }, { status: 403 });
	}

	if (!dates || !Array.isArray(dates)) {
		return json({ error: 'Tarikh diperlukan' }, { status: 400 });
	}

	await Unavailability.deleteMany({ employeeId: targetId, date: { $in: dates } });
	return json({ success: true });
};