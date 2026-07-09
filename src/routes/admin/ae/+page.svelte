<script lang="ts">
	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let assignments = $state<Record<string, string>>({});
	let loading = $state(true);

	$effect(() => { loadAssignments(); });

	async function loadAssignments() {
		loading = true;
		try {
			const res = await fetch(`/api/admin/ae-assignments?month=${month}`);
			if (res.ok) {
				const data = await res.json();
				const map: Record<string, string> = {};
				for (const a of data.assignments) map[a.date] = a.department;
				assignments = map;
			}
		} finally { loading = false; }
	}

	async function setDept(date: string, dept: string) {
		await fetch('/api/admin/ae-assignments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month, date, department: dept })
		});
		assignments = { ...assignments, [date]: dept };
	}

	function getDays() {
		const y = parseInt(month.slice(0, 4));
		const m = parseInt(month.slice(5, 7));
		const days: { date: string; dow: number; name: string }[] = [];
		const names = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
		for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
			const dateStr = `${month.slice(0, 7)}-${String(d).padStart(2, '0')}`;
			const dow = new Date(dateStr + 'T00:00:00').getDay();
			days.push({ date: dateStr, dow, name: names[dow] });
		}
		return days;
	}

	function prevMonth() { const d = new Date(month); d.setMonth(d.getMonth() - 1); month = d.toISOString().slice(0, 7) + '-01'; }
	function nextMonth() { const d = new Date(month); d.setMonth(d.getMonth() + 1); month = d.toISOString().slice(0, 7) + '-01'; }

	const monthName = $derived(new Date(month + 'T00:00:00').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }));
</script>

<svelte:head><title>AE Assignments - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Farmasi Kecemasan (AE)</h1>
	<p class="text-sm opacity-60">Tetapkan jabatan (IPP/OPD) untuk slot AE setiap hari</p>

	<div class="flex items-center justify-between">
		<button class="btn preset-tonal-surface" onclick={prevMonth}>&laquo;</button>
		<h3 class="h4">{monthName}</h3>
		<button class="btn preset-tonal-surface" onclick={nextMonth}>&raquo;</button>
	</div>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="space-y-1">
			{#each getDays() as day}
				<div class="flex items-center gap-2 p-2 rounded {day.dow === 0 || day.dow === 6 ? 'bg-surface-200-800' : ''}">
					<span class="w-10 text-xs">{day.date.split('-')[2]}</span>
					<span class="w-10 text-xs opacity-60">{day.name}</span>
					<div class="flex gap-1 flex-1">
						<button
							class="btn btn-sm {assignments[day.date] === 'IPP' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
							onclick={() => setDept(day.date, 'IPP')}
						>IPP</button>
						<button
							class="btn btn-sm {assignments[day.date] === 'OPD' ? 'preset-filled-success-500' : 'preset-tonal-surface'}"
							onclick={() => setDept(day.date, 'OPD')}
						>OPD</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>