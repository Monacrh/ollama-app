<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { getContext, onMount } from 'svelte';
	const i18n = getContext('i18n');

	import Modal from '$lib/components/common/Modal.svelte';
	import Textarea from '$lib/components/common/Textarea.svelte';
	import { createNewGroup } from '$lib/apis/groups';
    import {getUsers} from '$lib/apis/users';
	import { showCreateGroup } from '$lib/stores';

	// export let show: boolean;
	export let users = [];
	export let refreshGroups: () => Promise<void> = async () => {};
        
	let name = '';
	let description = '';
	let selectedUserIds: string[] = [];
	let loading = false;

    onMount(async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('User is not authenticated');
            return;
        }

        users = await getUsers(token);
        console.log('Users:', users);
    } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(error?.message || 'Failed to load users');
    }
});

	const submitHandler = async () => {
		if (!name) {
			toast.error($i18n.t('Group name is required'));
			return;
		}

		if (selectedUserIds.length === 0) {
			toast.error($i18n.t('Select at least one member'));
			return;
		}

		loading = true;

		try {
			await createNewGroup(localStorage.token, {
				name,
				description,
				members: selectedUserIds.map(id => ({ id }))
			});

			toast.success($i18n.t('Group created successfully'));
			await refreshGroups();
			showCreateGroup.set(false)
			resetForm();
		} catch (error) {
			console.error('Group creation error:', error);
			toast.error(error?.message || $i18n.t('Failed to create group'));
		} finally {
			loading = false;
		}
	};

	const resetForm = () => {
		name = '';
		description = '';
		selectedUserIds = [];
	};

	onMount(() => {
		console.log('AddGroup component mounted');
	});
</script>

<div class="h-full flex flex-col bg-white dark:bg-gray-900">
	<!-- Header -->
	<div class="flex items-center p-4 border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
		<!-- <h2 class="ml-4 text-lg font-semibold text-red-700 dark:text-red-300">
			{$i18n.t('Buat Kelas Baru')}
		</h2> -->
	</div>

	<!-- Form Content -->
	<form
		class="flex-1 overflow-y-auto p-6 space-y-6"
		on:submit|preventDefault={submitHandler}
	>
		<!-- Name Input -->
		<div class="space-y-3">
			<label class="block text-sm font-semibold text-red-700 dark:text-red-300">
				{$i18n.t('Nama Kelas')}
			</label>
			<input
				type="text"
				bind:value={name}
				class="w-full px-4 py-3 rounded-lg border-2 border-red-100 dark:border-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-transparent placeholder-red-300 transition-all"
				placeholder={$i18n.t('Masukkan nama kelas')}
				required
				disabled={loading}
			/>
		</div>

		<!-- Member Selection -->
		<div class="space-y-3">
			<label class="block text-sm font-semibold text-red-700 dark:text-red-300">
				{$i18n.t('Pilih Anggota')}
			</label>
			<div class="max-h-64 overflow-y-auto rounded-lg border-2 border-red-100 dark:border-red-900 p-2 space-y-2">
				{#each users as user (user.id)}
					<label class="flex items-center p-3 space-x-3 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors {selectedUserIds.includes(user.id) ? 'bg-red-50 dark:bg-red-900/30' : ''}">
						<div class="relative">
							<input 
								type="checkbox" 
								value={user.id}
								bind:group={selectedUserIds}
								class="sr-only"
								disabled={loading}
							/>
							<div class="w-5 h-5 flex items-center justify-center rounded-md border-2 transition-colors
								{selectedUserIds.includes(user.id) 
									? 'bg-red-600 border-red-600 dark:bg-red-700' 
									: 'border-red-300 dark:border-red-700'}">
								{#if selectedUserIds.includes(user.id)}
									<svg class="w-3 h-3 text-white" viewBox="0 0 12 9" fill="none">
										<path d="M11 1L4.125 7.875L1 4.75" stroke="currentColor" stroke-width="2" 
											stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{/if}
							</div>
						</div>
						<div class="flex flex-col">
							<span class="text-red-900 dark:text-red-100 font-medium">{user.name}</span>
							<span class="text-sm text-red-500 dark:text-red-400">{user.email}</span>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<!-- Submit Button Section -->
<div class="flex flex-col space-y-3 pt-4 mt-4 border-t border-red-100 dark:border-red-900">
    <button
        type="submit"
        class="w-full py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center"
        disabled={loading}
    >
        {#if loading}
            <svg 
                class="animate-spin h-5 w-5 mr-2 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
            >
                <circle class="opacity-25 text-red-300" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
        {/if}
        {$i18n.t('Simpan Kelas')}
    </button>

    <button
        on:click|preventDefault={() => showCreateGroup.set(false)}
        class="w-full py-2 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
    >
        {$i18n.t('Back')}
    </button>
</div>
	</form>
</div>