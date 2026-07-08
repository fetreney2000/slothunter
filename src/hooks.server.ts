import type { Handle } from '@sveltejs/kit';
import { verifyToken, getCookieName } from '$lib/server/auth';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/api/auth/login', '/api/health'];

// Admin-only routes
const ADMIN_ROUTE_PREFIXES = ['/admin', '/api/admin'];

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/auth');
}

function isAdminRoute(pathname: string): boolean {
	return ADMIN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(getCookieName());

	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = {
				employeeId: payload.employeeId,
				name: payload.name,
				email: payload.email,
				role: payload.role,
				dept: payload.dept,
				staffRole: payload.staffRole
			};
		} else {
			// Invalid token, clear it
			event.locals.user = null;
			event.cookies.delete(getCookieName(), { path: '/' });
		}
	} else {
		event.locals.user = null;
	}

	const pathname = event.url.pathname;

	// Allow public routes
	if (isPublicRoute(pathname)) {
		return resolve(event);
	}

	// Require authentication for all other routes
	if (!event.locals.user) {
		// API routes return 401
		if (pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		// Page routes redirect to login
		return new Response(null, {
			status: 302,
			headers: { Location: `/login?redirect=${encodeURIComponent(pathname)}` }
		});
	}

	// Check admin-only routes
	if (isAdminRoute(pathname) && event.locals.user.role !== 'admin') {
		if (pathname.startsWith('/api/')) {
			return new Response(
				JSON.stringify({ error: 'Forbidden: Admin access required' }),
				{ status: 403, headers: { 'Content-Type': 'application/json' } }
			);
		}
		return new Response(null, {
			status: 302,
			headers: { Location: '/dashboard' }
		});
	}

	return resolve(event);
};