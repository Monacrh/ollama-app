<script lang="ts">
	import { onMount, tick, getContext, onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	import {
		group,
		usersInGroup,

	} from '$lib/stores';
	import { getGroupById, getUsersInGroup } from '$lib/apis/groups';

	onMount(async () => {
        console.log(`/telyu/g/${$page.params.id}/${
            $page.params.mid
        }`);
        await tick();
	});
	

	onDestroy(async () => {
		await tick();
	});
</script>

<slot />