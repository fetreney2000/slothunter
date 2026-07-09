<script lang="ts">
	import type { PageData } from './$types';
	import MonthPicker from '$lib/components/MonthPicker.svelte';
	let { data }: { data: PageData } = $props();

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let employees = $state<Array<Record<string, unknown>>>([]);
	let rosterId = $state('');
	let isCopy = $state(false);
	let loading = $state(true);
	let editingSlot = $state<Record<string, unknown> | null>(null);
	let newEmpId = $state('');

	$effect(() => { loadData(); });

	async function loadData() {
		loading = true;
		try {
			const [rRes, eRes] = await Promise.all([
				fetch(`/api/roster?month=${month}`),
				fetch('/api/admin/employees')
			]);
			if (rRes.ok) { const d = await rRes.json(); slots = d.slots || []; rosterId = d.roster?.rosterId || ''; isCopy = d.roster?.isCopy || false; }
			if (eRes.ok) { const d = await eRes.json(); employees = d.employees || []; }
		} finally { loading = false; }
	}

	function startEdit(slot: Record<string, unknown>) {
		editingSlot = slot;
		newEmpId = (slot.employeeId as string) || '';
	}

	async function saveEdit() {
		if (!editingSlot || !rosterId) return;
		const emp = employees.find(e => e.employeeId === newEmpId);
		await fetch('/api/admin/roster', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				rosterId,
				action: 'updateSlot',
				date: editingSlot.date,
				slotType: editingSlot.slotType,
				newEmployeeId: newEmpId,
				newEmployeeName: emp?.name || '',
				newDept: emp?.dept || editingSlot.dept,
				newRole: emp?.role || editingSlot.role,
				newHours: editingSlot.hours
			})
		});
		editingSlot = null;
		await loadData();
	}

	function cancelEdit() { editingSlot = null; }

	const filteredSlots = $derived(slots.filter(s => s.slotType !== 'POST-AE'));
</script>

<svelte:head><title>Edit Roster - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Edit Roster</h1>
	<div class="flex gap-2">
		<MonthPicker bind:value={month} />
		{#if rosterId}
			<span class="badge {isCopy ? 'preset-filled-warning-500' : 'preset-filled-primary-500'}">
				{isCopy ? 'Copy' : 'Original'} &bull; {rosterId.slice(-8)}
			</span>
		{/if}
	</div>

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="table table-hover table-compact w-full text-xs">
				<thead><tr><th>Tarikh</th><th>Slot</th><th>Kakitangan</th><th>Jabatan</th><th>Jam</th><th>Tindakan</th></tr></thead>
				<tbody>
					{#each filteredSlots as s}
						<tr class="{!s.employeeId ? 'bg-error-500/10' : ''} {editingSlot === s ? 'ring-2 ring-primary-500' : ''}">
							<td class="whitespace-nowrap">{s.date} ({s.day})</td>
							<td>
								<span class="badge badge-sm {s.slotType === 'AE' ? 'preset-filled-error-500' : (s.slotType as string)?.startsWith('IPP_') ? 'preset-filled-primary-500' : 'preset-filled-success-500'}">
									{s.slotType}
								</span>
							</td>
							<td>{s.employeeName || '(kosong)'}</td>
							<td>{s.dept}</td>
							<td>{s.hours}h</td>
							<td>
								<button class="btn btn-sm preset-tonal-primary" onclick={() => startEdit(s)}>Edit</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Edit Modal -->
{#if editingSlot}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={cancelEdit}>
		<div class="card bg-surface-50-950 p-6 w-full max-w-md space-y-4 shadow-2xl border border-surface-300-700" onclick={(e) => e.stopPropagation()}>
			<h3 class="h4">Edit Slot</h3>
			<div class="space-y-2 text-sm">
				<p><strong>Tarikh:</strong> {editingSlot.date} ({editingSlot.day})</p>
				<p><strong>Slot:</strong> {editingSlot.slotType}</p>
				<p><strong>Sekarang:</strong> {editingSlot.employeeName || '(kosong)'}</p>
			</div>
			<label class="label">
				<span>Kakitangan Baharu</span>
				<select class="select" bind:value={newEmpId}>
					<option value="">-- Kosongkan --</option>
					{#each employees.filter(e => e.active) as emp}
						<option value={emp.employeeId}>{emp.employeeId} - {emp.name} ({emp.dept}/{emp.role})</option>
					{/each}
				</select>
			</label>
			<div class="flex gap-2 justify-end">
				<button class="btn preset-tonal-surface" onclick={cancelEdit}>Batal</button>
				<button class="btn preset-filled-primary-500" onclick={saveEdit}>Simpan</button>
			</div>
		</div>
	</div>
{/if}