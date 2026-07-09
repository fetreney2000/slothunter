<script lang="ts">
	import type { PageData } from './$types';
	import MonthPicker from '$lib/components/MonthPicker.svelte';
	let { data }: { data: PageData } = $props();
	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let loading = $state(true);

	$effect(() => { loadRoster(); });

	async function loadRoster() {
		loading = true;
		try {
			const res = await fetch(`/api/roster?month=${month}&employeeId=${data.user?.employeeId}`);
			if (res.ok) { const d = await res.json(); slots = d.slots || []; }
		} finally { loading = false; }
	}

	const mySlots = $derived(slots.filter(s => s.slotType !== 'POST-AE' && s.employeeId === data.user?.employeeId));
	const totalHours = $derived(mySlots.reduce((s, slot) => s + (slot.hours as number), 0));
	const aeCount = $derived(mySlots.filter(s => s.slotType === 'AE').length);
	const phSlots = $derived(slots.filter(s => s.day === 'CUTI UMUM'));
	const phCount = $derived(mySlots.filter(s => phSlots.some(p => p.date === s.date)).length);
</script>

<svelte:head><title>Ringkasan - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Ringkasan OT Saya</h1>
	<MonthPicker bind:value={month} />

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			<div class="card preset-tonal-primary p-4 text-center">
				<p class="text-3xl font-bold">{totalHours}h</p>
				<p class="text-sm opacity-60">Jumlah Jam</p>
			</div>
			<div class="card preset-tonal-secondary p-4 text-center">
				<p class="text-3xl font-bold">{mySlots.length}</p>
				<p class="text-sm opacity-60">Slot</p>
			</div>
			<div class="card preset-tonal-error p-4 text-center">
				<p class="text-3xl font-bold">{aeCount}</p>
				<p class="text-sm opacity-60">AE</p>
			</div>
			<div class="card preset-tonal-tertiary p-4 text-center">
				<p class="text-3xl font-bold">{phCount}</p>
				<p class="text-sm opacity-60">Cuti Umum</p>
			</div>
		</div>

		<div class="card preset-tonal p-4">
			<h3 class="h4 mb-3">Senarai Slot</h3>
			{#each mySlots as s}
				<div class="flex items-center gap-2 p-2 text-sm border-b border-surface-300-700">
					<span class="font-mono text-xs">{s.date}</span>
					<span class="badge badge-sm {s.slotType === 'AE' ? 'preset-filled-error-500' : 'preset-filled-primary-500'}">{s.slotType}</span>
					<span class="flex-1 text-xs">{s.day}</span>
					<span class="font-bold">{s.hours}h</span>
				</div>
			{/each}
		</div>
	{/if}
</div>