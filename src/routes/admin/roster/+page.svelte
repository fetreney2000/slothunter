<script lang="ts">
	import DatePicker from '$lib/components/DatePicker.svelte';
	import { exportRosterToExcel } from '$lib/exportRoster';

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let running = $state(false);
	let progress = $state(0);
	let progressMessage = $state('');
	let result = $state<Record<string, unknown> | null>(null);
	let error = $state('');
	let searchStepLimit = $state(100000);
	let solverMode = $state('all'); // 'all', 'ae_holidays', 'cleanup'
	let rosterStatus = $state('');
	let rosterId = $state('');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let loadingSlots = $state(false);

	async function runSolver() {
		running = true; progress = 0; progressMessage = 'Memuatkan data...'; error = ''; result = null;
		try {
			const inputRes = await fetch('/api/admin/solver', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month, searchStepLimit, solverMode })
			});
			if (!inputRes.ok) { error = (await inputRes.json()).error || 'Gagal'; running = false; return; }
			const { solverInput } = await inputRes.json();

			const worker = new Worker(new URL('$lib/workers/rosterSolver.worker.ts', import.meta.url), { type: 'module' });
			worker.onmessage = async (e) => {
				const msg = e.data;
				if (msg.type === 'progress') { progress = msg.progress; progressMessage = msg.message || ''; }
				else if (msg.type === 'complete') {
					progress = 100; progressMessage = 'Selesai!';
					const saveRes = await fetch('/api/admin/solver', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ rosterId: msg.data.rosterId, month, slots: msg.data.slots, metrics: msg.data.metrics, warnings: msg.data.warnings, status: 'Draft' })
					});
					if (saveRes.ok) {
						const sd = await saveRes.json();
						result = { rosterId: sd.rosterId, slotsCount: sd.slotsCount, metrics: msg.data.metrics, warnings: msg.data.warnings, elapsedMs: msg.data.elapsedMs };
						await loadRoster();
					}
					worker.terminate(); running = false;
				} else if (msg.type === 'error') { error = msg.message; worker.terminate(); running = false; }
			};
			worker.onerror = (err) => { error = `Worker error: ${err.message}`; worker.terminate(); running = false; };
			worker.postMessage(solverInput);
		} catch (err) { error = `Ralat: ${err instanceof Error ? err.message : 'Unknown'}`; running = false; }
	}

	async function loadRoster() {
		loadingSlots = true;
		try {
			const res = await fetch(`/api/roster?month=${month}`);
			if (res.ok) {
				const data = await res.json();
				slots = data.slots || [];
				if (data.roster) { rosterStatus = data.roster.status; rosterId = data.roster.rosterId; }
			}
		} finally { loadingSlots = false; }
	}

	$effect(() => { loadRoster(); });

	async function setStatus(status: string) {
		if (!rosterId) return;
		await fetch('/api/admin/roster', {
			method: 'PUT', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rosterId, status })
		});
		await loadRoster();
	}

	async function copyRoster() {
		if (!rosterId) return;
		const res = await fetch('/api/admin/roster', {
			method: 'PUT', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rosterId, action: 'copy' })
		});
		if (res.ok) { alert('Copy roster berjaya dibuat!'); }
	}

	async function exportExcel() {
		try {
			if (slots.length === 0) {
				alert('Tiada data untuk dieksport');
				return;
			}
			// Derive holiday dates from slots (CUTI UMUM day label)
			const holidayDates = new Set<string>();
			for (const s of slots) {
				if (s.day === 'CUTI UMUM') holidayDates.add(s.date as string);
			}
			await exportRosterToExcel(
				month,
				slots.map(s => ({
					date: s.date as string,
					day: s.day as string,
					slotType: s.slotType as string,
					employeeName: (s.employeeName as string) || ''
				})),
				holidayDates
			);
		} catch (err) {
			alert('Ralat mengeksport: ' + (err instanceof Error ? err.message : 'Unknown'));
		}
	}
</script>

<svelte:head><title>Jadual OT - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Jadual OT</h1>

	<!-- Controls -->
	<div class="card preset-tonal p-4 space-y-3">
		<div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
			<label class="label"><span>Bulan</span>
				<DatePicker bind:value={month} />
			</label>
			<label class="label"><span>Mod Solver</span>
				<select class="select" bind:value={solverMode}>
					<option value="all">Semua Slot</option>
					<option value="ae_holidays">AE & Cuti Sahaja</option>
					<option value="cleanup">Baki (Cleanup)</option>
				</select>
			</label>
			<label class="label"><span>Had Carian</span><input type="number" class="input" bind:value={searchStepLimit} min="10000" step="10000" /></label>
			<div class="flex items-end gap-2">
				<button class="btn preset-filled-primary-500 flex-1" onclick={runSolver} disabled={running}>
					{running ? 'Menjalankan...' : '🚀 Solver'}
				</button>
				<button class="btn preset-filled-success-500" onclick={exportExcel} disabled={!slots.length}>
					📥 Excel
				</button>
			</div>
		</div>
	</div>

	<!-- Progress -->
	{#if running}
		<div class="card preset-tonal p-4 space-y-2">
			<div class="flex justify-between text-sm"><span>{progressMessage}</span><span>{progress}%</span></div>
			<div class="w-full bg-surface-200-800 rounded-full h-3">
				<div class="bg-primary-500 h-3 rounded-full transition-all" style="width: {progress}%"></div>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="alert preset-filled-error-500"><p class="text-sm">{error}</p>
			<button class="btn-icon" onclick={() => (error = '')}>✕</button></div>
	{/if}

	<!-- Result -->
	{#if result}
		{@const warningsArr = result.warnings as Array<unknown>}
		<div class="card preset-tonal-success p-4 space-y-2">
			<h3 class="h4">✅ Keputusan</h3>
			<div class="grid grid-cols-3 gap-2 text-sm">
				<div><p class="opacity-60">Slot</p><p class="font-bold">{result.slotsCount}</p></div>
				<div><p class="opacity-60">Masa</p><p class="font-bold">{((result.elapsedMs as number)/1000).toFixed(1)}s</p></div>
				<div><p class="opacity-60">Penalti</p><p class="font-bold">{(result.metrics as Record<string,unknown>)?.hardPenalty}</p></div>
			</div>
			{#if (warningsArr?.length ?? 0) > 0}
				<details class="text-xs"><summary>Amaran ({warningsArr.length})</summary>
					<ul class="list-disc pl-4">{#each warningsArr as w}<li>{w}</li>{/each}</ul>
				</details>
			{/if}
		</div>
	{/if}

	<!-- Roster Status & Actions -->
	{#if rosterId}
		<div class="card preset-tonal p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="h4">Status: <span class="badge preset-filled-primary-500">{rosterStatus}</span></h3>
				<span class="text-xs opacity-60 font-mono">{rosterId}</span>
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each ['Draft','Phase1','Phase2','Phase3','Final'] as s}
					<button class="btn btn-sm {rosterStatus === s ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
						onclick={() => setStatus(s)}>{s}</button>
				{/each}
				<button class="btn btn-sm preset-filled-tertiary-500" onclick={copyRoster}>📋 Salin Roster</button>
				<a href="/admin/roster/edit" class="btn btn-sm preset-tonal-primary">✏️ Edit</a>
				<a href="/admin/logs" class="btn btn-sm preset-tonal-surface">📋 Log</a>
			</div>
		</div>
	{/if}

	<!-- Slots Table -->
	{#if loadingSlots}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else if slots.length > 0}
		<div class="overflow-x-auto">
			<table class="table table-hover table-compact w-full text-xs">
				<thead><tr><th>Tarikh</th><th>Hari</th><th>Slot</th><th>Kakitangan</th><th>Jabatan</th><th>Jam</th></tr></thead>
				<tbody>
					{#each slots as s}
						{#if s.slotType !== 'POST-AE'}
							<tr class="{!s.employeeId ? 'bg-error-500/10' : ''}">
								<td class="whitespace-nowrap">{s.date}</td>
								<td>{s.day}</td>
								<td><span class="badge badge-sm {s.slotType === 'AE' ? 'preset-filled-error-500' : (s.slotType as string)?.startsWith('IPP_') ? 'preset-filled-primary-500' : 'preset-filled-success-500'}">{s.slotType}</span></td>
								<td>{s.employeeName || '(kosong)'}</td>
								<td>{s.dept}</td>
								<td>{s.hours}h</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>