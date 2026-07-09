<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let employees = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);
	let chartEl: HTMLCanvasElement;

	$effect(() => { loadData(); });

	async function loadData() {
		loading = true;
		try {
			const [rRes, eRes] = await Promise.all([
				fetch(`/api/roster?month=${month}`),
				fetch('/api/admin/employees')
			]);
			if (rRes.ok) { const d = await rRes.json(); slots = d.slots || []; }
			if (eRes.ok) { const d = await eRes.json(); employees = d.employees || []; }
		} finally { loading = false; }
	}

	// Compute stats per employee
	const stats = $derived(() => {
		const map = new Map<string, { name: string; dept: string; role: string; totalHours: number; aeCount: number; phCount: number; slotCount: number }>();
		for (const e of employees) {
			if (!e.active) continue;
			map.set(e.employeeId as string, { name: e.name as string, dept: e.dept as string, role: e.role as string, totalHours: 0, aeCount: 0, phCount: 0, slotCount: 0 });
		}
		// Track holidays
		const holidayDates = new Set<string>();
		for (const s of slots) {
			if (s.day === 'CUTI UMUM') holidayDates.add(s.date as string);
		}

		for (const s of slots) {
			if (s.slotType === 'POST-AE' || !s.employeeId) continue;
			const st = map.get(s.employeeId as string);
			if (!st) continue;
			st.totalHours += (s.hours as number);
			st.slotCount++;
			if (s.slotType === 'AE') st.aeCount++;
			if (holidayDates.has(s.date as string)) st.phCount++;
		}
		return [...map.values()].sort((a, b) => b.totalHours - a.totalHours);
	});

	const totalHours = $derived(stats().reduce((s, e) => s + e.totalHours, 0));
</script>

<svelte:head><title>Carta OT - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Carta Statistik OT</h1>
	<div class="flex gap-2">
		<select class="select w-auto" bind:value={month}>
			<option value={new Date().toISOString().slice(0, 7) + '-01'}>Bulan Ini</option>
			<option value={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7) + '-01'}>Bulan Lepas</option>
		</select>
	</div>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<!-- Summary Cards -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="card preset-tonal-primary p-3 text-center">
				<p class="text-2xl font-bold">{totalHours}</p>
				<p class="text-xs opacity-60">Jumlah Jam</p>
			</div>
			<div class="card preset-tonal-secondary p-3 text-center">
				<p class="text-2xl font-bold">{stats().filter(e => e.role === 'PPF').length}</p>
				<p class="text-xs opacity-60">PPF Aktif</p>
			</div>
			<div class="card preset-tonal-tertiary p-3 text-center">
				<p class="text-2xl font-bold">{stats().filter(e => e.role === 'PRA').length}</p>
				<p class="text-xs opacity-60">PRA Aktif</p>
			</div>
			<div class="card preset-tonal-error p-3 text-center">
				<p class="text-2xl font-bold">{stats().reduce((s, e) => s + e.aeCount, 0)}</p>
				<p class="text-xs opacity-60">AE Jumlah</p>
			</div>
		</div>

		<!-- Hours Chart (bar representation) -->
		<div class="card preset-tonal p-4 space-y-3">
			<h3 class="h4">Jam OT Mengikut Kakitangan</h3>
			{#each stats() as emp}
				{@const maxHrs = (employees.find(e => e.employeeId === emp.name)?.maxHoursPerMonth as number) || 56}
				{@const pct = Math.min((emp.totalHours / maxHrs) * 100, 100)}
				<div class="space-y-1">
					<div class="flex justify-between text-xs">
						<span class="font-bold">{emp.name} <span class="opacity-60">({emp.dept}/{emp.role})</span></span>
						<span>{emp.totalHours}h / {maxHrs}h ({Math.round(pct)}%)</span>
					</div>
					<div class="w-full bg-surface-300-700 rounded-full h-4 overflow-hidden">
						<div class="h-4 rounded-full transition-all {pct > 90 ? 'bg-error-500' : pct > 70 ? 'bg-warning-500' : 'bg-primary-500'}"
							style="width: {pct}%"></div>
					</div>
				</div>
			{/each}
		</div>

		<!-- AE Count Table -->
		<div class="card preset-tonal p-4">
			<h3 class="h4 mb-3">Bilangan AE & Cuti Umum</h3>
			<div class="overflow-x-auto">
				<table class="table table-compact w-full text-xs">
					<thead><tr><th>Kakitangan</th><th>Jabatan</th><th>Peranan</th><th>Jam</th><th>AE</th><th>PH</th></tr></thead>
					<tbody>
						{#each stats() as emp}
							<tr>
								<td class="font-bold">{emp.name}</td>
								<td>{emp.dept}</td>
								<td>{emp.role}</td>
								<td>{emp.totalHours}h</td>
								<td>{emp.aeCount}</td>
								<td>{emp.phCount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>