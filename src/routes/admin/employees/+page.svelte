<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let employees = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);
	let error = $state('');
	let showAddForm = $state(false);
	let filterDept = $state('all');
	let filterActive = $state('true');
	let editingEmp = $state<Record<string, unknown> | null>(null);
	let editForm = $state({
		name: '', dept: 'OPD', role: 'PPF', email: '', maxHoursPerMonth: 56,
		salary: 0, annualAE: 0, annualHalfPaidAE: 0, annualPaidAE: 0, annualPHAE: 0, annualPH: 0
	});

	// New employee form
	let newEmp = $state({
		employeeId: '',
		name: '',
		dept: 'OPD',
		role: 'PPF',
		email: '',
		maxHoursPerMonth: 56,
		salary: 0,
		annualAE: 0,
		annualHalfPaidAE: 0,
		annualPaidAE: 0,
		annualPHAE: 0,
		annualPH: 0
	});

	$effect(() => {
		loadEmployees();
	});

	async function loadEmployees() {
		loading = true;
		try {
			const res = await fetch('/api/admin/employees');
			if (res.ok) {
				const result = await res.json();
				employees = result.employees;
			} else {
				error = 'Gagal memuatkan senarai';
			}
		} catch (err) {
			error = 'Ralat rangkaian';
		} finally {
			loading = false;
		}
	}

	const filteredEmployees = $derived(
		employees.filter((e) => {
			if (filterDept !== 'all' && e.dept !== filterDept) return false;
			if (filterActive === 'true' && !e.active) return false;
			if (filterActive === 'false' && e.active) return false;
			return true;
		})
	);

	async function addEmployee() {
		try {
			const res = await fetch('/api/admin/employees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newEmp)
			});

			if (res.ok) {
				showAddForm = false;
				newEmp = {
					employeeId: '',
					name: '',
					dept: 'OPD',
					role: 'PPF',
					email: '',
					maxHoursPerMonth: 56,
					salary: 0,
					annualAE: 0,
					annualHalfPaidAE: 0,
					annualPaidAE: 0,
					annualPHAE: 0,
					annualPH: 0
				};
				await loadEmployees();
			} else {
				const err = await res.json();
				error = err.error || 'Gagal menambah';
			}
		} catch (err) {
			error = 'Ralat rangkaian';
		}
	}

	function startEdit(emp: Record<string, unknown>) {
		editingEmp = emp;
		editForm = {
			name: emp.name as string,
			dept: emp.dept as string,
			role: emp.role as string,
			email: emp.email as string,
			maxHoursPerMonth: emp.maxHoursPerMonth as number,
			salary: emp.salary as number,
			annualAE: emp.annualAE as number,
			annualHalfPaidAE: emp.annualHalfPaidAE as number,
			annualPaidAE: emp.annualPaidAE as number,
			annualPHAE: emp.annualPHAE as number,
			annualPH: emp.annualPH as number
		};
	}

	async function saveEdit() {
		if (!editingEmp) return;
		try {
			const res = await fetch('/api/admin/employees', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: editingEmp.employeeId,
					...editForm
				})
			});
			if (res.ok) {
				editingEmp = null;
				await loadEmployees();
			} else {
				const d = await res.json();
				error = d.error || 'Gagal mengemaskini';
			}
		} catch (err) {
			error = 'Ralat mengemaskini';
		}
	}

	async function toggleActive(emp: Record<string, unknown>) {
		try {
			await fetch('/api/admin/employees', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: emp.employeeId,
					active: !emp.active
				})
			});
			await loadEmployees();
		} catch (err) {
			error = 'Ralat mengemaskini';
		}
	}
</script>

<svelte:head>
	<title>Kakitangan - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="h2">Kakitangan</h1>
		<button
			class="btn preset-filled-primary-500"
			onclick={() => (showAddForm = !showAddForm)}
		>
			{showAddForm ? 'Tutup' : '+ Tambah'}
		</button>
	</div>

	{#if error}
		<div class="alert preset-filled-error-500">
			<p class="text-sm">{error}</p>
			<button class="btn-icon" onclick={() => (error = '')}>✕</button>
		</div>
	{/if}

	<!-- Filters -->
	<div class="flex gap-2 flex-wrap">
		<select class="select" bind:value={filterDept}>
			<option value="all">Semua Jabatan</option>
			<option value="IPP">IPP</option>
			<option value="OPD">OPD</option>
		</select>
		<select class="select" bind:value={filterActive}>
			<option value="true">Aktif</option>
			<option value="false">Tidak Aktif</option>
			<option value="all">Semua</option>
		</select>
	</div>

	<!-- Add Form -->
	{#if showAddForm}
		<div class="card preset-tonal p-4 space-y-3">
			<h3 class="h4">Tambah Kakitangan Baharu</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<label class="label">
					<span>ID</span>
					<input class="input" bind:value={newEmp.employeeId} placeholder="E029" />
				</label>
				<label class="label">
					<span>Nama</span>
					<input class="input" bind:value={newEmp.name} />
				</label>
				<label class="label">
					<span>Jabatan</span>
					<select class="select" bind:value={newEmp.dept}>
						<option value="IPP">IPP</option>
						<option value="OPD">OPD</option>
					</select>
				</label>
				<label class="label">
					<span>Peranan</span>
					<select class="select" bind:value={newEmp.role}>
						<option value="PPF">PPF</option>
						<option value="PRA">PRA</option>
					</select>
				</label>
				<label class="label">
					<span>Email</span>
					<input class="input" type="email" bind:value={newEmp.email} />
				</label>
				<label class="label">
					<span>Jam Maks/bulan</span>
					<input class="input" type="number" bind:value={newEmp.maxHoursPerMonth} />
				</label>
				<label class="label">
					<span>Gaji (RM)</span>
					<input class="input" type="number" bind:value={newEmp.salary} />
				</label>
				<label class="label">
					<span>AE Tahunan</span>
					<input class="input" type="number" bind:value={newEmp.annualAE} />
				</label>
			</div>
			<button class="btn preset-filled-success-500" onclick={addEmployee}>
				Simpan
			</button>
		</div>
	{/if}

	<!-- Employee List -->
	{#if loading}
		<div class="flex justify-center p-8">
			<p class="animate-pulse opacity-60">Memuatkan...</p>
		</div>
	{:else}
		<div class="space-y-2">
			<p class="text-sm opacity-60">{filteredEmployees.length} kakitangan</p>
			<div class="grid gap-2">
				{#each filteredEmployees as emp}
					<div class="card preset-tonal-surface p-3 flex items-center justify-between gap-2">
						<div class="min-w-0">
							<p class="font-bold truncate">{emp.name}</p>
							<p class="text-xs opacity-60">
								{emp.employeeId} &bull; {emp.dept} &bull; {emp.role} &bull; {emp.maxHoursPerMonth}h/bulan
							</p>
						</div>
						<div class="flex gap-1 shrink-0">
							<button class="btn btn-sm preset-tonal-primary" onclick={() => startEdit(emp)}>
								Edit
							</button>
							<button
								class="btn btn-sm {emp.active ? 'preset-tonal-error' : 'preset-tonal-success'}"
								onclick={() => toggleActive(emp)}
							>
								{emp.active ? 'Deaktif' : 'Aktif'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Edit Modal -->
{#if editingEmp}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => (editingEmp = null)}>
		<div class="card preset-filled-surface-100-800-token p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<h3 class="h4">Edit: {editingEmp.name} ({editingEmp.employeeId})</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<label class="label"><span>Nama</span><input class="input" bind:value={editForm.name} /></label>
				<label class="label"><span>Email</span><input class="input" type="email" bind:value={editForm.email} /></label>
				<label class="label"><span>Jabatan</span>
					<select class="select" bind:value={editForm.dept}><option value="IPP">IPP</option><option value="OPD">OPD</option></select>
				</label>
				<label class="label"><span>Peranan</span>
					<select class="select" bind:value={editForm.role}><option value="PPF">PPF</option><option value="PRA">PRA</option></select>
				</label>
				<label class="label"><span>Jam Maks/bulan</span><input class="input" type="number" bind:value={editForm.maxHoursPerMonth} /></label>
				<label class="label"><span>Gaji (RM)</span><input class="input" type="number" bind:value={editForm.salary} /></label>
				<label class="label"><span>AE Tahunan</span><input class="input" type="number" bind:value={editForm.annualAE} /></label>
				<label class="label"><span>AE Separuh Gaji</span><input class="input" type="number" bind:value={editForm.annualHalfPaidAE} /></label>
				<label class="label"><span>AE Bergaji</span><input class="input" type="number" bind:value={editForm.annualPaidAE} /></label>
				<label class="label"><span>PH AE</span><input class="input" type="number" bind:value={editForm.annualPHAE} /></label>
				<label class="label"><span>Cuti Umum</span><input class="input" type="number" bind:value={editForm.annualPH} /></label>
			</div>
			<div class="flex gap-2 justify-end">
				<button class="btn preset-tonal-surface" onclick={() => (editingEmp = null)}>Batal</button>
				<button class="btn preset-filled-primary-500" onclick={saveEdit}>Simpan</button>
			</div>
		</div>
	</div>
{/if}
