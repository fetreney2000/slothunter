<script lang="ts">
	import type { LayoutData } from './$types';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { goto } from '$app/navigation';

	let { children, data }: { children: any; data: LayoutData } = $props();

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col">
	<AppBar background="bg-surface-100-800-token" border="border-b border-surface-300-600-token">
		{#snippet lead()}
			<span class="text-lg font-bold">🦥 Slothunter</span>
		{/snippet}
		{#snippet trail()}
			<span class="text-sm opacity-60 hidden sm:block">{data.user?.name}</span>
			<button class="btn preset-tonal-surface btn-sm" onclick={handleLogout}>
				Keluar
			</button>
		{/snippet}
	</AppBar>

	<main class="flex-1 p-4 pb-20">
		{@render children()}
	</main>

	<!-- Mobile Bottom Nav -->
	<nav class="fixed bottom-0 left-0 right-0 bg-surface-100-800-token border-t border-surface-300-600-token safe-bottom">
		<div class="flex justify-around py-2">
			<a href="/staff" class="flex flex-col items-center gap-1 text-xs">
				<span class="text-xl">🏠</span>
				Utama
			</a>
			<a href="/staff/unavailability" class="flex flex-col items-center gap-1 text-xs">
				<span class="text-xl">🚫</span>
				Tidak Tersedia
			</a>
			<a href="/staff/roster" class="flex flex-col items-center gap-1 text-xs">
				<span class="text-xl">📅</span>
				Jadual
			</a>
			<a href="/staff/selection" class="flex flex-col items-center gap-1 text-xs">
				<span class="text-xl">✋</span>
				Pilih Slot
			</a>
		</div>
	</nav>
</div>