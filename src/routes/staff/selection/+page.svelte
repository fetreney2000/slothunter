<script lang="ts">
	import type { PageData } from './$types';
	import MonthPicker from '$lib/components/MonthPicker.svelte';
	let { data }: { data: PageData } = $props();

	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let slots = $state<Array<Record<string, unknown>>>([]);
	let mySlots = $state<Set<string>>(new Set());
	let rosterStatus = $state('');
	let loading = $state(true);
	let claiming = $state(false);
	let message = $state('');
	let filterType = $state('available');
	let phaseConfig = $state<Record<string, unknown> | null>(null);
	let currentPhase = $state<Record<string, unknown> | null>(null);

	$effect(() => { loadData(); });

	async function loadData() {
		loading = true;
		try {
			const [rRes, pRes] = await Promise.all([
				fetch(`/api/roster?month=${month}`),
				fetch(`/api/admin/phases?month=${month}`)
			]);
			if (rRes.ok) {
				const result = await rRes.json();
				slots = result.slots || [];
				rosterStatus = result.roster?.status || '';
				const mine = new Set<string>();
				for (const s of slots) {
					if (s.employeeId === data.user?.employeeId) mine.add(`${s.date}:${s.slotType}`);
				}
				mySlots = mine;
			}
			if (pRes.ok) {
				const pData = await pRes.json();
				phaseConfig = pData.config;
				// Determine current phase based on today's date
				const today = new Date().toISOString().slice(0, 10);
				if (pData.config?.phases) {
					for (const p of pData.config.phases) {
						if (today >= p.startDate && today <= p.endDate) {
							currentPhase = p;
							break;
						}
					}
				}
			}
		} finally { loading = false; }
	}

	const filteredSlots = $derived(
		slots.filter((s) => {
			if (s.slotType === 'POST-AE') return false;
			if (filterType === 'mine') return s.employeeId === data.user?.employeeId;
			if (filterType === 'available') return !s.employeeId;
			return true;
		})
	);

	const isWeekend = (date: string) => {
		const d = new Date(date + 'T00:00:00').getDay();
		return d === 0 || d === 6;
	};

	// Count how many slots the user has claimed in current phase
	const myPhaseSlots = $derived(() => {
		if (!currentPhase || !phaseConfig) return { weekend: 0, weekday: 0 };
		const start = (currentPhase as Record<string, unknown>).startDate as string;
		const end = (currentPhase as Record<string, unknown>).endDate as string;
		let weekend = 0, weekday = 0;
		for (const s of slots) {
			if (s.employeeId !== data.user?.employeeId || s.slotType === 'POST-AE') continue;
			if ((s.date as string) >= start && (s.date as string) <= end) {
				if (isWeekend(s.date as string)) weekend++;
				else weekday++;
			}
		}
		return { weekend, weekday };
	});

	const canClaimWeekend = $derived(() => {
		if (!currentPhase) return true;
		const max = (currentPhase as Record<string, unknown>).weekendSlots as number;
		return myPhaseSlots().weekend < max;
	});

	const canClaimWeekday = $derived(() => {
		if (!currentPhase) return true;
		const max = (currentPhase as Record<string, unknown>).weekdaySlots as number;
		return myPhaseSlots().weekday < max;
	});

	async function claimSlot(slot: Record<string, unknown>) {
		if (claiming) return;
		claiming = true; message = '';

		// Check phase limits
		if (currentPhase) {
			const weekend = isWeekend(slot.date as string);
			if (weekend && !canClaimWeekend()) {
				message = `Kuota hujung minggu fasa ${(currentPhase as Record<string, unknown>).phase} penuh!`;
				claiming = false; return;
			}
			if (!weekend && !canClaimWeekday()) {
				message = `Kuota hari bekerja fasa ${(currentPhase as Record<string, unknown>).phase} penuh!`;
				claiming = false; return;
			}
		}

		try {
			const res = await fetch('/api/roster/claim', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ month, date: slot.date, slotType: slot.slotType })
			});
			if (res.ok) {
				message = 'Slot berjaya dipilih!';
				await loadData();
			} else {
				const d = await res.json();
				message = d.error || 'Gagal memilih slot';
			}
		} catch { message = 'Ralat rangkaian'; }
		finally { claiming = false; }
	}

	function slotColor(slotType: string): string {
		if (slotType === 'AE') return 'preset-filled-error-500';
		if (slotType.startsWith('IPP_')) return 'preset-filled-primary-500';
		if (slotType.startsWith('OPD_')) return 'preset-filled-success-500';
		if (slotType.startsWith('PP_')) return 'preset-filled-tertiary-500';
		return 'preset-tonal-surface';
	}
</script>

<svelte:head><title>Pilih Slot - Slothunter</title></svelte:head>

<div class="space-y-4">
	<h1 class="h2">Pilih Slot OT</h1>

	<div class="flex items-center justify-between flex-wrap gap-2">
		<p class="text-sm opacity-60">Status: <span class="font-bold">{rosterStatus || 'Tiada'}</span></p>
		<MonthPicker bind:value={month} />
	</div>

	<!-- Phase Info -->
	{#if currentPhase}
		<div class="card preset-tonal-primary p-3 text-sm">
			<p class="font-bold">Fasa {(currentPhase as Record<string, unknown>).phase} aktif</p>
			<p class="opacity-60">
				Hujung minggu: {myPhaseSlots().weekend}/{(currentPhase as Record<string, unknown>).weekendSlots} |
				Hari bekerja: {myPhaseSlots().weekday}/{(currentPhase as Record<string, unknown>).weekdaySlots}
			</p>
		</div>
	{/if}

	<!-- Filters -->
	<div class="flex gap-2">
		<button class="btn btn-sm {filterType === 'available' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'available')}>
			Kosong ({slots.filter((s) => !s.employeeId && s.slotType !== 'POST-AE').length})
		</button>
		<button class="btn btn-sm {filterType === 'mine' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'mine')}>
			Saya ({mySlots.size})
		</button>
		<button class="btn btn-sm {filterType === 'all' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (filterType = 'all')}>
			Semua
		</button>
	</div>

	{#if message}
		<div class="alert {message.includes('berjaya') ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center p-8"><p class="animate-pulse opacity-60">Memuatkan...</p></div>
	{:else if filteredSlots.length === 0}
		<div class="text-center p-8 opacity-40"><p>Tiada slot</p></div>
	{:else}
		<div class="space-y-2">
			{#each filteredSlots as slot}
				<div class="card preset-tonal-surface p-3 flex items-center justify-between gap-2">
					<div class="flex items-center gap-2 min-w-0">
						<span class="badge {slotColor(slot.slotType as string)} shrink-0">{slot.slotType}</span>
						<div class="min-w-0">
							<p class="text-sm font-bold">{slot.date} ({slot.day})</p>
							<p class="text-xs opacity-60">
								{isWeekend(slot.date as string) ? 'Hujung Minggu' : 'Hari Bekerja'} &bull; {slot.hours}h
								{slot.employeeId ? ` • ${slot.employeeName}` : ''}
							</p>
						</div>
					</div>
					<div class="shrink-0">
						{#if !slot.employeeId}
							<button class="btn btn-sm preset-filled-primary-500"
								disabled={claiming || rosterStatus === 'Final'}
								onclick={() => claimSlot(slot)}>
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