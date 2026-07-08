import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCookieName } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete(getCookieName(), { path: '/' });
	return json({ success: true });
};