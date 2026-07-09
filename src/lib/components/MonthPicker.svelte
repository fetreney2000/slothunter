<script lang="ts">
	import { DatePicker, parseDate, Portal } from '@skeletonlabs/skeleton-svelte';

	let {
		value = $bindable(''),
		label = '',
		onchange
	}: {
		value: string;
		label?: string;
		onchange?: () => void;
	} = $props();

	// Ensure value always ends with -01 for first-of-month
	function normalizeMonth(v: string): string {
		if (!v) return '';
		const parts = v.split('-');
		if (parts.length >= 2) {
			return `${parts[0]}-${parts[1].padStart(2, '0')}-01`;
		}
		return v;
	}

	let dpValue = $derived(value ? [parseDate(normalizeMonth(value).substring(0, 10))] : []);

	function onValueChange(e: { value: Array<{ year: number; month: number; day: number }>; valueAsString: string[] }) {
		if (e.value && e.value.length > 0) {
			const d = e.value[0];
			value = `${d.year}-${String(d.month).padStart(2, '0')}-01`;
		} else if (e.valueAsString && e.valueAsString.length > 0) {
			const parts = e.valueAsString[0].split(/[-\/]/);
			if (parts.length >= 2) {
				const year = parts[0].length === 4 ? parts[0] : parts[2];
				const month = parts[0].length === 4 ? parts[1] : parts[0];
				value = `${year}-${month.padStart(2, '0')}-01`;
			}
		} else {
			value = '';
		}
		onchange?.();
	}

	// Display the month-year as readable text
	const displayValue = $derived(() => {
		if (!value) return '';
		const d = new Date(normalizeMonth(value) + 'T00:00:00');
		return d.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
	});
</script>

<DatePicker value={dpValue} {onValueChange}>
	{#if label}
		<DatePicker.Label>{label}</DatePicker.Label>
	{/if}
	<DatePicker.Control>
		<DatePicker.Input placeholder="Pilih bulan..." />
		<DatePicker.Trigger />
	</DatePicker.Control>
	<Portal>
		<DatePicker.Positioner>
			<DatePicker.Content>
				<DatePicker.View view="month">
					<DatePicker.Context>
						{#snippet children(datePicker)}
							<DatePicker.ViewControl>
								<DatePicker.PrevTrigger />
								<DatePicker.ViewTrigger>
									<DatePicker.RangeText />
								</DatePicker.ViewTrigger>
								<DatePicker.NextTrigger />
							</DatePicker.ViewControl>
							<DatePicker.Table>
								<DatePicker.TableBody>
									{#each datePicker().getMonthsGrid({ columns: 4, format: 'short' }) as months, id (id)}
										<DatePicker.TableRow>
											{#each months as month, id (id)}
												<DatePicker.TableCell value={month.value}>
													<DatePicker.TableCellTrigger>{month.label}</DatePicker.TableCellTrigger>
												</DatePicker.TableCell>
											{/each}
										</DatePicker.TableRow>
									{/each}
								</DatePicker.TableBody>
							</DatePicker.Table>
						{/snippet}
					</DatePicker.Context>
				</DatePicker.View>
				<DatePicker.View view="year">
					<DatePicker.Context>
						{#snippet children(datePicker)}
							<DatePicker.ViewControl>
								<DatePicker.PrevTrigger />
								<DatePicker.ViewTrigger>
									<DatePicker.RangeText />
								</DatePicker.ViewTrigger>
								<DatePicker.NextTrigger />
							</DatePicker.ViewControl>
							<DatePicker.Table>
								<DatePicker.TableBody>
									{#each datePicker().getYearsGrid({ columns: 4 }) as years, id (id)}
										<DatePicker.TableRow>
											{#each years as year, id (id)}
												<DatePicker.TableCell value={year.value}>
													<DatePicker.TableCellTrigger>{year.label}</DatePicker.TableCellTrigger>
												</DatePicker.TableCell>
											{/each}
										</DatePicker.TableRow>
									{/each}
								</DatePicker.TableBody>
							</DatePicker.Table>
						{/snippet}
					</DatePicker.Context>
				</DatePicker.View>
			</DatePicker.Content>
		</DatePicker.Positioner>
	</Portal>
</DatePicker>