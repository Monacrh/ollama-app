<script lang="ts">
	import { page } from '$app/stores';

    import Chat from '$lib/components/chat/Chat.svelte';
	import Help from '$lib/components/layout/Help.svelte';
</script>

<div>
    {$page.params.id}
</div>
<div>
    {$page.params.uid}
</div>