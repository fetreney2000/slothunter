<script lang="ts">
	import type { LayoutData } from './$types';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { goto } from '$app/navigation';

	let { children, data }: { children: any; data: LayoutData } = $props();
	let drawerOpen = $state(false);

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}

	const navItems = [
		{ href: '/admin', icon: '📊', label: 'Papan Pemuka' },
		{ href: '/admin/employees', icon: '👥', label: 'Kakitangan' },
		{ href: '/admin/holidays', icon: '🏖️', label: 'Cuti Umum' },
		{ href: '/admin/ae', icon: '🚑', label: 'AE Jabatan' },
		{ href: '/admin/preselections', icon: '📌', label: 'Pra-Pilihan' },
		{ href: '/admin/phases', icon: '🔄', label: 'Fasa' },
		{ href: '/admin/roster', icon: '📅', label: 'Jadual OT' },
		{ href: '/admin/charts', icon: '📈', label: 'Carta' },
		{ href: '/admin/logs', icon: '📋', label: 'Log Audit' },
		{ href: '/admin/eligibility', icon: '✅', label: 'Kelayakan' },
		{ href: '/admin/config', icon: '⚙️', label: 'Tetapan' },
		{ href: '/admin/copyright', icon: '©️', label: 'Hak Cipta' },
	];
</script>

<div class="flex min-h-screen flex-col">
	<AppBar background="bg-surface-100-800-token" border="border-b border-surface-300-600-token">
		{#snippet lead()}
			<button class="btn-icon preset-ghost" onclick={() => (drawerOpen = !drawerOpen)}>
				<span class="text-xl">☰</span>
			</button>
			<span class="ml-2 text-lg font-bold">🦥 Admin</span>
		{/snippet}
		{#snippet trail()}
			<span class="text-sm opacity-60 hidden sm:block">{data.user?.name}</span>
			<button class="btn preset-tonal-surface btn-sm" onclick={handleLogout}>Keluar</button>
		{/snippet}
	</AppBar>

	<div class="flex flex-1">
		{#if drawerOpen}
			<aside class="w-56 bg-surface-100-800-token border-r border-surface-300-600-token p-3 space-y-1 hidden md:block shrink-0">
				{#each navItems as item}
					<a href={item.href} class="btn preset-ghost w-full justify-start text-sm" onclick={() => (drawerOpen = false)}>
						{item.icon} {item.label}
					</a>
				{/each}
			</aside>
		{/if}
		<main class="flex-1 p-4 pb-24 md:pb-4">
			{@render children()}
		</main>
	</div>
</div>

<nav class="fixed bottom-0 left-0 right-0 bg-surface-100-800-token border-t border-surface-300-600-token md:hidden safe-bottom">
	<div class="flex justify-around py-2">
		<a href="/admin" class="flex flex-col items-center gap-1 text-xs"><span class="text-lg">📊</span>Utama</a>
		<a href="/admin/employees" class="flex flex-col items-center gap-1 text-xs"><span class="text-lg">👥</span>Staf</a>
		<a href="/admin/roster" class="flex flex-col items-center gap-1 text-xs"><span class="text-lg">📅</span>Jadual</a>
		<a href="/admin/ae" class="flex flex-col items-center gap-1 text-xs"><span class="text-lg">🚑</span>AE</a>
		<a href="/admin/config" class="flex flex-col items-center gap-1 text-xs"><span class="text-lg">⚙️</span>Tetapan</a>
	</div>
</nav>