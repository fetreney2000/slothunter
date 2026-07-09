<script lang="ts">
	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let employees = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);

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

	// Find unfilled slots
	const unfilled = $derived(slots.filter(s => !s.employeeId && s.slotType !== 'POST-AE'));

	// Per-employee summary
	const empStats = $derived(() => {
		const map = new Map<string, { name: string; dept: string; role: string; hours: number; maxHours: number }>();
		for (const e of employees) {
			if (!e.active) continue;
			map.set(e.employeeId as string, { name: e.name as string, dept: e.dept as string, role: e.role as string, hours: 0, maxHours: (e.maxHoursPerMonth as number) || 56 });
		}
		for (const s of slots) {
			if (s.slotType === 'POST-AE' || !s.employeeId) continue;
			const st = map.get(s.employeeId as string);
			if (st) st.hours += (s.hours as number);
		}
		return [...map.values()].sort((a, b) => b.hours - a.hours);
	});
</script>

<svelte:head><title>Log Kelayakan - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Log Kelayakan</h1>
	<select class="select w-auto" bind:value={month}>
		<option value={new Date().toISOString().slice(0, 7) + '-01'}>Bulan Ini</option>
		<option value={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7) + '-01'}>Bulan Lepas</option>
	</select>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		{#if unfilled.length === 0}
			<div class="alert preset-filled-success-500"><p class="text-sm">YA - Semua slot berjaya diisi</p></div>
		{:else}
			<div class="alert preset-filled-error-500">
				<p class="text-sm">{unfilled.length} slot tidak dapat diisi</p>
			</div>
			<div class="space-y-1">
				{#each unfilled as s}
					<div class="flex gap-2 p-2 text-sm card preset-tonal-surface">
						<span class="font-mono">{s.date}</span>
						<span class="badge badge-sm preset-filled-primary-500">{s.slotType}</span>
						<span>{s.day}</span>
					</div>
				{/each}
			</div>
		{/if}

		<div class="card preset-tonal p-4">
			<h3 class="h4 mb-3">Ringkasan Jam Kakitangan</h3>
			<div class="overflow-x-auto">
				<table class="table table-compact w-full text-xs">
					<thead><tr><th>Nama</th><th>Jabatan</th><th>Peranan</th><th>Jam Diguna</th><th>Jam Maks</th><th>Baki</th><th>Layak</th></tr></thead>
					<tbody>
						{#each empStats() as emp}
							{@const remaining = emp.maxHours - emp.hours}
							<tr class="{remaining < 0 ? 'bg-error-500/10' : ''}">
								<td class="font-bold">{emp.name}</td>
								<td>{emp.dept}</td>
								<td>{emp.role}</td>
								<td>{emp.hours}h</td>
								<td>{emp.maxHours}h</td>
								<td>{remaining}h</td>
								<td>{remaining >= 0 ? '✅' : '❌'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>