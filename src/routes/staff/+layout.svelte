<script lang="ts">
	import type { LayoutData } from './$types';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { goto } from '$app/navigation';

	let { children, data }: { children: any; data: LayoutData } = $props();

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}

	const navItems = [
		{ href: '/staff', icon: '🏠', label: 'Utama' },
		{ href: '/staff/unavailability', icon: '🚫', label: 'Tidak Tersedia' },
		{ href: '/staff/roster', icon: '📅', label: 'Jadual' },
		{ href: '/staff/selection', icon: '✋', label: 'Pilih Slot' },
		{ href: '/staff/summary', icon: '📊', label: 'Ringkasan' },
		{ href: '/staff/copyright', icon: '©️', label: 'Hak Cipta' },
	];
</script>

<div class="flex min-h-screen flex-col">
	<AppBar background="bg-surface-100-900" border="border-b border-surface-300-700">
		{#snippet lead()}
			<span class="text-lg font-bold">🦥 Slothunter</span>
		{/snippet}
		{#snippet trail()}
			<!-- Desktop nav links -->
			<div class="hidden md:flex items-center gap-1">
				{#each navItems as item}
					<a href={item.href} class="btn preset-ghost btn-sm text-xs">{item.icon} {item.label}</a>
				{/each}
			</div>
			<span class="text-sm opacity-60 hidden sm:block ml-4">{data.user?.name}</span>
			<button class="btn preset-tonal-surface btn-sm" onclick={handleLogout}>Keluar</button>
		{/snippet}
	</AppBar>

	<main class="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
		{@render children()}
	</main>

	<!-- Mobile bottom nav -->
	<nav class="fixed bottom-0 left-0 right-0 bg-surface-100-900 border-t border-surface-300-700 md:hidden safe-bottom z-50">
		<div class="flex justify-around py-2">
			{#each navItems.slice(0, 5) as item}
				<a href={item.href} class="flex flex-col items-center gap-0.5 text-xs">
					<span class="text-lg">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
</div>