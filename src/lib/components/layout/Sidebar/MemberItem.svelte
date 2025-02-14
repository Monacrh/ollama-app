<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { onMount, getContext, createEventDispatcher, tick, onDestroy } from 'svelte';

    import { getUserById } from '$lib/apis/users';
	const i18n = getContext('i18n');

	const dispatch = createEventDispatcher();

	import {
		mobile,
		showSidebar,
		showMemberPromptFromTeacher,
		showGroup,
	} from '$lib/stores';

	import DragGhost from '$lib/components/common/DragGhost.svelte';
	import Document from '$lib/components/icons/Document.svelte';

	export let className = '';

	export let id;
    export let name;
    export let email;

	export let selected = false;
	export let shiftKey = false;

	let chat = null;

	let mouseOver = false;
	let draggable = false;

    let username;
	let useremail;


	let itemElement;

	let dragged = false;
	let x = 0;
	let y = 0;

	const dragImage = new Image();
	dragImage.src =
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

	const onDragStart = (event) => {
		event.stopPropagation();

		event.dataTransfer.setDragImage(dragImage, 0, 0);

		// Set the data to be transferred
		event.dataTransfer.setData(
			'text/plain',
			JSON.stringify({
				type: 'chat',
				id: id,
				item: chat
			})
		);

		dragged = true;
		itemElement.style.opacity = '0.5'; // Optional: Visual cue to show it's being dragged
	};

	const onDrag = (event) => {
		event.stopPropagation();

		x = event.clientX;
		y = event.clientY;
	};

	const onDragEnd = (event) => {
		event.stopPropagation();

		itemElement.style.opacity = '1'; // Reset visual cue after drag
		dragged = false;
	};

    onMount(() => {
        if (id) {
            username = name;
            useremail = email;
        }
    })

	onMount(() => {
		if (itemElement) {
			// Event listener for when dragging starts
			itemElement.addEventListener('dragstart', onDragStart);
			// Event listener for when dragging occurs (optional)
			itemElement.addEventListener('drag', onDrag);
			// Event listener for when dragging ends
			itemElement.addEventListener('dragend', onDragEnd);
		}
	});

	onDestroy(() => {
		if (itemElement) {
			itemElement.removeEventListener('dragstart', onDragStart);
			itemElement.removeEventListener('drag', onDrag);
			itemElement.removeEventListener('dragend', onDragEnd);
		}
	});
</script>

{#if dragged && x && y}
	<DragGhost {x} {y}>
		<div class=" bg-black/80 backdrop-blur-2xl px-2 py-1 rounded-lg w-fit max-w-40">
			<div class="flex items-center gap-1">
				<Document className=" size-[18px]" strokeWidth="2" />
				<div class=" text-xs text-white line-clamp-1">
					{username}
				</div>
                <div class=" text-xs text-white line-clamp-1">
					{useremail}
				</div>
			</div>
		</div>
	</DragGhost>
{/if}

<div bind:this={itemElement} class=" w-full {className} relative group" {draggable}>
	<button
        class=" w-full flex justify-between rounded-lg px-[11px] py-[6px] bg-gray-100 dark:bg-gray-950 whitespace-nowrap text-ellipsis"
        on:click={async () => {
			showMemberPromptFromTeacher.set(true);
			showGroup.set(false);
            dispatch('select');

            if ($mobile) {
                showSidebar.set(false);
            }
        }}
        on:mouseenter={(e) => {
            mouseOver = true;
        }}
        on:mouseleave={(e) => {
            mouseOver = false;
        }}
        on:focus={(e) => {}}
        draggable="true"
    >
        <div class=" flex flex-col self-center flex-1 w-full">
            <div class=" text-left self-center overflow-hidden w-full h-[20px]">
                {username}
            </div>
            <div class=" text-left self-center overflow-hidden w-full h-[20px]">
                {useremail}
            </div>
        </div>
    <button />
</div>
