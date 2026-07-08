import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Config } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	let config = await Config.findOne().lean();

	// Create default config if none exists
	if (!config) {
		await Config.create({
			adminEmail: 'otadmin@gmail.com',
			defaultMaxHours: 40,
			unavailabilityCutoffDay: 15,
			rosterMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
		});
		config = await Config.findOne().lean();
	}

	return json({ config });
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const body = await request.json();
	const {
		adminEmail,
		defaultMaxHours,
		unavailabilityCutoffDay,
		rosterMonth,
		lastRosterUrl,
		lastSummaryUrl
	} = body;

	const update: Record<string, unknown> = {};
	if (adminEmail !== undefined) update.adminEmail = adminEmail;
	if (defaultMaxHours !== undefined) update.defaultMaxHours = Number(defaultMaxHours);
	if (unavailabilityCutoffDay !== undefined)
		update.unavailabilityCutoffDay = Number(unavailabilityCutoffDay);
	if (rosterMonth !== undefined) update.rosterMonth = new Date(rosterMonth);
	if (lastRosterUrl !== undefined) update.lastRosterUrl = lastRosterUrl;
	if (lastSummaryUrl !== undefined) update.lastSummaryUrl = lastSummaryUrl;

	const config = await Config.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
	return json({ success: true, config });
};