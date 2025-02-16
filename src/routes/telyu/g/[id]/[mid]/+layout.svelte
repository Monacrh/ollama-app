<script lang="ts">
	import { onMount, tick, getContext, onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	import {
		group,
		usersInGroup,
		selectedUser,
		showMemberPromptFromTeacher,
		selectedChats


	} from '$lib/stores';
	import { getChatListByUserId } from '$lib/apis/chats';

	onMount(async () => {
        console.log(`/telyu/g/${$page.params.id}/${
            $page.params.mid
        }`);
		if ($showMemberPromptFromTeacher) {
			selectedChats.set(await getChatListByUserId(localStorage.token, $page.params.mid));
		}


        await tick();
	});
	

	onDestroy(async () => {
		await tick();
	});
</script>

<slot />