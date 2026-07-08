<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Slothunter - OT Roster Management</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-surface-50 to-surface-200-700-token p-4">
	<div class="card w-full max-w-md p-8 text-center space-y-6">
		<div class="flex flex-col items-center gap-3">
			<span class="text-6xl">🦥</span>
			<h1 class="h1 font-bold">Slothunter</h1>
			<p class="text-lg opacity-70">Sistem Pengurusan Jadual OT</p>
			<p class="text-sm opacity-50">Jabatan Farmasi Hospital Keningau</p>
		</div>

		<hr class="hr" />

		<div class="flex flex-col gap-3">
			<a href="/login" class="btn preset-filled-primary-500 w-full text-lg">
				Log Masuk
			</a>
			<p class="text-xs opacity-40">
				PPF & PA • Admin & Staff
			</p>
		</div>
	</div>
</div>