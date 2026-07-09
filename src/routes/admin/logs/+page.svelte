<script lang="ts">
	import DatePicker from '$lib/components/DatePicker.svelte';

	let logs = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);
	let filterDate = $state('');

	$effect(() => { loadLogs(); });

	async function loadLogs() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filterDate) params.set('date', filterDate);
			const res = await fetch(`/api/admin/logs?${params}`);
			if (res.ok) { const d = await res.json(); logs = d.logs || []; }
		} finally { loading = false; }
	}

	function fmt(dt: string) { return new Date(dt).toLocaleString('ms-MY'); }
</script>

<svelte:head><title>Log Audit - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Log Audit</h1>

	<div class="flex gap-2">
		<DatePicker bind:value={filterDate} onchange={() => loadLogs()} />
		{#if filterDate}
			<button class="btn preset-tonal-surface" onclick={() => { filterDate = ''; }}>Semua</button>
		{/if}
	</div>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else if logs.length === 0}
		<p class="text-center opacity-40 p-4">Tiada log</p>
	{:else}
		<div class="space-y-1">
			{#each logs as log}
				<div class="card preset-tonal-surface p-3 text-sm">
					<div class="flex items-center justify-between gap-2 mb-1">
						<span class="font-mono text-xs">{fmt(log.changedAt as string)}</span>
						<span class="badge badge-sm {log.action === 'UPDATE' ? 'preset-filled-warning-500' : 'preset-filled-tertiary-500'}">{log.action}</span>
					</div>
					<p><strong>{log.date}</strong> &bull; {log.slot}</p>
					<p class="text-xs opacity-60">
						{log.oldEmployeeName || '(kosong)'} &rarr; {log.newEmployeeName || '(kosong)'}
						{log.oldDept}/{log.newDept} &bull; {log.newHours}h
					</p>
					<p class="text-xs opacity-40">oleh {(log.changedBy as Record<string, unknown>)?.name} ({(log.changedBy as Record<string, unknown>)?.email})</p>
				</div>
			{/each}
		</div>
	{/if}
</div>