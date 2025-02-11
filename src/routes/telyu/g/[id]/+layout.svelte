<script lang="ts">
	import { onMount, tick, getContext } from 'svelte';
	import { openDB, deleteDB } from 'idb';
	import fileSaver from 'file-saver';
	const { saveAs } = fileSaver;

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { getModels, getVersionUpdates } from '$lib/apis';
	import { getTools } from '$lib/apis/tools';
	import { getBanners } from '$lib/apis/configs';
	import { getUserSettings } from '$lib/apis/users';

	import {
		config,
		user,
		showSettings,
		showChangelog,
		temporaryChatEnabled,
        group,
        usersInGroup
	} from '$lib/stores';
	import { getGroupById, getUsersInGroup } from '$lib/apis/groups';

	onMount(async () => {
		group.set(await getGroupById(localStorage.token, $page.params.id));
        usersInGroup.set(await getUsersInGroup(localStorage.token, $page.params.id));

        await tick();
	});
</script>

<slot />
