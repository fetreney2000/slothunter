<script lang="ts">
	import type { PageData } from './$types';
	import { exportRosterToExcel } from '$lib/exportRoster';

	let { data }: { data: PageData } = $props();

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let rosterInfo = $state<Record<string, unknown>>({});
	let loading = $state(true);
	let viewMode = $state('calendar'); // 'calendar' or 'list'
	let selectedDate = $state('');

	$effect(() => {
		loadRoster();
	});

	async function loadRoster() {
		loading = true;
		try {
			const res = await fetch(`/api/roster?month=${month}`);
			if (res.ok) {
				const result = await res.json();
				slots = result.slots || [];
				rosterInfo = result.roster || {};
			}
		} catch (err) {
			console.error('Failed to load roster:', err);
		} finally {
			loading = false;
		}
	}

	// Group slots by date
	const slotsByDate = $derived(() => {
		const map = new Map<string, Array<Record<string, unknown>>>();
		for (const s of slots) {
			if (!map.has(s.date as string)) map.set(s.date as string, []);
			map.get(s.date as string)!.push(s);
		}
		return map;
	});

	// Unique dates sorted
	const dates = $derived(() => {
		return [...new Set(slots.map((s) => s.date))].sort();
	});

	// My slots
	const mySlots = $derived(
		slots.filter((s) => s.employeeId === data.user?.employeeId && s.slotType !== 'POST-AE')
	);

	const myTotalHours = $derived(mySlots.reduce((sum, s) => sum + (s.hours as number), 0));

	async function exportExcel() {
		try {
			if (slots.length === 0) {
				alert('Tiada data untuk dieksport');
				return;
			}
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
		} catch { alert('Ralat mengeksport'); }
	}
</script>

<svelte:head>
	<title>Jadual OT - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Jadual OT</h1>

	<div class="flex items-center justify-between flex-wrap gap-2">
		<div>
			<p class="text-sm opacity-60">Status: <span class="font-bold">{(rosterInfo as Record<string, unknown>).status || 'Tiada'}</span></p>
			<p class="text-sm opacity-60">Jam Saya: <span class="font-bold">{myTotalHours}h</span> ({mySlots.length} slot)</p>
		</div>
		<div class="flex gap-2">
			<select class="select w-auto" bind:value={month}>
				<option value={new Date().toISOString().slice(0, 7) + '-01'}>Bulan Ini</option>
				<option value={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7) + '-01'}>Bulan Lepas</option>
			</select>
			{#if slots.length > 0}
				<button class="btn preset-filled-success-500 btn-sm" onclick={exportExcel}>📥 Excel</button>
			{/if}
		</div>
	</div>

	<!-- View toggle -->
	<div class="flex gap-2">
		<button
			class="btn btn-sm {viewMode === 'calendar' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (viewMode = 'calendar')}
		>
			📅 Kalendar
		</button>
		<button
			class="btn btn-sm {viewMode === 'list' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (viewMode = 'list')}
		>
			📋 Senarai
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<p class="animate-pulse opacity-60">Memuatkan...</p>
		</div>
	{:else if slots.length === 0}
		<div class="text-center p-8 opacity-40">
			<p>Tiada jadual untuk bulan ini</p>
		</div>
	{:else if viewMode === 'list'}
		<!-- List View -->
		<div class="space-y-1">
			{#each slots as slot}
				{#if slot.slotType !== 'POST-AE'}
					<div class="flex items-center gap-2 p-2 text-sm {slot.employeeId === data.user?.employeeId ? 'bg-primary-500/10 rounded' : ''}">
						<span class="w-20 font-mono text-xs">{slot.date}</span>
						<span class="w-8 text-xs opacity-60">{slot.day}</span>
						<span class="badge badge-sm {slot.slotType === 'AE' ? 'preset-filled-error-500' : (slot.slotType as string)?.startsWith('IPP_') ? 'preset-filled-primary-500' : 'preset-filled-success-500'}">
							{slot.slotType}
						</span>
						<span class="flex-1 truncate text-xs">
							{slot.employeeName || '(kosong)'}
						</span>
						<span class="text-xs opacity-60">{slot.hours}h</span>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<!-- Calendar View - Day Cards -->
		<div class="space-y-3">
			{#each dates() as date}
				{@const daySlots = slotsByDate().get(date as string) || []}
				{@const isMyDay = daySlots.some((s) => s.employeeId === data.user?.employeeId)}
				<div class="card {isMyDay ? 'preset-tonal-primary' : 'preset-tonal-surface'} p-3">
					<div class="flex items-center justify-between mb-2">
						<h4 class="font-bold">{date} ({daySlots[0]?.day || ''})</h4>
						{#if isMyDay}
							<span class="badge preset-filled-success-500">Bertugas</span>
						{/if}
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-1">
						{#each daySlots as slot}
							{#if slot.slotType !== 'POST-AE'}
								<div class="text-xs p-1 rounded {slot.employeeId === data.user?.employeeId ? 'bg-primary-500/20 font-bold' : 'opacity-70'}">
									<span class="font-mono">{slot.slotType}</span>: {slot.employeeName || '—'}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>