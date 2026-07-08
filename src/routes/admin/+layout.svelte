<script lang="ts">
	import type { LayoutData } from './$types';
	import { AppBar, Navigation } from '@skeletonlabs/skeleton-svelte';
	import { goto } from '$app/navigation';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let drawerOpen = $state(false);

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Top App Bar -->
	<AppBar background="bg-surface-100-800-token" border="border-b border-surface-300-600-token">
		{#snippet lead()}
			<button class="btn-icon preset-ghost" onclick={() => (drawerOpen = !drawerOpen)}>
				<span class="text-xl">☰</span>
			</button>
			<span class="ml-2 text-lg font-bold">🦥 Admin</span>
		{/snippet}
		{#snippet trail()}
			<span class="text-sm opacity-60 hidden sm:block">{data.user?.name}</span>
			<button class="btn preset-tonal-surface btn-sm" onclick={handleLogout}>
				Keluar
			</button>
		{/snippet}
	</AppBar>

	<div class="flex flex-1">
		<!-- Sidebar Navigation (desktop) -->
		{#if drawerOpen}
			<aside class="w-64 bg-surface-100-800-token border-r border-surface-300-600-token p-4 space-y-2 hidden md:block">
				<a href="/admin" class="btn preset-ghost w-full justify-start">📊 Papan Pemuka</a>
				<a href="/admin/employees" class="btn preset-ghost w-full justify-start">👥 Kakitangan</a>
				<a href="/admin/roster" class="btn preset-ghost w-full justify-start">📅 Jadual OT</a>
				<a href="/admin/holidays" class="btn preset-ghost w-full justify-start">🏖️ Cuti Umum</a>
				<a href="/admin/config" class="btn preset-ghost w-full justify-start">⚙️ Tetapan</a>
			</aside>
		{/if}

		<!-- Main Content -->
		<main class="flex-1 p-4">
			{@render children()}
		</main>
	</div>
</div>

<!-- Mobile Bottom Nav -->
<nav class="fixed bottom-0 left-0 right-0 bg-surface-100-800-token border-t border-surface-300-600-token md:hidden safe-bottom">
	<div class="flex justify-around py-2">
		<a href="/admin" class="flex flex-col items-center gap-1 text-xs">
			<span class="text-xl">📊</span>
			Utama
		</a>
		<a href="/admin/employees" class="flex flex-col items-center gap-1 text-xs">
			<span class="text-xl">👥</span>
			Staf
		</a>
		<a href="/admin/roster" class="flex flex-col items-center gap-1 text-xs">
			<span class="text-xl">📅</span>
			Jadual
		</a>
		<a href="/admin/config" class="flex flex-col items-center gap-1 text-xs">
			<span class="text-xl">⚙️</span>
			Tetapan
		</a>
	</div>
</nav>