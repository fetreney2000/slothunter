<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const cards = [
		{ href: '/admin/roster', icon: '📅', title: 'Jadual OT', desc: 'Jana & urus roster', color: 'preset-tonal-primary' },
		{ href: '/admin/employees', icon: '👥', title: 'Kakitangan', desc: 'PPF & PA', color: 'preset-tonal-secondary' },
		{ href: '/admin/ae', icon: '🚑', title: 'AE Jabatan', desc: 'Tetapkan IPP/OPD', color: 'preset-tonal-error' },
		{ href: '/admin/preselections', icon: '📌', title: 'Pra-Pilihan', desc: 'Kunci slot', color: 'preset-tonal-warning' },
		{ href: '/admin/phases', icon: '🔄', title: 'Fasa Pilihan', desc: 'Tarikh & kuota', color: 'preset-tonal-primary' },
		{ href: '/admin/holidays', icon: '🏖️', title: 'Cuti Umum', desc: 'Tetapkan hari cuti', color: 'preset-tonal-tertiary' },
		{ href: '/admin/charts', icon: '📈', title: 'Carta', desc: 'Statistik OT', color: 'preset-tonal-success' },
		{ href: '/admin/logs', icon: '📋', title: 'Log Audit', desc: 'Jejak perubahan', color: 'preset-tonal-surface' },
		{ href: '/admin/eligibility', icon: '✅', title: 'Kelayakan', desc: 'Status slot', color: 'preset-tonal-surface' },
		{ href: '/admin/config', icon: '⚙️', title: 'Tetapan', desc: 'Konfigurasi', color: 'preset-tonal-surface' },
	];
</script>

<svelte:head><title>Admin Dashboard - Slothunter</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="h2">Papan Pemuka</h1>
		<p class="opacity-60 mt-1">Selamat datang, {data.user?.name}</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
		{#each cards as card}
			<a href={card.href} class="card {card.color} p-4 md:p-5 hover:ring-2 ring-primary-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
				<span class="text-2xl md:text-3xl block mb-2">{card.icon}</span>
				<h3 class="font-bold text-sm md:text-base">{card.title}</h3>
				<p class="text-xs opacity-60 mt-1">{card.desc}</p>
			</a>
		{/each}
	</div>
</div>