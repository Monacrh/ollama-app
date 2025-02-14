<script lang="ts">
    export let data;
    import ChatKelas from '$lib/components/chat/ChatKelas.svelte';
</script>

<ChatKelas groupId={data.groupId} />