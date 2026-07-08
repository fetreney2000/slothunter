<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Admin Dashboard - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Papan Pemuka</h1>
	<p class="opacity-60">Selamat datang, {data.user?.name}</p>

	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<a href="/admin/roster" class="card preset-tonal-primary p-4 hover:ring-2 ring-primary-500 transition-all">
			<span class="text-2xl block mb-1">📅</span>
			<h3 class="font-bold">Jadual OT</h3>
			<p class="text-xs opacity-60">Jana & urus roster</p>
		</a>
		<a href="/admin/employees" class="card preset-tonal-secondary p-4 hover:ring-2 ring-secondary-500 transition-all">
			<span class="text-2xl block mb-1">👥</span>
			<h3 class="font-bold">Kakitangan</h3>
			<p class="text-xs opacity-60">PPF & PA</p>
		</a>
		<a href="/admin/ae" class="card preset-tonal-error p-4 hover:ring-2 ring-error-500 transition-all">
			<span class="text-2xl block mb-1">🚑</span>
			<h3 class="font-bold">AE Jabatan</h3>
			<p class="text-xs opacity-60">Tetapkan IPP/OPD</p>
		</a>
		<a href="/admin/preselections" class="card preset-tonal-warning p-4 hover:ring-2 ring-warning-500 transition-all">
			<span class="text-2xl block mb-1">📌</span>
			<h3 class="font-bold">Pra-Pilihan</h3>
			<p class="text-xs opacity-60">Kunci slot kakitangan</p>
		</a>
		<a href="/admin/holidays" class="card preset-tonal-tertiary p-4 hover:ring-2 ring-tertiary-500 transition-all">
			<span class="text-2xl block mb-1">🏖️</span>
			<h3 class="font-bold">Cuti Umum</h3>
			<p class="text-xs opacity-60">Tetapkan hari cuti</p>
		</a>
		<a href="/admin/logs" class="card preset-tonal-surface p-4 hover:ring-2 ring-surface-500 transition-all">
			<span class="text-2xl block mb-1">📋</span>
			<h3 class="font-bold">Log Audit</h3>
			<p class="text-xs opacity-60">Jejak perubahan</p>
		</a>
		<a href="/admin/config" class="card preset-tonal-surface p-4 hover:ring-2 ring-surface-500 transition-all">
			<span class="text-2xl block mb-1">⚙️</span>
			<h3 class="font-bold">Tetapan</h3>
			<p class="text-xs opacity-60">Konfigurasi sistem</p>
		</a>
	</div>
</div>