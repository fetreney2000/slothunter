<script lang="ts">
	import type { PageData } from './$types';
	import DatePicker from '$lib/components/DatePicker.svelte';
	let { data }: { data: PageData } = $props();

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let preselections = $state<Array<Record<string, unknown>>>([]);
	let employees = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);
	let newDate = $state('');
	let newSlot = $state('AE');
	let newEmpId = $state('');

	const slotTypes = ['AE','OPD_1','OPD_2','OPD_3','OPD_4','OPD_5','IPP_1','IPP_2','IPP_3','IPP_4','PP_PPF','PP_PRA_1','PP_PRA_2'];

	$effect(() => { loadData(); });

	async function loadData() {
		loading = true;
		try {
			const [presRes, empRes] = await Promise.all([
				fetch(`/api/admin/preselections?month=${month}`),
				fetch('/api/admin/employees')
			]);
			if (presRes.ok) { const d = await presRes.json(); preselections = d.preselections || []; }
			if (empRes.ok) { const d = await empRes.json(); employees = d.employees || []; }
		} finally { loading = false; }
	}

	async function addPreselection() {
		if (!newDate || !newEmpId) return;
		await fetch('/api/admin/preselections', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month, date: newDate, slotType: newSlot, employeeId: newEmpId })
		});
		newDate = ''; newEmpId = '';
		await loadData();
	}

	async function removePreselection(date: string, slotType: string) {
		await fetch('/api/admin/preselections', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month, date, slotType })
		});
		await loadData();
	}

	function empName(id: string) { return employees.find(e => e.employeeId === id)?.name || id; }
</script>

<svelte:head><title>Preselections - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Pra-Pilihan</h1>
	<p class="text-sm opacity-60">Kunci kakitangan ke slot tertentu sebelum solver dijalankan</p>

	<div class="card preset-tonal p-4 space-y-3">
		<h3 class="h4">Tambah Pra-Pilihan</h3>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
			<DatePicker bind:value={newDate} />
			<select class="select" bind:value={newSlot}>
				{#each slotTypes as s}<option value={s}>{s}</option>{/each}
			</select>
			<select class="select" bind:value={newEmpId}>
				<option value="">-- Pilih --</option>
				{#each employees.filter(e => e.active) as emp}
					<option value={emp.employeeId}>{emp.employeeId} - {emp.name}</option>
				{/each}
			</select>
			<button class="btn preset-filled-primary-500" onclick={addPreselection}>Tambah</button>
		</div>
	</div>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="space-y-1">
			<p class="text-sm opacity-60">{preselections.length} pra-pilihan</p>
			{#each preselections as p}
				<div class="flex items-center gap-2 p-2 card preset-tonal-surface">
					<span class="font-mono text-xs">{p.date as string}</span>
					<span class="badge badge-sm preset-filled-primary-500">{p.slotType as string}</span>
					<span class="flex-1 text-sm">{empName(p.employeeId as string)} ({p.employeeId as string})</span>
					<button class="btn btn-sm preset-tonal-error" onclick={() => removePreselection(p.date as string, p.slotType as string)}>Padam</button>
				</div>
			{/each}
		</div>
	{/if}
</div>