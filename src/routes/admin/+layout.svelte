<script lang="ts">
	import type { LayoutData } from './$types';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { goto } from '$app/navigation';

	let { children, data }: { children: any; data: LayoutData } = $props();
	let mobileMenuOpen = $state(false);

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

<div class="flex min-h-screen">
	<!-- Desktop Sidebar - always visible on md+ -->
	<aside class="hidden md:flex flex-col w-56 bg-surface-100-900 border-r border-surface-300-700 shrink-0">
		<div class="p-4 border-b border-surface-300-700">
			<a href="/admin" class="flex items-center gap-2">
				<span class="text-2xl">🦥</span>
				<span class="text-lg font-bold">Admin</span>
			</a>
		</div>
		<nav class="flex-1 p-2 space-y-0.5 overflow-y-auto">
			{#each navItems as item}
				<a href={item.href} class="btn preset-ghost w-full justify-start text-sm rounded-lg">
					<span class="mr-2">{item.icon}</span>{item.label}
				</a>
			{/each}
		</nav>
		<div class="p-3 border-t border-surface-300-700">
			<p class="text-xs opacity-60 truncate">{data.user?.name}</p>
			<button class="btn preset-tonal-error btn-sm w-full mt-1" onclick={handleLogout}>
				Keluar
			</button>
		</div>
	</aside>

	<!-- Main content area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Top bar (mobile + desktop) -->
		<AppBar background="bg-surface-100-900" border="border-b border-surface-300-700">
			{#snippet lead()}
				<button class="btn-icon preset-ghost md:hidden" onclick={() => (mobileMenuOpen = !mobileMenuOpen)}>
					<span class="text-xl">☰</span>
				</button>
				<span class="ml-2 text-lg font-bold md:hidden">🦥 Admin</span>
			{/snippet}
			{#snippet trail()}
				<span class="text-sm opacity-60 hidden sm:block">{data.user?.name}</span>
				<button class="btn preset-tonal-surface btn-sm hidden md:inline-flex" onclick={handleLogout}>Keluar</button>
			{/snippet}
		</AppBar>

		<!-- Mobile dropdown menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden bg-surface-100-900 border-b border-surface-300-700 p-2 space-y-1">
				{#each navItems as item}
					<a href={item.href} class="btn preset-ghost w-full justify-start text-sm" onclick={() => (mobileMenuOpen = false)}>
						<span class="mr-2">{item.icon}</span>{item.label}
					</a>
				{/each}
				<button class="btn preset-tonal-error btn-sm w-full mt-2" onclick={handleLogout}>Keluar</button>
			</div>
		{/if}

		<!-- Page content -->
		<main class="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
			{@render children()}
		</main>
	</div>
</div>

<!-- Mobile bottom nav -->
<nav class="fixed bottom-0 left-0 right-0 bg-surface-100-900 border-t border-surface-300-700 md:hidden safe-bottom z-50">
	<div class="flex justify-around py-2">
		<a href="/admin" class="flex flex-col items-center gap-0.5 text-xs"><span class="text-lg">📊</span>Utama</a>
		<a href="/admin/employees" class="flex flex-col items-center gap-0.5 text-xs"><span class="text-lg">👥</span>Staf</a>
		<a href="/admin/roster" class="flex flex-col items-center gap-0.5 text-xs"><span class="text-lg">📅</span>Jadual</a>
		<a href="/admin/ae" class="flex flex-col items-center gap-0.5 text-xs"><span class="text-lg">🚑</span>AE</a>
		<a href="/admin/config" class="flex flex-col items-center gap-0.5 text-xs"><span class="text-lg">⚙️</span>Tetapan</a>
	</div>
</nav>