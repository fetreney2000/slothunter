<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Current roster month (default to next month)
	let currentYear = $state(new Date().getFullYear());
	let currentMonth = $state(new Date().getMonth()); // 0-indexed
	let unavailableDates = $state<Set<string>>(new Set());
	let loading = $state(false);
	let saving = $state(false);
	let message = $state('');

	const monthStr = $derived(
		`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
	);

	const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	const firstDayOfWeek = $derived(new Date(currentYear, currentMonth, 1).getDay());

	const monthName = $derived(
		new Date(currentYear, currentMonth).toLocaleDateString('ms-MY', {
			month: 'long',
			year: 'numeric'
		})
	);

	const dayLabels = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

	// Load unavailability for current month
	$effect(() => {
		loadUnavailability(monthStr);
	});

	async function loadUnavailability(month: string) {
		loading = true;
		try {
			const res = await fetch(`/api/unavailability?month=${month}`);
			if (res.ok) {
				const result = await res.json();
				unavailableDates = new Set(result.records.map((r: { date: string }) => r.date));
			}
		} catch (err) {
			console.error('Failed to load unavailability:', err);
		} finally {
			loading = false;
		}
	}

	function getDateStr(day: number): string {
		return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	function toggleDate(day: number) {
		const dateStr = getDateStr(day);
		const newSet = new Set(unavailableDates);
		if (newSet.has(dateStr)) {
			newSet.delete(dateStr);
		} else {
			newSet.add(dateStr);
		}
		unavailableDates = newSet;
	}

	async function saveUnavailability() {
		saving = true;
		message = '';
		try {
			// Get current saved dates from server
			const currentRes = await fetch(`/api/unavailability?month=${monthStr}`);
			const currentData = await currentRes.json();
			const currentDates = new Set(currentData.records.map((r: { date: string }) => r.date));

			// Find dates to add and remove
			const toAdd = [...unavailableDates].filter((d) => !currentDates.has(d));
			const toRemove = [...currentDates].filter((d) => !unavailableDates.has(d));

			if (toAdd.length > 0) {
				await fetch('/api/unavailability', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ dates: toAdd, month: monthStr })
				});
			}

			if (toRemove.length > 0) {
				await fetch('/api/unavailability', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ dates: toRemove })
				});
			}

			message = `Berdisimpan! ${toAdd.length} ditambah, ${toRemove.length} dipadam.`;
		} catch (err) {
			message = 'Ralat menyimpan. Sila cuba lagi.';
		} finally {
			saving = false;
		}
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}
</script>

<svelte:head>
	<title>Tidak Tersedia - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Tarikh Tidak Tersedia</h1>
	<p class="text-sm opacity-60">Tandakan tarikh anda tidak boleh bertugas OT</p>

	<!-- Month Navigation -->
	<div class="flex items-center justify-between">
		<button class="btn preset-tonal-surface" onclick={prevMonth}>&laquo;</button>
		<h3 class="h4">{monthName}</h3>
		<button class="btn preset-tonal-surface" onclick={nextMonth}>&raquo;</button>
	</div>

	{#if message}
		<div class="alert {message.includes('Berdisimpan') ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	<!-- Calendar Grid -->
	{#if loading}
		<div class="flex justify-center p-8">
			<p class="animate-pulse opacity-60">Memuatkan...</p>
		</div>
	{:else}
		<div class="grid grid-cols-7 gap-1">
			<!-- Day headers -->
			{#each dayLabels as label}
				<div class="text-center text-xs font-bold p-2 opacity-60">{label}</div>
			{/each}

			<!-- Empty cells for offset -->
			{#each Array(firstDayOfWeek) as _, i}
				<div></div>
			{/each}

			<!-- Day cells -->
			{#each Array(daysInMonth) as _, i}
				{@const day = i + 1}
				{@const dateStr = getDateStr(day)}
				{@const isUnavailable = unavailableDates.has(dateStr)}
				<button
					class="btn {isUnavailable
						? 'preset-filled-error-500'
						: 'preset-tonal-surface'} aspect-square text-sm p-1"
					onclick={() => toggleDate(day)}
				>
					{day}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Legend & Save -->
	<div class="flex flex-col gap-3 mt-4">
		<div class="flex items-center gap-4 text-xs">
			<span class="flex items-center gap-1">
				<span class="w-4 h-4 rounded bg-error-500"></span> Tidak tersedia
			</span>
			<span class="flex items-center gap-1">
				<span class="w-4 h-4 rounded bg-surface-300-600-token"></span> Tersedia
			</span>
		</div>

		<p class="text-sm">
			{unavailableDates.size} hari dipilih
		</p>

		<button
			class="btn preset-filled-primary-500 w-full"
			onclick={saveUnavailability}
			disabled={saving}
		>
			{saving ? 'Menyimpan...' : 'Simpan'}
		</button>
	</div>
</div>