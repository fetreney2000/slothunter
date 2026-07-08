<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard - Slothunter</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="h2">Selamat Datang</h1>
	<p class="opacity-60">{data.user?.name} ({data.user?.employeeId})</p>
	<p class="text-sm opacity-40">{data.user?.dept} - {data.user?.staffRole}</p>

	<div class="grid grid-cols-2 gap-4">
		<a href="/staff/unavailability" class="card preset-tonal-error p-6 text-center hover:ring-2 ring-error-500 transition-all">
			<span class="text-3xl block mb-2">🚫</span>
			<h3 class="h4">Tidak Tersedia</h3>
			<p class="text-xs opacity-60 mt-1">Tandakan tarikh cuti</p>
		</a>
		<a href="/staff/roster" class="card preset-tonal-primary p-6 text-center hover:ring-2 ring-primary-500 transition-all">
			<span class="text-3xl block mb-2">📅</span>
			<h3 class="h4">Jadual OT</h3>
			<p class="text-xs opacity-60 mt-1">Lihat jadual kerja</p>
		</a>
		<a href="/staff/selection" class="card preset-tonal-success p-6 text-center hover:ring-2 ring-success-500 transition-all">
			<span class="text-3xl block mb-2">✋</span>
			<h3 class="h4">Pilih Slot</h3>
			<p class="text-xs opacity-60 mt-1">Pilih slot OT anda</p>
		</a>
		<a href="/staff/summary" class="card preset-tonal-tertiary p-6 text-center hover:ring-2 ring-tertiary-500 transition-all">
			<span class="text-3xl block mb-2">📊</span>
			<h3 class="h4">Ringkasan</h3>
			<p class="text-xs opacity-60 mt-1">Jam & statistik</p>
		</a>
	</div>
</div>