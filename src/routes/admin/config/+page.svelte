<script lang="ts">
	let config = $state<Record<string, unknown>>({});
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');

	$effect(() => {
		loadConfig();
	});

	async function loadConfig() {
		loading = true;
		try {
			const res = await fetch('/api/admin/config');
			if (res.ok) {
				const data = await res.json();
				config = data.config || {};
			}
		} catch (err) {
			message = 'Ralat memuatkan konfigurasi';
		} finally {
			loading = false;
		}
	}

	async function saveConfig() {
		saving = true;
		message = '';
		try {
			const res = await fetch('/api/admin/config', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});
			if (res.ok) {
				message = 'Konfigurasi berdisimpan!';
			} else {
				const data = await res.json();
				message = data.error || 'Gagal menyimpan';
			}
		} catch (err) {
			message = 'Ralat rangkaian';
		} finally {
			saving = false;
		}
	}

	function formatDateForInput(date: unknown): string {
		if (!date) return '';
		const d = new Date(date as string);
		return d.toISOString().split('T')[0];
	}
</script>

<svelte:head>
	<title>Tetapan - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Tetapan Sistem</h1>

	{#if message}
		<div class="alert {message.includes('berdisimpan') ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	{#if loading}
		<p class="animate-pulse opacity-60 text-center p-4">Memuatkan...</p>
	{:else}
		<div class="card preset-tonal p-4 space-y-4">
			<label class="label">
				<span>Admin Email</span>
				<input type="email" class="input" bind:value={config.adminEmail} />
			</label>

			<label class="label">
				<span>Max Jam Lalai (PPF)</span>
				<input type="number" class="input" bind:value={config.defaultMaxHours} />
			</label>

			<label class="label">
				<span>Hari Tutup Unavailability</span>
				<input type="number" class="input" bind:value={config.unavailabilityCutoffDay} min="1" max="28" />
			</label>

			<label class="label">
				<span>Bulan Roster Aktif</span>
				<input
					type="date"
					class="input"
					value={formatDateForInput(config.rosterMonth)}
					onchange={(e) => (config.rosterMonth = (e.target as HTMLInputElement).value)}
				/>
			</label>

			<label class="label">
				<span>URL Roster Terakhir</span>
				<input type="url" class="input" bind:value={config.lastRosterUrl} placeholder="https://..." />
			</label>

			<label class="label">
				<span>URL Ringkasan Terakhir</span>
				<input type="url" class="input" bind:value={config.lastSummaryUrl} placeholder="https://..." />
			</label>

			<button
				class="btn preset-filled-primary-500 w-full"
				onclick={saveConfig}
				disabled={saving}
			>
				{saving ? 'Menyimpan...' : 'Simpan Tetapan'}
			</button>
		</div>
	{/if}
</div>