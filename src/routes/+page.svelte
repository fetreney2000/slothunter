<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Slothunter - OT Roster Management</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 to-surface-200-700-token p-4">
	<div class="card w-full max-w-lg p-10 text-center space-y-8 shadow-xl">
		<div class="flex flex-col items-center gap-4">
			<span class="text-7xl">🦥</span>
			<h1 class="h1 font-bold tracking-tight">Slothunter</h1>
			<p class="text-lg opacity-60">Sistem Pengurusan Jadual OT</p>
			<p class="text-sm opacity-40">Jabatan Farmasi Hospital Keningau</p>
		</div>

		<hr class="hr" />

		<div class="flex flex-col gap-4">
			<a href="/login" class="btn preset-filled-primary-500 w-full text-lg py-4 shadow-lg hover:shadow-xl transition-shadow">
				Log Masuk
			</a>
			<div class="flex items-center justify-center gap-4 text-xs opacity-40">
				<span>PPF</span>
				<span>&bull;</span>
				<span>PA</span>
				<span>&bull;</span>
				<span>Admin & Staff</span>
			</div>
		</div>
	</div>
</div>