<script lang="ts">
	import { onMount, tick, getContext } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	import {
		group,

		usersInGroup

	} from '$lib/stores';
	import { getGroupById, getUsersInGroup } from '$lib/apis/groups';

	onMount(async () => {
		group.set(await getGroupById(localStorage.token, $page.params.id));
        console.log(group);
        usersInGroup.set( await getUsersInGroup(localStorage.token, $group.id));
        await tick();
	});
	// };
</script>

<slot />