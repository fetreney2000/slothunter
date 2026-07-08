<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard - Slothunter</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="h2">Papan Pemuka Admin</h1>
	<p class="opacity-60">Selamat datang, {data.user?.name}</p>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		<a href="/admin/roster" class="card preset-tonal-primary p-6 hover:ring-2 ring-primary-500 transition-all">
			<h3 class="h3">📅 Jadual OT</h3>
			<p class="text-sm opacity-60 mt-2">Urus jadual kerja lebih masa</p>
		</a>
		<a href="/admin/employees" class="card preset-tonal-secondary p-6 hover:ring-2 ring-secondary-500 transition-all">
			<h3 class="h3">👥 Kakitangan</h3>
			<p class="text-sm opacity-60 mt-2">Senarai PPF & PA</p>
		</a>
		<a href="/admin/holidays" class="card preset-tonal-tertiary p-6 hover:ring-2 ring-tertiary-500 transition-all">
			<h3 class="h3">🏖️ Cuti Umum</h3>
			<p class="text-sm opacity-60 mt-2">Tetapkan hari cuti</p>
		</a>
		<a href="/admin/config" class="card preset-tonal-surface p-6 hover:ring-2 ring-surface-500 transition-all">
			<h3 class="h3">⚙️ Tetapan</h3>
			<p class="text-sm opacity-60 mt-2">Konfigurasi sistem</p>
		</a>
	</div>
</div>