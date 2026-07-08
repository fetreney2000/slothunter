import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { RosterLog } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const rosterId = url.searchParams.get('rosterId');
	const date = url.searchParams.get('date');
	const limit = parseInt(url.searchParams.get('limit') || '100');

	const q: Record<string, unknown> = {};
	if (rosterId) q.rosterId = rosterId;
	if (date) q.date = date;

	// Staff can only see logs for their own changes
	if (locals.user.role !== 'admin') {
		q['changedBy.email'] = locals.user.email;
	}

	const logs = await RosterLog.find(q).sort({ changedAt: -1 }).limit(limit).lean();
	return json({ logs });
};