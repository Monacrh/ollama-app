<script>
	import { WEBUI_BASE_URL } from '$lib/constants';
	import { WEBUI_NAME, config, user, showSidebar } from '$lib/stores';
	import { onMount, getContext } from 'svelte';
  
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);
  
	import { toast } from 'svelte-sonner';
  
	import { updateUserRole, getUsers, deleteUserById } from '$lib/apis/users';
  
	import Pagination from '$lib/components/common/Pagination.svelte';
	import ChatBubbles from '$lib/components/icons/ChatBubbles.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
  
	import EditUserModal from '$lib/components/admin/Users/UserList/EditUserModal.svelte';
	import UserChatsModal from '$lib/components/admin/Users/UserList/UserChatsModal.svelte';
	import Users from '$lib/components/admin/Users/Groups/AddUser.svelte';
  
	import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
	import Badge from '$lib/components/common/Badge.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';
	import ChevronUp from '$lib/components/icons/ChevronUp.svelte';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import About from '$lib/components/chat/Settings/About.svelte';
  
	import UserPlusSolid from '$lib/components/icons/UserPlusSolid.svelte';
  
	const i18n = getContext('i18n');
  
	export let users = [];
	export let userIds = [];
  
	let search = '';
	let selectedUser = null;
  
	let page = 1;
  
	let showDeleteConfirmDialog = false;
	let showUsersModal = false;
	let showUserChatsModal = false;
	let showEditUserModal = false;
	let activeTab = 'users';  // Add this line to control the tab visibility
  
	const updateRoleHandler = async (id, role) => {
	  const res = await updateUserRole(localStorage.token, id, role).catch((error) => {
		toast.error(error);
		return null;
	  });
  
	  if (res) {
		users = await getUsers(localStorage.token);
	  }
	};
  
	const deleteUserHandler = async (id) => {
	  const res = await deleteUserById(localStorage.token, id).catch((error) => {
		toast.error(error);
		return null;
	  });
	  if (res) {
		users = await getUsers(localStorage.token);
	  }
	};
  
	let sortKey = 'created_at';
	let sortOrder = 'asc';
  
	function setSortKey(key) {
	  if (sortKey === key) {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
	  } else {
		sortKey = key;
		sortOrder = 'asc';
	  }
	}
  
	let filteredUsers;
  
	$: filteredUsers = users
	  .filter((user) => {
		if (search === '') {
		  return true;
		} else {
		  let name = user.name.toLowerCase();
		  const query = search.toLowerCase();
		  return name.includes(query);
		}
	  })
	  .sort((a, b) => {
		if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
		if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
		return 0;
	  })
	  .slice((page - 1) * 20, page * 20);
  </script>
  
  <ConfirmDialog
	bind:show={showDeleteConfirmDialog}
	on:confirm={() => {
	  deleteUserHandler(selectedUser.id);
	}}
  />
  
  {#key selectedUser}
	<EditUserModal
	  bind:show={showEditUserModal}
	  {selectedUser}
	  sessionUser={$user}
	  on:save={async () => {
		users = await getUsers(localStorage.token);
	  }}
	/>
  {/key}  
  <Modal size="sm" bind:show={showUsersModal}>
	<div>
	  <div class="flex justify-between dark:text-gray-100 px-5 pt-4 mb-1.5">
		<div class="text-lg font-medium self-center font-primary">
		  {$i18n.t('Add Users')}
		</div>
		<button
		  class="self-center"
		  on:click={() => {
			showUsersModal = false;
		  }}
		>
		  <svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="w-5 h-5"
		  >
			<path
			  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
			/>
		  </svg>
		</button>
	  </div>
  
	  <div class="px-5 pb-5">
		<Users {users} bind:userIds />
	  </div>
  
	  <div class="flex justify-end px-5 pb-4 text-sm font-medium gap-1.5">
		<button
		  class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full flex flex-row space-x-1 items-center"
		  on:click={() => {
			showUsersModal = false;
		  }}
		>
		  {$i18n.t('Done')}
		</button>
	  </div>
	</div>
  </Modal>
  
  <UserChatsModal bind:show={showUserChatsModal} user={selectedUser} />
  
  <div class="mt-0.5 mb-2 gap-1 flex flex-col md:flex-row justify-between">
	<div class="flex md:self-center text-lg font-medium px-0.5">
	  {$i18n.t('Member')}
	  <div class="flex self-center w-[1px] h-6 mx-2.5 bg-gray-50 dark:bg-gray-850" />
	  <span class="text-lg font-medium text-gray-500 dark:text-gray-300">{users.length}</span>
	</div>
  
	<div class="flex gap-1">
	  <div class="flex w-full space-x-2">
		<div class="flex flex-1">
		  <div class="self-center ml-1 mr-3">
			<svg
			  xmlns="http://www.w3.org/2000/svg"
			  viewBox="0 0 20 20"
			  fill="currentColor"
			  class="w-4 h-4"
			>
			  <path
				fill-rule="evenodd"
				d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
				clip-rule="evenodd"
			  />
			</svg>
		  </div>
		  <input
			class="w-full text-sm pr-4 py-1 rounded-r-xl outline-none bg-transparent"
			bind:value={search}
			placeholder={$i18n.t('Search')}
		  />
		</div>
  
		<div>
		  <Tooltip content={$i18n.t('Add User')}>
			<button
			  class="p-2 rounded-xl hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 transition font-medium text-sm flex items-center space-x-1"
			  on:click={() => {
				activeTab = 'addUser'; 
				showUsersModal = true;
			  }}
			>
			  <UserPlusSolid className="size-3.5" />
			</button>
		  </Tooltip>
		</div>
	  </div>
	</div>
  </div>
  
  <div class="scrollbar-hidden relative whitespace-nowrap overflow-x-auto max-w-full rounded pt-0.5">
	<table class="min-w-full table-auto">
	  <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-850 dark:text-gray-400 -translate-y-0.5">
		<tr>
		  <th
			scope="col"
			class="px-3 py-1.5 cursor-pointer select-none"
			on:click={() => setSortKey('name')}
		  >
			<div class="flex gap-1.5 items-center">
			  {$i18n.t('Name')}
			  {#if sortKey === 'name'}
				<span class="font-normal">
				  {#if sortOrder === 'asc'}
					<ChevronUp className="size-2" />
				  {:else}
					<ChevronDown className="size-2" />
				  {/if}
				</span>
			  {:else}
				<span class="invisible">
				  <ChevronUp className="size-2" />
				</span>
			  {/if}
			</div>
		  </th>
  
		  <th
			scope="col"
			class="px-3 py-1.5 cursor-pointer select-none"
			on:click={() => setSortKey('email')}
		  >
			<div class="flex gap-1.5 items-center">
			  {$i18n.t('Email')}
			</div>
		  </th>
  
		  <!-- <th
			scope="col"
			class="px-3 py-1.5 cursor-pointer select-none"
			on:click={() => setSortKey('last_active_at')}
		  >
			<div class="flex gap-1.5 items-center">
			  {$i18n.t('Last Active')}
			  {#if sortKey === 'last_active_at'}
				<span class="font-normal">
				  {#if sortOrder === 'asc'}
					<ChevronUp className="size-2" />
				  {:else}
					<ChevronDown className="size-2" />
				  {/if}
				</span>
			  {:else}
				<span class="invisible">
				  <ChevronUp className="size-2" />
				</span>
			  {/if}
			</div>
		  </th> -->
  
		  <th scope="col" class="px-3 py-2 text-right" />
		</tr>
	  </thead>
  
	  <tbody>
		{#each filteredUsers as user, userIdx}
		  <tr
			class="text-xs bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900"
		  >
			<td class="px-3 py-2 whitespace-nowrap">
			  <div class="text-sm text-gray-900 dark:text-gray-100">
				<div class="flex gap-2">
				  <span>{user.name}</span>
				</div>
			  </div>
			</td>
			<td class="px-3 py-2 whitespace-nowrap">
			  <div class="text-sm text-gray-900 dark:text-gray-100">
				{user.email}
			  </div>
			</td>
			<!-- <td class="px-3 py-2 whitespace-nowrap">
			  <div class="text-sm text-gray-500 dark:text-gray-400">
				{dayjs(user.last_active_at).fromNow()}
			  </div>
			</td> -->
  
			<td class="px-3 py-2 whitespace-nowrap text-right">
			  <div class="flex justify-end gap-1">
				<Tooltip content={$i18n.t('Edit')}>
				  <button
					class="p-2 rounded-xl hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 transition"
					on:click={() => {
					  selectedUser = user;
					  showEditUserModal = true;
					}}
				  >
					<svg
					  xmlns="http://www.w3.org/2000/svg"
					  viewBox="0 0 20 20"
					  fill="currentColor"
					  class="w-5 h-5"
					>
					  <path
						fill-rule="evenodd"
						d="M17.293 3.707a1 1 0 011.414 1.414L7.414 16.121a1 1 0 01-.296.16l-4.707 1.5a1 1 0 01-1.27-1.27l1.5-4.707a1 1 0 01.16-.296L15.879 2.293a1 1 0 011.414 1.414L7.707 15.707a1 1 0 01-.707.293h-.001a1 1 0 01-.707-.293L3.293 11.707a1 1 0 01-.161-.296l-1.5-4.707a1 1 0 011.27-1.27l4.707 1.5a1 1 0 01.296.16L15.707 4.707z"
						clip-rule="evenodd"
					  />
					</svg>
				  </button>
				</Tooltip>
				<Tooltip content={$i18n.t('Delete')}>
				  <button
					class="p-2 rounded-xl hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 transition"
					on:click={() => {
					  selectedUser = user;
					  showDeleteConfirmDialog = true;
					}}
				  >
					<svg
					  xmlns="http://www.w3.org/2000/svg"
					  viewBox="0 0 20 20"
					  fill="currentColor"
					  class="w-5 h-5"
					>
					  <path
						fill-rule="evenodd"
						d="M6 2a1 1 0 011-1h6a1 1 0 011 1v1h4a1 1 0 01.993.883L18 4v12a1 1 0 01-.883.993L17 17H3a1 1 0 01-.993-.883L2 16V4a1 1 0 01.883-.993L3 3h4V2zm2 2V2h4v2H8z"
						clip-rule="evenodd"
					  />
					</svg>
				  </button>
				</Tooltip>
			  </div>
			</td>
		  </tr>
		{/each}
	  </tbody>
	</table>
  
	<div class="px-5 py-4">
	  <Pagination
		bind:page
		pageSize={20}
		totalItems={users.length}
	  />
	</div>
  </div>