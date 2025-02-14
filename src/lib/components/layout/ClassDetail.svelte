<script>
    import { groupStore, showCreateGroup } from '$lib/stores';
    import { goto } from '$app/navigation'; // Import the goto function for navigation
    import MemberItem from './Sidebar/MemberItem.svelte'; // Assuming you have a MemberItem component

    // Access the group data from the store
    $: group = $groupStore;

    // Function to handle the back button click
    function handleBack() {
        // Option 1: Navigate back to the previous page
        goto('/telyu'); // Replace '/' with the desired route (e.g., the main groups page)

        // Option 2: Reset the groupStore to hide the group-specific sidebar
        groupStore.set(null);
		showCreateGroup.set(false);
    }
</script>

<div class="flex flex-col space-y-4 p-4">
    <!-- Back Button -->
    <button
        class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
        on:click={handleBack}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
        </svg>
        <span>Kembali</span>
    </button>

    <!-- Class Name -->
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-200">
        {group?.name || 'Nama Kelas'}
    </h2>
    <!-- <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-200">
        {'Chat Kelas'}
    </h2> -->

    <!-- List of Members -->
    <div class="flex flex-col space-y-2">
        {#if group?.members && group.members.length > 0}
            {#each group.members as member}
                <MemberItem {member} />
            {/each}
        {:else}
            <p class="text-gray-500 dark:text-gray-400">No members available</p>
        {/if}
    </div>
</div>