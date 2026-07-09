<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const cards = [
		{ href: '/staff/unavailability', icon: '🚫', title: 'Tidak Tersedia', desc: 'Tandakan tarikh cuti', color: 'preset-tonal-error' },
		{ href: '/staff/roster', icon: '📅', title: 'Jadual OT', desc: 'Lihat jadual kerja', color: 'preset-tonal-primary' },
		{ href: '/staff/selection', icon: '✋', title: 'Pilih Slot', desc: 'Pilih slot OT anda', color: 'preset-tonal-success' },
		{ href: '/staff/summary', icon: '📊', title: 'Ringkasan', desc: 'Jam & statistik', color: 'preset-tonal-tertiary' },
	];
</script>

<svelte:head><title>Dashboard - Slothunter</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="h2">Selamat Datang</h1>
		<p class="opacity-60 mt-1">{data.user?.name} ({data.user?.employeeId})</p>
		<p class="text-sm opacity-40">{data.user?.dept} - {data.user?.staffRole}</p>
	</div>

	<div class="grid grid-cols-2 gap-3 md:gap-4">
		{#each cards as card}
			<a href={card.href} class="card {card.color} p-5 md:p-6 text-center hover:ring-2 ring-primary-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
				<span class="text-3xl md:text-4xl block mb-2">{card.icon}</span>
				<h3 class="font-bold text-sm md:text-base">{card.title}</h3>
				<p class="text-xs opacity-60 mt-1">{card.desc}</p>
			</a>
		{/each}
	</div>
</div>