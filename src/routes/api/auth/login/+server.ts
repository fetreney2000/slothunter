import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateUser, getCookieName } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json(
				{ error: 'Email dan kata laluan diperlukan' },
				{ status: 400 }
			);
		}

		const result = await authenticateUser(email, password);

		if (!result) {
			return json(
				{ error: 'Email atau kata laluan salah' },
				{ status: 401 }
			);
		}

		// Set HTTP-only cookie
		cookies.set(getCookieName(), result.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		return json({
			success: true,
			user: {
				employeeId: result.user.employeeId,
				name: result.user.name,
				email: result.user.email,
				role: result.user.role,
				dept: result.user.dept,
				staffRole: result.user.staffRole
			}
		});
	} catch (err) {
		console.error('Login error:', err);
		return json({ error: 'Ralat pelayan dalaman' }, { status: 500 });
	}
};