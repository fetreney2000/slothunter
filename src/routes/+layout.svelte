<script lang="ts">
	import '../app.css';
	import { Toast, createToaster } from '@skeletonlabs/skeleton-svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const toaster = createToaster();

	if (typeof window !== 'undefined') {
		(window as unknown as Record<string, unknown>).__toaster = toaster;
	}
</script>

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>
{@render children()}