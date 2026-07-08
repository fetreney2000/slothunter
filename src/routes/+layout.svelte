<script lang="ts">
	import '../app.css';
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const toaster = createToaster();

	// Make toaster available globally
	if (typeof window !== 'undefined') {
		(window as unknown as Record<string, unknown>).__toaster = toaster;
	}
</script>

<Toaster {toaster} />
{@render children()}