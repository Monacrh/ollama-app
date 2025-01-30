<script lang="ts">
	import { onMount, tick, getContext } from 'svelte';

	const i18n = getContext('i18n');

	import ShortcutsModal from '../chat/ShortcutsModal.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import FloatBtnMenu from './FloatBtn/FloatBtnMenu.svelte';

	let showShortcuts = false;
</script>

<div class=" hidden lg:flex absolute bottom-10 right-10 z-20">
	<button
		id="show-shortcuts-button"
		class="hidden"
		on:click={() => {
			showShortcuts = !showShortcuts;
		}}
	/>

	<FloatBtnMenu
	>
		<Tooltip content={$i18n.t('Buat')} placement="left">
			<button
				class="text-gray-600 dark:text-gray-300 bg-gray-300/20 size-8 flex items-center justify-center text-[2.2rem] rounded-full"
			>
				+
			</button>
		</Tooltip>
	</FloatBtnMenu>
</div>

<ShortcutsModal bind:show={showShortcuts} />
