<script lang="ts">
	import DatePicker from '$lib/components/DatePicker.svelte';

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let phases = $state([
		{ phase: 1, startDate: '', endDate: '', weekendSlots: 1, weekdaySlots: 2 },
		{ phase: 2, startDate: '', endDate: '', weekendSlots: 1, weekdaySlots: 1 },
		{ phase: 3, startDate: '', endDate: '', weekendSlots: 1, weekdaySlots: 1 }
	]);
	let loading = $state(true);
	let message = $state('');

	$effect(() => { loadPhases(); });

	async function loadPhases() {
		loading = true;
		try {
			const res = await fetch(`/api/admin/phases?month=${month}`);
			if (res.ok) {
				const data = await res.json();
				if (data.config?.phases?.length) phases = data.config.phases;
			}
		} finally { loading = false; }
	}

	async function savePhases() {
		const res = await fetch('/api/admin/phases', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month, phases })
		});
		if (res.ok) message = 'Fasa berdisimpan!';
		else message = 'Ralat menyimpan';
	}

	function prevMonth() { const d = new Date(month); d.setMonth(d.getMonth()-1); month = d.toISOString().slice(0,7)+'-01'; }
	function nextMonth() { const d = new Date(month); d.setMonth(d.getMonth()+1); month = d.toISOString().slice(0,7)+'-01'; }
	const monthName = $derived(new Date(month+'T00:00:00').toLocaleDateString('ms-MY',{month:'long',year:'numeric'}));
</script>

<svelte:head><title>Fasa Pilihan - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Konfigurasi Fasa</h1>
	<p class="text-sm opacity-60">Tetapkan tarikh dan kuota slot untuk setiap fasa pilihan kakitangan</p>

	<div class="flex items-center justify-between">
		<button class="btn preset-tonal-surface" onclick={prevMonth}>&laquo;</button>
		<h3 class="h4">{monthName}</h3>
		<button class="btn preset-tonal-surface" onclick={nextMonth}>&raquo;</button>
	</div>

	{#if message}
		<div class="alert {message.includes('berdisimpan') ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="space-y-4">
			{#each phases as phase, i}
				<div class="card preset-tonal p-4 space-y-3">
					<h3 class="h4">Fasa {phase.phase}</h3>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<label class="label">
							<span>Mula</span>
							<DatePicker bind:value={phase.startDate} />
						</label>
						<label class="label">
							<span>Tamat</span>
							<DatePicker bind:value={phase.endDate} />
						</label>
						<label class="label">
							<span>Slot Hujung Minggu</span>
							<input type="number" class="input" bind:value={phase.weekendSlots} min="0" max="5" />
						</label>
						<label class="label">
							<span>Slot Hari Bekerja</span>
							<input type="number" class="input" bind:value={phase.weekdaySlots} min="0" max="5" />
						</label>
					</div>
				</div>
			{/each}

			<button class="btn preset-filled-primary-500 w-full" onclick={savePhases}>
				Simpan Konfigurasi Fasa
			</button>
		</div>
	{/if}
</div>