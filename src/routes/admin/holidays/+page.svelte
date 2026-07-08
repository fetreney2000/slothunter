<script lang="ts">
	let holidays = $state<Array<{ date: string; name: string }>>([]);
	let loading = $state(true);
	let newDate = $state('');
	let newName = $state('');
	let error = $state('');

	$effect(() => {
		loadHolidays();
	});

	async function loadHolidays() {
		loading = true;
		try {
			const res = await fetch('/api/admin/holidays');
			if (res.ok) {
				const data = await res.json();
				holidays = data.holidays;
			}
		} catch (err) {
			error = 'Gagal memuatkan cuti umum';
		} finally {
			loading = false;
		}
	}

	async function addHoliday() {
		if (!newDate || !newName) {
			error = 'Tarikh dan nama diperlukan';
			return;
		}
		try {
			const res = await fetch('/api/admin/holidays', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: newDate, name: newName })
			});
			if (res.ok) {
				newDate = '';
				newName = '';
				await loadHolidays();
			} else {
				const data = await res.json();
				error = data.error || 'Gagal menambah';
			}
		} catch (err) {
			error = 'Ralat rangkaian';
		}
	}

	async function deleteHoliday(date: string) {
		try {
			await fetch('/api/admin/holidays', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date })
			});
			await loadHolidays();
		} catch (err) {
			error = 'Ralat memadam';
		}
	}
</script>

<svelte:head>
	<title>Cuti Umum - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Cuti Umum</h1>

	{#if error}
		<div class="alert preset-filled-error-500">
			<p class="text-sm">{error}</p>
			<button class="btn-icon" onclick={() => (error = '')}>✕</button>
		</div>
	{/if}

	<!-- Add form -->
	<div class="card preset-tonal p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
			<label class="label">
				<span>Tarikh</span>
				<input type="date" class="input" bind:value={newDate} />
			</label>
			<label class="label">
				<span>Nama Cuti</span>
				<input type="text" class="input" bind:value={newName} placeholder="Hari Raya..." />
			</label>
			<button class="btn preset-filled-primary-500" onclick={addHoliday}>
				Tambah
			</button>
		</div>
	</div>

	<!-- Holiday list -->
	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else if holidays.length === 0}
		<p class="text-center opacity-40 p-4">Tiada cuti umum</p>
	{:else}
		<div class="space-y-2">
			{#each holidays as h}
				<div class="card preset-tonal-surface p-3 flex items-center justify-between gap-2">
					<div>
						<p class="font-bold">{h.name}</p>
						<p class="text-xs opacity-60">{h.date}</p>
					</div>
					<button
						class="btn btn-sm preset-tonal-error"
						onclick={() => deleteHoliday(h.date)}
					>
						Padam
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>