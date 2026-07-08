<script lang="ts">
	let month = $state(new Date().toISOString().slice(0, 7) + '-01');
	let running = $state(false);
	let progress = $state(0);
	let progressMessage = $state('');
	let result = $state<Record<string, unknown> | null>(null);
	let error = $state('');
	let searchStepLimit = $state(100000);

	async function runSolver() {
		running = true;
		progress = 0;
		progressMessage = 'Memuatkan data...';
		error = '';
		result = null;

		try {
			// Fetch solver input from API
			const inputRes = await fetch('/api/admin/solver', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ month, searchStepLimit })
			});

			if (!inputRes.ok) {
				const err = await inputRes.json();
				error = err.error || 'Gagal memuatkan data solver';
				running = false;
				return;
			}

			const { solverInput } = await inputRes.json();

			// Run solver in Web Worker
			const worker = new Worker(
				new URL('$lib/workers/rosterSolver.worker.ts', import.meta.url),
				{ type: 'module' }
			);

			worker.onmessage = async (e) => {
				const msg = e.data;

				if (msg.type === 'progress') {
					progress = msg.progress;
					progressMessage = msg.message || '';
				} else if (msg.type === 'complete') {
					progress = 100;
					progressMessage = 'Selesai!';

					// Save results to server
					const saveRes = await fetch('/api/admin/solver', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							rosterId: msg.data.rosterId,
							month,
							slots: msg.data.slots,
							metrics: msg.data.metrics,
							warnings: msg.data.warnings,
							status: 'Draft'
						})
					});

					if (saveRes.ok) {
						const saveData = await saveRes.json();
						result = {
							rosterId: saveData.rosterId,
							slotsCount: saveData.slotsCount,
							metrics: msg.data.metrics,
							warnings: msg.data.warnings,
							elapsedMs: msg.data.elapsedMs
						};
					} else {
						error = 'Gagal menyimpan keputusan solver';
					}

					worker.terminate();
					running = false;
				} else if (msg.type === 'error') {
					error = msg.message || 'Ralat solver';
					worker.terminate();
					running = false;
				}
			};

			worker.onerror = (err) => {
				error = `Worker error: ${err.message}`;
				worker.terminate();
				running = false;
			};

			worker.postMessage(solverInput);
		} catch (err) {
			error = `Ralat: ${err instanceof Error ? err.message : 'Unknown'}`;
			running = false;
		}
	}
</script>

<svelte:head>
	<title>Jadual OT - Slothunter</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="h2">Jadual OT</h1>

	<!-- Solver Controls -->
	<div class="card preset-tonal p-4 space-y-3">
		<h3 class="h4">Jana Jadual</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<label class="label">
				<span>Bulan Roster</span>
				<input type="date" class="input" bind:value={month} />
			</label>
			<label class="label">
				<span>Had Carian</span>
				<input type="number" class="input" bind:value={searchStepLimit} min="10000" step="10000" />
			</label>
		</div>

		<button
			class="btn preset-filled-primary-500 w-full"
			onclick={runSolver}
			disabled={running}
		>
			{running ? 'Menjalankan...' : '🚀 Jalankan Solver'}
		</button>
	</div>

	<!-- Progress -->
	{#if running}
		<div class="card preset-tonal p-4 space-y-2">
			<div class="flex justify-between text-sm">
				<span>{progressMessage}</span>
				<span>{progress}%</span>
			</div>
			<div class="w-full bg-surface-200-700-token rounded-full h-3">
				<div
					class="bg-primary-500 h-3 rounded-full transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="alert preset-filled-error-500">
			<p class="text-sm">{error}</p>
			<button class="btn-icon" onclick={() => (error = '')}>✕</button>
		</div>
	{/if}

	<!-- Result -->
	{#if result}
		<div class="card preset-tonal-success p-4 space-y-3">
			<h3 class="h4">✅ Keputusan Solver</h3>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
				<div>
					<p class="opacity-60">Roster ID</p>
					<p class="font-mono text-xs break-all">{result.rosterId}</p>
				</div>
				<div>
					<p class="opacity-60">Slot Diisi</p>
					<p class="font-bold">{result.slotsCount}</p>
				</div>
				<div>
					<p class="opacity-60">Masa (saat)</p>
					<p class="font-bold">{((result.elapsedMs as number) / 1000).toFixed(1)}</p>
				</div>
				{#if result.metrics}
					<div>
						<p class="opacity-60">Hard Penalty</p>
						<p class="font-bold">{(result.metrics as Record<string, unknown>).hardPenalty}</p>
					</div>
					<div>
						<p class="opacity-60">Jam Jumlah</p>
						<p class="font-bold">{(result.metrics as Record<string, unknown>).assignedHours}</p>
					</div>
					<div>
						<p class="opacity-60">Langkah</p>
						<p class="font-bold">{(result.metrics as Record<string, unknown>).searchSteps}</p>
					</div>
				{/if}
			</div>

			{#if result.warnings && (result.warnings as string[]).length > 0}
				<div class="mt-2">
					<p class="text-sm font-bold">Amaran:</p>
					<ul class="text-xs list-disc pl-4">
						{#each result.warnings as w}
							<li>{w}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>