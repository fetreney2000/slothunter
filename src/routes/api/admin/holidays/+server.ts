import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Holiday } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const holidays = await Holiday.find({}).sort({ date: 1 }).lean();
	return json({ holidays });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const { date, name } = await request.json();

	if (!date || !name) {
		return json({ error: 'Tarikh dan nama diperlukan' }, { status: 400 });
	}

	const holiday = await Holiday.findOneAndUpdate(
		{ date },
		{ date, name },
		{ upsert: true, new: true }
	);

	return json({ success: true, holiday });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const { date } = await request.json();

	if (!date) {
		return json({ error: 'Tarikh diperlukan' }, { status: 400 });
	}

	await Holiday.deleteOne({ date });
	return json({ success: true });
};