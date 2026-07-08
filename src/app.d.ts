// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				employeeId: string;
				name: string;
				email: string;
				role: 'admin' | 'staff';
				dept: 'IPP' | 'OPD';
				staffRole: 'PPF' | 'PRA';
			} | null;
		}
		interface PageData {
			user?: App.Locals['user'];
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};