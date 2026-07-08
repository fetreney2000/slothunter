<script lang="ts">
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';
	
	export const toaster = createToaster();
</script>

<Toaster {toaster} />