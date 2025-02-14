<script lang="ts">
    import { onMount } from 'svelte';
    import DetailUser from '$lib/components/admin/Users/Groups/DetailUser.svelte';
    import { getUsers } from '$lib/apis/users';

    let users: any[] = [];
    let error: string | null = null;

    onMount(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                error = 'Token not found in localStorage';
                console.error(error);
                return;
            }

            // Fetch users with the token
            const fetchedUsers = await getUsers(token);
            users = fetchedUsers;
        } catch (err) {
            error = 'Failed to fetch users';
            console.error(err);
        }
    });
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold">Edit Users</h1>
    {#if error}
        <p class="text-red-500">{error}</p>
    {:else if users.length > 0}
        <DetailUser {users} />
    {:else}
        <p>Loading users...</p>
    {/if}
</div>
