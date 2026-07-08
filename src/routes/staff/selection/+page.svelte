<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let mySlots = $state<Set<string>>(new Set());
	let rosterStatus = $state('');
	let loading = $state(true);
	let claiming = $state(false);
	let message = $state('');
	let filterType = $state('available'); // 'all', 'available', 'mine'

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
				rosterStatus = result.roster?.status || '';
				// Track my slots
				const mine = new Set<string>();
				for (const s of slots) {
					if (s.employeeId === data.user?.employeeId) {
						mine.add(`${s.date}:${s.slotType}`);
					}
				}
				mySlots = mine;
			}
		} catch (err) {
			console.error('Failed to load roster:', err);
		} finally {
			loading = false;
		}
	}

	const filteredSlots = $derived(
		slots.filter((s) => {
			if (s.slotType === 'POST-AE') return false;
			if (filterType === 'mine') return s.employeeId === data.user?.employeeId;
			if (filterType === 'available') return !s.employeeId;
			return true;
		})
	);

	const dayType = (date: string) => {
		const d = new Date(date + 'T00:00:00').getDay();
		if (d === 0 || d === 6) return 'Hujung Minggu';
		return 'Hari Bekerja';
	};

	function slotColor(slotType: string): string {
		if (slotType === 'AE') return 'preset-filled-error-500';
		if (slotType.startsWith('IPP_')) return 'preset-filled-primary-500';
		if (slotType.startsWith('OPD_')) return 'preset-filled-success-500';
		if (slotType.startsWith('PP_')) return 'preset-filled-tertiary-500';
		return 'preset-tonal-surface';
	}
</script>

<svelte:head>
	<title>Pilih Slot - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Pilih Slot OT</h1>

	<div class="flex items-center justify-between flex-wrap gap-2">
		<p class="text-sm opacity-60">Status: <span class="font-bold">{rosterStatus || 'Tiada'}</span></p>
		<select class="select w-auto" bind:value={month}>
			<option value={new Date().toISOString().slice(0, 7) + '-01'}>Bulan Ini</option>
			<option value={new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 7) + '-01'}>Bulan Depan</option>
		</select>
	</div>

	<!-- Filters -->
	<div class="flex gap-2">
		<button
			class="btn btn-sm {filterType === 'available' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'available')}
		>
			Kosong ({slots.filter((s) => !s.employeeId && s.slotType !== 'POST-AE').length})
		</button>
		<button
			class="btn btn-sm {filterType === 'mine' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'mine')}
		>
			Saya ({mySlots.size})
		</button>
		<button
			class="btn btn-sm {filterType === 'all' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'all')}
		>
			Semua
		</button>
	</div>

	{#if message}
		<div class="alert {message.includes('Berjaya') ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center p-8">
			<p class="animate-pulse opacity-60">Memuatkan...</p>
		</div>
	{:else if filteredSlots.length === 0}
		<div class="text-center p-8 opacity-40">
			<p>Tiada slot {filterType === 'available' ? 'kosong' : filterType === 'mine' ? 'untuk anda' : ''}</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filteredSlots as slot}
				<div class="card preset-tonal-surface p-3 flex items-center justify-between gap-2">
					<div class="flex items-center gap-2 min-w-0">
						<span class="badge {slotColor(slot.slotType)} shrink-0">
							{slot.slotType}
						</span>
						<div class="min-w-0">
							<p class="text-sm font-bold">{slot.date} ({slot.day})</p>
							<p class="text-xs opacity-60">
								{dayType(slot.date)} &bull; {slot.hours}h
								{slot.employeeId ? ` • ${slot.employeeName}` : ''}
							</p>
						</div>
					</div>
					<div class="shrink-0">
						{#if !slot.employeeId}
							<button
								class="btn btn-sm preset-filled-primary-500"
								disabled={claiming || rosterStatus === 'Final'}
							>
								Pilih
							</button>
						{:else if slot.employeeId === data.user?.employeeId}
							<span class="badge preset-filled-success-500">✓ Anda</span>
						{:else}
							<span class="badge preset-tonal opacity-40">{slot.employeeName}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>