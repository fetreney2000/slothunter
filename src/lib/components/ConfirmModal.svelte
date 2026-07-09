<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';

	let { open = $bindable(false), title = 'Sahkan', message = 'Adakah anda pasti?', onConfirm, onCancel }: {
		open: boolean;
		title?: string;
		message?: string;
		onConfirm: () => void;
		onCancel?: () => void;
	} = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel?.();
		open = false;
	}
</script>

<Modal {open} onOpenChange={(e) => { open = e.open; if (!e.open) onCancel?.(); }}>
	{#snippet content()}
		<div class="card preset-filled-surface-100-800-token p-6 space-y-4 w-full max-w-md">
			<h3 class="h3">{title}</h3>
			<p class="opacity-70">{message}</p>
			<div class="flex gap-2 justify-end">
				<button class="btn preset-tonal-surface" onclick={handleCancel}>Batal</button>
				<button class="btn preset-filled-error-500" onclick={handleConfirm}>Sahkan</button>
			</div>
		</div>
	{/snippet}
</Modal>