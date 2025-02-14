<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { getContext, onMount } from 'svelte';
	import { WEBUI_BASE_URL } from '$lib/constants'; // Import missing config variable

	// Components
	import Modal from '$lib/components/common/Modal.svelte';
	import Textarea from '$lib/components/common/Textarea.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Checkbox from '$lib/components/common/Checkbox.svelte';
	import Badge from '$lib/components/common/Badge.svelte'; // Import missing Badge component

	// Stores and APIs
	import { showCreateGroup } from '$lib/stores';
	import { createNewGroup } from '$lib/apis/groups';
	import { getUsers } from '$lib/apis/users';

	const i18n = getContext('i18n');

	export let refreshGroups: () => Promise<void> = async () => {};

	// State variables
	let name = '';
	let description = '';
	// let userIds: string[] = [];
	let loading = false;
	// let users = []; // Local users list instead of prop
	// let query = '';

	export let users = [];
	export let userIds = [];

	let filteredUsers = [];

	onMount(async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				toast.error('User is not authenticated');
				return;
			}

			users = await getUsers(token);
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error(error?.message || 'Failed to load users');
		}
	});

	$: filteredUsers = users
		.filter((user) => {
			if (user?.role === 'admin') {
				return false;
			}

			if (query === '') {
				return true;
			}

			return (
				user.name.toLowerCase().includes(query.toLowerCase()) ||
				user.email.toLowerCase().includes(query.toLowerCase())
			);
		})
		.sort((a, b) => {
			const aUserIndex = userIds.indexOf(a.id);
			const bUserIndex = userIds.indexOf(b.id);

			// Compare based on userIds or fall back to alphabetical order
			if (aUserIndex !== -1 && bUserIndex === -1) return -1; // 'a' has valid userId -> prioritize
			if (bUserIndex !== -1 && aUserIndex === -1) return 1; // 'b' has valid userId -> prioritize

			// Both a and b are either in the userIds array or not, so we'll sort them by their indices
			if (aUserIndex !== -1 && bUserIndex !== -1) return aUserIndex - bUserIndex;

			// If both are not in the userIds, fallback to alphabetical sorting by name
			return a.name.localeCompare(b.name);
		});

	let query = '';

	const submitHandler = async () => {
		if (!name) {
			toast.error($i18n.t('Group name is required'));
			return;
		}

		if (userIds.length === 0) {
			toast.error($i18n.t('Select at least one member'));
			return;
		}

		loading = true;

		try {
			await createNewGroup(localStorage.token, {
				name,
				description,
				members: userIds.map(id => ({ id }))
			});

			toast.success($i18n.t('Group created successfully'));
			await refreshGroups();
			showCreateGroup.set(false);
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
		userIds = [];
	};
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
			<input
				class="w-full text-sm pr-4 rounded-r-xl outline-none bg-transparent"
				bind:value={query}
				placeholder={$i18n.t('Search')}
			/>
			
			<div class="mt-3 max-h-[22rem] overflow-y-auto scrollbar-hidden">
				<div class="flex flex-col gap-2.5">
					{#if filteredUsers.length > 0}
						{#each filteredUsers as user, userIdx (user.id)}
							<div class="flex flex-row items-center gap-3 w-full text-sm">
								<div class="flex items-center">
									<Checkbox
										state={userIds.includes(user.id) ? 'checked' : 'unchecked'}
										on:change={(e) => {
											if (e.detail === 'checked') {
												userIds = [...userIds, user.id];
											} else {
												userIds = userIds.filter((id) => id !== user.id);
											}
										}}
									/>
								</div>
		
								<div class="flex w-full items-center justify-between">
									<Tooltip content={user.email} placement="top-start">
										<div class="flex">
											<img
												class=" rounded-full size-5 object-cover mr-2.5"
												src={user.profile_image_url.startsWith(WEBUI_BASE_URL) ||
												user.profile_image_url.startsWith('https://www.gravatar.com/avatar/') ||
												user.profile_image_url.startsWith('data:')
													? user.profile_image_url
													: `/user.png`}
												alt="user"
											/>
		
											<div class=" font-medium self-center">{user.name}</div>
										</div>
									</Tooltip>
		
									{#if userIds.includes(user.id)}
										<Badge type="success" content="member" />
									{/if}
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-gray-500 text-xs text-center py-2 px-10">
							{$i18n.t('No users were found.')}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ... submit buttons ... -->
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
