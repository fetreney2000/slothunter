<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	const redirect = $derived(page.url.searchParams.get('redirect') || '/dashboard');

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!email || !password) { error = 'Sila isi semua medan'; return; }
		loading = true; error = '';
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok) { error = data.error || 'Ralat log masuk'; return; }
			if (data.user.role === 'admin') await goto(redirect.startsWith('/admin') ? redirect : '/admin');
			else await goto(redirect.startsWith('/staff') ? redirect : '/staff');
		} catch { error = 'Ralat rangkaian.'; }
		finally { loading = false; }
	}
</script>

<svelte:head><title>Log Masuk - Slothunter</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 to-surface-200-800 p-4">
	<div class="card w-full max-w-md p-8 md:p-10 space-y-6 shadow-xl">
		<div class="flex flex-col items-center gap-3">
			<span class="text-6xl">🦥</span>
			<h1 class="h2 font-bold">Log Masuk</h1>
			<p class="text-sm opacity-60 text-center">Sistem OT Farmasi Hospital Keningau</p>
		</div>

		<hr class="hr" />

		{#if error}
			<div class="alert preset-filled-error-500 animate-in">
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-5">
			<label class="label">
				<span class="text-sm font-medium">Email</span>
				<input type="email" class="input" placeholder="contoh@email.com" bind:value={email} disabled={loading} autocomplete="email" />
			</label>
			<label class="label">
				<span class="text-sm font-medium">Kata Laluan</span>
				<input type="password" class="input" bind:value={password} disabled={loading} autocomplete="current-password" />
			</label>
			<button type="submit" class="btn preset-filled-primary-500 w-full text-lg py-3 shadow-lg" disabled={loading}>
				{loading ? 'Log Masuk...' : 'Log Masuk'}
			</button>
		</form>

		<p class="text-center text-xs opacity-30">PPF &bull; PA &bull; Jabatan Farmasi</p>
	</div>
</div>