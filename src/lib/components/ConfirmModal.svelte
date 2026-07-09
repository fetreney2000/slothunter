<script lang="ts">
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

{#if open}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={handleCancel} role="dialog">
		<div class="card bg-surface-50-950-token p-6 w-full max-w-md space-y-4 shadow-2xl border border-surface-300-600-token" onclick={(e) => e.stopPropagation()}>
			<h3 class="h3">{title}</h3>
			<p class="opacity-70">{message}</p>
			<div class="flex gap-2 justify-end">
				<button class="btn preset-tonal-surface" onclick={handleCancel}>Batal</button>
				<button class="btn preset-filled-error-500" onclick={handleConfirm}>Sahkan</button>
			</div>
		</div>
	</div>
{/if}