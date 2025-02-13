<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';

	import { page } from '$app/stores';
	import { usersInGroup } from '$lib/stores';
	import { goto } from '$app/navigation';
	import {
		user,
		chats,
		settings,
		showSettings,
		chatId,
		tags,
		showSidebar,
		mobile,
		showArchivedChats,
		pinnedChats,
		scrollPaginationEnabled,
		currentChatPage,
		temporaryChatEnabled,
		channels,
		socket,
		config
	} from '$lib/stores';
	import { onMount, getContext, tick, onDestroy } from 'svelte';

	const i18n = getContext('i18n');

	import {
		deleteChatById,
		getChatList,
		getAllTags,
		getChatListBySearchText,
		createNewChat,
		getPinnedChatList,
		toggleChatPinnedStatusById,
		getChatPinnedStatusById,
		getChatById,
		updateChatFolderIdById,
		importChat
	} from '$lib/apis/chats';
	import { getUsersInGroup, deleteGroupById, getGroupById } from '$lib/apis/groups';
	import { createNewFolder, getFolders, updateFolderParentIdById } from '$lib/apis/folders';
	import { WEBUI_BASE_URL } from '$lib/constants';

	import ArchivedChatsModal from './Sidebar/ArchivedChatsModal.svelte';
	import UserMenu from './Sidebar/UserMenu.svelte';
	import ChatItem from './Sidebar/ChatItem.svelte';
	import MemberItem from './Sidebar/MemberItem.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Loader from '../common/Loader.svelte';
	import AddFilesPlaceholder from '../AddFilesPlaceholder.svelte';
	import SearchInput from './Sidebar/SearchInput.svelte';
	import Folder from '../common/Folder.svelte';
	import Plus from '../icons/Plus.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import Folders from './Sidebar/Folders.svelte';
	import { getChannels, createNewChannel } from '$lib/apis/channels';
	import ChannelModal from './Sidebar/ChannelModal.svelte';
	import ChannelItem from './Sidebar/ChannelItem.svelte';
	import PencilSquare from '../icons/PencilSquare.svelte';
	import {getGroups} from '$lib/apis/groups';
	import FloatBtn from './FloatBtn.svelte';
	import { getUsers } from '$lib/apis/users';
	import { showCreateGroup } from '$lib/stores';
	import { createNewGroup} from '$lib/apis/groups';
	import AddGroup from './AddGroup.svelte';
	import { showWelcomeScreen } from '$lib/stores'


	const BREAKPOINT = 768;

	// (only a dumb chat, feel free to delete it)
	const createSimpleChat = async (user_id) => {
    return {
        id: uuidv4(),
        name: 'Simple Chat',
        messages: [],
        is_dumb: true,
        created_at: new Date().toISOString()
    };
};

	let groups = [];
	let group = {};
	// let users = [];
	// let users = [];
	export let users = [];
  	let selectedUsers = [];

	let navElement;
	let search = '';

	let sortKey = 'created_at';
	let sortOrder = 'asc';

	let filteredUsers;

	$: filteredUsers = users
		.filter((user) => {
			if (search === '') {
				return true;
			} else {
				const name = user.name.toLowerCase();
				const query = search.toLowerCase();
				const isIncluded = name.includes(query);
				console.log(`${query} included? ${isIncluded}`);
				return isIncluded;
			}
		});

	let shiftKey = false;

	let selectedChatId = null;
	let showDropdown = false;
	let showPinnedChat = true;

	let showCreateChannel = false;

	// Pagination variables
	let chatListLoading = false;
	let allChatsLoaded = false;

	let folders = {};

	let activeMenuId = null;

	// const gotoGroupPage = (groupId: string) => {
    // 	goto(`/admin/users/editusers/{groupId}`);
	// 	goto('/admin/users/editusers');

	// };

	function gotoGroupPage() {
		goto('/chat'); // Navigates to the Users page
	}

    const toggleMenu = (groupId) => {
        activeMenuId = activeMenuId === groupId ? null : groupId;
    };

    const handleDeleteGroup = async (groupId) => {
        if (confirm('Are you sure you want to delete this group class?')) {
            try {
                await deleteGroupById(localStorage.token, groupId);
                groups = groups.filter(g => g.id !== groupId);
                toast.success($i18n.t('Group deleted successfully'));
            } catch (error) {
                toast.error(error?.message || $i18n.t('Failed to delete group'));
            }
        }
        activeMenuId = null;
    };

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

    // Close menu when clicking outside
    onMount(() => {
        const closeMenu = () => activeMenuId = null;
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    });

	const setGroups = async () => {
        try {
            groups = await getGroups(localStorage.token);
        } catch (error) {
            toast.error(error);
        }
    };

	const setUserInGroups = async () => {
		if ($page.url.pathname.includes('telyu/g')) {
			try {
				let tempUsers = await getUsersInGroup(localStorage.token, $page.params.id);
				users = tempUsers.users;
			} catch (error) {
				toast.error(error);
			}
		}
	};

	const setGroupById = async () => {
		if ($page.url.pathname.includes('telyu/g')) {
			try {
				group = await getGroupById(localStorage.token, $page.params.id);
				// users = await getUsers(localStorage.token);
			} catch (error) {
				toast.error(error);
			}
		}
	}

    // Load groups on component mount
    onMount(async () => {
        await setGroups();
		await setGroupById();
		await setUserInGroups();
	});

	const initFolders = async () => {
		const folderList = await getFolders(localStorage.token).catch((error) => {
			toast.error(error);
			return [];
		});

		folders = {};

		// First pass: Initialize all folder entries
		for (const folder of folderList) {
			// Ensure folder is added to folders with its data
			folders[folder.id] = { ...(folders[folder.id] || {}), ...folder };
		}

		// Second pass: Tie child folders to their parents
		for (const folder of folderList) {
			if (folder.parent_id) {
				// Ensure the parent folder is initialized if it doesn't exist
				if (!folders[folder.parent_id]) {
					folders[folder.parent_id] = {}; // Create a placeholder if not already present
				}

				// Initialize childrenIds array if it doesn't exist and add the current folder id
				folders[folder.parent_id].childrenIds = folders[folder.parent_id].childrenIds
					? [...folders[folder.parent_id].childrenIds, folder.id]
					: [folder.id];

				// Sort the children by updated_at field
				folders[folder.parent_id].childrenIds.sort((a, b) => {
					return folders[b].updated_at - folders[a].updated_at;
				});
			}
		}
	};

	const createFolder = async (name = 'Untitled') => {
		if (name === '') {
			toast.error($i18n.t('Folder name cannot be empty.'));
			return;
		}

		const rootFolders = Object.values(folders).filter((folder) => folder.parent_id === null);
		if (rootFolders.find((folder) => folder.name.toLowerCase() === name.toLowerCase())) {
			// If a folder with the same name already exists, append a number to the name
			let i = 1;
			while (
				rootFolders.find((folder) => folder.name.toLowerCase() === `${name} ${i}`.toLowerCase())
			) {
				i++;
			}

			name = `${name} ${i}`;
		}

		// Add a dummy folder to the list to show the user that the folder is being created
		const tempId = uuidv4();
		folders = {
			...folders,
			tempId: {
				id: tempId,
				name: name,
				created_at: Date.now(),
				updated_at: Date.now()
			}
		};

		const res = await createNewFolder(localStorage.token, name).catch((error) => {
			toast.error(error);
			return null;
		});

		if (res) {
			await initFolders();
		}
	};

	const initChannels = async () => {
		await channels.set(await getChannels(localStorage.token));
	};

	const initChatList = async () => {
		// Reset pagination variables
		tags.set(await getAllTags(localStorage.token));
		pinnedChats.set(await getPinnedChatList(localStorage.token));
		initFolders();

		currentChatPage.set(1);
		allChatsLoaded = false;

		if (search) {
			await chats.set(await getChatListBySearchText(localStorage.token, search, $currentChatPage));
		} else {
			await chats.set(await getChatList(localStorage.token, $currentChatPage));
		}

		// Enable pagination
		scrollPaginationEnabled.set(true);
	};

	const loadMoreChats = async () => {
		chatListLoading = true;

		currentChatPage.set($currentChatPage + 1);

		let newChatList = [];

		if (search) {
			newChatList = await getChatListBySearchText(localStorage.token, search, $currentChatPage);
		} else {
			newChatList = await getChatList(localStorage.token, $currentChatPage);
		}

		// once the bottom of the list has been reached (no results) there is no need to continue querying
		allChatsLoaded = newChatList.length === 0;
		await chats.set([...($chats ? $chats : []), ...newChatList]);

		chatListLoading = false;
	};

	let searchDebounceTimeout;

	const searchDebounceHandler = async () => {
		console.log('search', search);
		chats.set(null);

		if (searchDebounceTimeout) {
			clearTimeout(searchDebounceTimeout);
		}

		if (search === '') {
			await initChatList();
			return;
		} else {
			searchDebounceTimeout = setTimeout(async () => {
				allChatsLoaded = false;
				currentChatPage.set(1);
				await chats.set(await getChatListBySearchText(localStorage.token, search));

				if ($chats.length === 0) {
					tags.set(await getAllTags(localStorage.token));
				}
			}, 1000);
		}
	};

	const importChatHandler = async (items, pinned = false, folderId = null) => {
		console.log('importChatHandler', items, pinned, folderId);
		for (const item of items) {
			console.log(item);
			if (item.chat) {
				await importChat(localStorage.token, item.chat, item?.meta ?? {}, pinned, folderId);
			}
		}

		initChatList();
	};

	const inputFilesHandler = async (files) => {
		console.log(files);

		for (const file of files) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				const content = e.target.result;

				try {
					const chatItems = JSON.parse(content);
					importChatHandler(chatItems);
				} catch {
					toast.error($i18n.t(`Invalid file format.`));
				}
			};

			reader.readAsText(file);
		}
	};

	const tagEventHandler = async (type, tagName, chatId) => {
		console.log(type, tagName, chatId);
		if (type === 'delete') {
			initChatList();
		} else if (type === 'add') {
			initChatList();
		}
	};

	let draggedOver = false;

	const onDragOver = (e) => {
		e.preventDefault();

		// Check if a file is being draggedOver.
		if (e.dataTransfer?.types?.includes('Files')) {
			draggedOver = true;
		} else {
			draggedOver = false;
		}
	};

	const onDragLeave = () => {
		draggedOver = false;
	};

	const onDrop = async (e) => {
		e.preventDefault();
		console.log(e); // Log the drop event

		// Perform file drop check and handle it accordingly
		if (e.dataTransfer?.files) {
			const inputFiles = Array.from(e.dataTransfer?.files);

			if (inputFiles && inputFiles.length > 0) {
				console.log(inputFiles); // Log the dropped files
				inputFilesHandler(inputFiles); // Handle the dropped files
			}
		}

		draggedOver = false; // Reset draggedOver status after drop
	};

	let touchstart;
	let touchend;

	function checkDirection() {
		const screenWidth = window.innerWidth;
		const swipeDistance = Math.abs(touchend.screenX - touchstart.screenX);
		if (touchstart.clientX < 40 && swipeDistance >= screenWidth / 8) {
			if (touchend.screenX < touchstart.screenX) {
				showSidebar.set(false);
			}
			if (touchend.screenX > touchstart.screenX) {
				showSidebar.set(true);
			}
		}
	}

	const onTouchStart = (e) => {
		touchstart = e.changedTouches[0];
		console.log(touchstart.clientX);
	};

	const onTouchEnd = (e) => {
		touchend = e.changedTouches[0];
		checkDirection();
	};

	const onKeyDown = (e) => {
		if (e.key === 'Shift') {
			shiftKey = true;
		}
	};

	const onKeyUp = (e) => {
		if (e.key === 'Shift') {
			shiftKey = false;
		}
	};

	const onFocus = () => {};

	const onBlur = () => {
		shiftKey = false;
		selectedChatId = null;
	};

	onMount(async () => {
		showPinnedChat = localStorage?.showPinnedChat ? localStorage.showPinnedChat === 'true' : true;

		mobile.subscribe((e) => {
			if ($showSidebar && e) {
				showSidebar.set(false);
			}

			if (!$showSidebar && !e) {
				showSidebar.set(true);
			}
		});

		showSidebar.set(!$mobile ? localStorage.sidebar === 'true' : false);
		showSidebar.subscribe((value) => {
			localStorage.sidebar = value;
		});

		await initChannels();
		await initChatList();

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);

		window.addEventListener('touchstart', onTouchStart);
		window.addEventListener('touchend', onTouchEnd);

		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);

		const dropZone = document.getElementById('sidebar');

		dropZone?.addEventListener('dragover', onDragOver);
		dropZone?.addEventListener('drop', onDrop);
		dropZone?.addEventListener('dragleave', onDragLeave);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);

		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchend', onTouchEnd);

		window.removeEventListener('focus', onFocus);
		window.removeEventListener('blur', onBlur);

		const dropZone = document.getElementById('sidebar');

		dropZone?.removeEventListener('dragover', onDragOver);
		dropZone?.removeEventListener('drop', onDrop);
		dropZone?.removeEventListener('dragleave', onDragLeave);
	});
</script>

<!-- <ArchivedChatsModal
	bind:show={$showArchivedChats}
	on:change={async () => {
		await initChatList();
	}}
/> -->

<!-- <ChannelModal
	bind:show={showCreateChannel}
	onSubmit={async ({ name, access_control }) => {
		const res = await createNewChannel(localStorage.token, {
			name: name,
			access_control: access_control
		}).catch((error) => {
			toast.error(error);
			return null;
		});

		if (res) {
			$socket.emit('join-channels', { auth: { token: $user.token } });
			await initChannels();
			showCreateChannel = false;
		}
	}}
/> -->

<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if $showSidebar}
	<div
		class=" fixed md:hidden z-40 top-0 right-0 left-0 bottom-0 bg-black/60 w-full min-h-screen h-screen flex justify-center overflow-hidden overscroll-contain"
		on:mousedown={() => {
			showSidebar.set(!$showSidebar);
		}}
	/>
{/if}

<div
	bind:this={navElement}
	id="sidebar"
	class="h-screen max-h-[100dvh] min-h-screen select-none {$showSidebar
		? 'md:relative w-[260px] max-w-[260px]'
		: '-translate-x-[260px] w-[0px]'} bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-200 text-sm transition fixed z-50 top-0 left-0 overflow-x-hidden
        "
	data-state={$showSidebar}
>
	<div
		class="relative py-2 my-auto flex flex-col justify-between h-screen max-h-[100dvh] w-[260px] overflow-x-hidden z-50 {$showSidebar
			? ''
			: 'invisible'}"
	>
		<div class="px-1.5 flex justify-between space-x-1 text-gray-600 dark:text-gray-400">
			<button
				class=" cursor-pointer p-[7px] flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition"
				on:click={() => {
					showSidebar.set(!$showSidebar);
				}}
			>
				<div class=" m-auto self-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
						/>
					</svg>
				</div>
			</button>

			<a
				id="sidebar-new-chat-button"
				class="flex justify-between items-center flex-1 rounded-lg px-2 py-1 h-full text-right hover:bg-gray-100 dark:hover:bg-gray-900 transition"
				href="/telyu"
				draggable="false"
				on:click={async () => {
					selectedChatId = null;
					const newChatButton = document.getElementById('new-chat-button');
					setTimeout(() => {
						newChatButton?.click();
						if ($mobile) {
							showSidebar.set(false);
						}
						// Dismiss welcome screen
						$showWelcomeScreen = false;
            			localStorage.setItem('firstVisit', 'completed');
					}, 0);
				}}
			>
				<!-- Chat baru dengan logo telu -->
				<div class="flex items-center">
					<div class="self-center mx-1.5">
						<img
							crossorigin="anonymous"
							src="{WEBUI_BASE_URL}/static/favicon/telu.png"
							class=" size-5 -translate-x-1.5 rounded-full"
							alt="logo"
						/>
					</div>
					<div class=" self-center font-medium text-sm text-gray-850 dark:text-white font-primary">
						{$i18n.t('Chat Baru')}
					</div>
				</div>
				<!-- <div class="flex items-center">
					<img
						crossorigin="anonymous"
						src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngwing.com%2Fen%2Fsearch%3Fq%3Dtelkom%2BUniversity&psig=AOvVaw1XleTqN_JGyxSw8PSGyZkE&ust=1737812524163000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCKj18KS-josDFQAAAAAdAAAAABAE"
						class="size-5 -translate-x-1.5 rounded-full"
						alt="logo"
					/>
				</div> -->
				<!-- <div>
					<PencilSquare className=" size-5" strokeWidth="2" />
				</div> -->
			</a>
		</div>

		<!-- {#if $user?.role === 'admin' || $user?.permissions?.workspace?.models || $user?.permissions?.workspace?.knowledge || $user?.permissions?.workspace?.prompts || $user?.permissions?.workspace?.tools}
			<div class="px-1.5 flex justify-center text-gray-800 dark:text-gray-200">
				<a
					class="flex-grow flex space-x-3 rounded-lg px-2 py-[7px] hover:bg-gray-100 dark:hover:bg-gray-900 transition"
					href="/workspace"
					on:click={() => {
						selectedChatId = null;
						chatId.set('');

						if ($mobile) {
							showSidebar.set(false);
						}
					}}
					draggable="false"
				>
					<div class="self-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="size-[1.1rem]"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
							/>
						</svg>
					</div>

					<div class="flex self-center">
						<div class=" self-center font-medium text-sm font-primary">{$i18n.t('Workspace')}</div>
					</div>
				</a>
			</div>
		{/if} -->

		<!-- <div class="relative {$temporaryChatEnabled ? 'opacity-20' : ''}">
			{#if $temporaryChatEnabled}
				<div class="absolute z-40 w-full h-full flex justify-center"></div>
			{/if}

			<SearchInput
				bind:value={search}
				on:input={searchDebounceHandler}
				placeholder={$i18n.t('Search')}
			/>
		</div> -->

		<!-- /Cek apakah url mengarah ke kelas atau home -->
		<!-- {#if $page.url.pathname.includes('telyu/g')} -->
		<div
			class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden {$temporaryChatEnabled
				? 'opacity-20'
				: ''}"
		>
		{#if $showCreateGroup}
			<AddGroup />
		{:else}
		<!-- {#if $config?.features?.enable_channels && ($user.role === 'admin' || $channels.length > 0) && !search}
			<Folder
				className="px-2 mt-0.5"
				name={$i18n.t('Channels')}
				dragAndDrop={false}
				onAdd={$user.role === 'admin'
					? () => {
							showCreateChannel = true;
						}
					: null}
				onAddLabel={$i18n.t('Create Channel')}
			>
				{#each $channels as channel}
					<ChannelItem
						{channel}
						onUpdate={async () => {
							await initChannels();
						}}
					/>
				{/each}
			</Folder>
		{/if} -->
		<Folder
			collapsible={!search}
			className="px-2 mt-0.5"
			name="Kelas Saya"
			onAddLabel="New Group Class"
			>
			{#if groups.length === 0}
				<div class="text-center text-gray-500 py-4 text-sm">
					No groups available
				</div>
			{:else}
			<div class="flex flex-col">
				{#each groups as group (group.id)}
					<div 
						class="group relative flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer border-b border-gray-200 dark:border-gray-800"
						on:click={async () => {
							try {
								// Call the gotoGroupPage function (assuming it might be async)
								await gotoGroupPage();
						
								// Update the Svelte store to hide the welcome screen
								$showWelcomeScreen = false;
						
								// Store the first visit status in localStorage
								localStorage.setItem('firstVisit', 'completed');
							} catch (error) {
								console.error("An error occurred during the click handler:", error);
							}
						}}
						role="button"
						tabindex="0"
						on:keydown={(e) => ['Enter', ' '].includes(e.key) && gotoGroupPage(group.id)}
						aria-label="View {group.name} details"
					>
						<!-- Group Name -->
						<div class="flex-1 text-gray-900 dark:text-gray-200 truncate">
							{group.name}
						</div>

						<!-- Context Menu -->
						<div class="relative">
							<button
								class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
								on:click|stopPropagation={() => toggleMenu(group.id)}
								aria-label="Open actions menu for {group.name}"
								aria-haspopup="true"
								aria-expanded={activeMenuId === group.id}
								data-group={group.id}
							>
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									class="h-5 w-5 text-gray-500" 
									fill="none" 
									viewBox="0 0 24 24" 
									stroke="currentColor"
									aria-hidden="true"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
								</svg>
							</button>

							{#if activeMenuId === group.id}
								<div 
									class="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5"
									role="menu"
									aria-orientation="vertical"
									data-menu={group.id}
								>
									<div class="py-1">
										<button
											class="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
											on:click|stopPropagation={() => handleEditGroup(group.id)}
											role="menuitem"
											tabindex="-1"
											on:keydown={(e) => handleMenuKeydown(e, group.id)}
										>
											Kelolah
										</button>
										<button
											class="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
											on:click|stopPropagation={() => handleDeleteGroup(group.id)}
											role="menuitem"
											tabindex="-1"
											on:keydown={(e) => handleMenuKeydown(e, group.id)}
										>
											Delete
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{/if}
		</Folder>
			{/if}

				<!-- Chat Saya -->
				<Folder
					collapsible={!search}
					className="px-2 mt-0.5"
					name={$i18n.t('Chat Saya')}
					onAdd={() => {
						createFolder();
					}}
					onAddLabel={$i18n.t('Chat Saya')}
					on:import={(e) => {
						importChatHandler(e.detail);
					}}
					on:drop={async (e) => {
						const { type, id, item } = e.detail;
						// Dismiss welcome screen when dropping items
						$showWelcomeScreen = false;
        				localStorage.setItem('firstVisit', 'completed');

						if (type === 'chat') {
							let chat = await getChatById(localStorage.token, id).catch((error) => {
								return null;
							});
							if (!chat && item) {
								chat = await importChat(localStorage.token, item.chat, item?.meta ?? {});
							}

							if (chat) {
								console.log(chat);
								if (chat.folder_id) {
									const res = await updateChatFolderIdById(localStorage.token, chat.id, null).catch(
										(error) => {
											toast.error(error);
											return null;
										}
									);
								}

								if (chat.pinned) {
									const res = await toggleChatPinnedStatusById(localStorage.token, chat.id);
								}

								initChatList();
							}
						} else if (type === 'folder') {
							if (folders[id].parent_id === null) {
								return;
							}

							const res = await updateFolderParentIdById(localStorage.token, id, null).catch(
								(error) => {
									toast.error(error);
									return null;
								}
							);

							if (res) {
								await initFolders();
							}
						}
					}}
				>
					<!-- {#if $temporaryChatEnabled}
						<div class="absolute z-40 w-full h-full flex justify-center"></div>
					{/if} -->

					<!-- {#if !search && $pinnedChats.length > 0}
						<div class="flex flex-col space-y-1 rounded-xl">
							<Folder
								className=""
								bind:open={showPinnedChat}
								on:change={(e) => {
									localStorage.setItem('showPinnedChat', e.detail);
									console.log(e.detail);
								}}
								on:import={(e) => {
									importChatHandler(e.detail, true);
								}}
								on:drop={async (e) => {
									const { type, id, item } = e.detail;

									if (type === 'chat') {
										let chat = await getChatById(localStorage.token, id).catch((error) => {
											return null;
										});
										if (!chat && item) {
											chat = await importChat(localStorage.token, item.chat, item?.meta ?? {});
										}

										if (chat) {
											console.log(chat);
											if (chat.folder_id) {
												const res = await updateChatFolderIdById(
													localStorage.token,
													chat.id,
													null
												).catch((error) => {
													toast.error(error);
													return null;
												});
											}

											if (!chat.pinned) {
												const res = await toggleChatPinnedStatusById(localStorage.token, chat.id);
											}

											initChatList();
										}
									}
								}}
								name={$i18n.t('Pinned')}
							>
								<div
									class="ml-3 pl-1 mt-[1px] flex flex-col overflow-y-auto scrollbar-hidden border-s border-gray-100 dark:border-gray-900"
								>
									{#each $pinnedChats as chat, idx}
										<ChatItem
											className=""
											id={chat.id}
											title={chat.title}
											{shiftKey}
											selected={selectedChatId === chat.id}
											on:select={() => {
												selectedChatId = chat.id;
											}}
											on:unselect={() => {
												selectedChatId = null;
											}}
											on:change={async () => {
												initChatList();
											}}
											on:tag={(e) => {
												const { type, name } = e.detail;
												tagEventHandler(type, name, chat.id);
											}}
										/>
									{/each}
								</div>
							</Folder>
						</div>
					{/if} -->

					<!-- {#if !search && folders}
						<Folders
							{folders}
							on:import={(e) => {
								const { folderId, items } = e.detail;
								importChatHandler(items, false, folderId);
							}}
							on:update={async (e) => {
								initChatList();
							}}
							on:change={async () => {
								initChatList();
							}}
						/>
					{/if} -->

					<div class=" flex-1 flex flex-col overflow-y-auto scrollbar-hidden">
						<div class="pt-2.5">
							{#if $chats}
								{#each $chats as chat, idx}
									{#if idx === 0 || (idx > 0 && chat.time_range !== $chats[idx - 1].time_range)}
										<div
											class="w-full pl-2.5 text-xs text-gray-500 dark:text-gray-500 font-medium {idx ===
											0
												? ''
												: 'pt-5'} pb-1.5"
										>
											{$i18n.t(chat.time_range)}
											<!-- localisation keys for time_range to be recognized from the i18next parser (so they don't get automatically removed):
								{$i18n.t('Today')}
								{$i18n.t('Yesterday')}
								{$i18n.t('Previous 7 days')}
								{$i18n.t('Previous 30 days')}
								{$i18n.t('January')}
								{$i18n.t('February')}
								{$i18n.t('March')}
								{$i18n.t('April')}
								{$i18n.t('May')}
								{$i18n.t('June')}
								{$i18n.t('July')}
								{$i18n.t('August')}
								{$i18n.t('September')}
								{$i18n.t('October')}
								{$i18n.t('November')}
								{$i18n.t('December')}
								-->
										</div>
									{/if}

									<ChatItem
										className=""
										id={chat.id}
										title={chat.title}
										{shiftKey}
										selected={selectedChatId === chat.id}
										on:select={() => {
											selectedChatId = chat.id;
										}}
										on:unselect={() => {
											selectedChatId = null;
										}}
										on:change={async () => {
											initChatList();
										}}
										on:tag={(e) => {
											const { type, name } = e.detail;
											tagEventHandler(type, name, chat.id);
										}}
									/>
								{/each}

								{#if $scrollPaginationEnabled && !allChatsLoaded}
									<Loader
										on:visible={(e) => {
											if (!chatListLoading) {
												loadMoreChats();
											}
										}}
									>
										<div
											class="w-full flex justify-center py-1 text-xs animate-pulse items-center gap-2"
										>
											<Spinner className=" size-4" />
											<div class=" ">Loading...</div>
										</div>
									</Loader>
								{/if}
							{:else}
								<div class="w-full flex justify-center py-1 text-xs animate-pulse items-center gap-2">
									<Spinner className=" size-4" />
									<div class=" ">Loading...</div>
								</div>
							{/if}
						</div>
					</div>
				</Folder>
			</div>
		<!-- {/if} -->
		<!-- admin panel -->
		<!-- <div class="px-2">
			<div class="flex flex-col font-primary">
				{#if $user !== undefined}
					<UserMenu
						role={$user.role}
						on:show={(e) => {
							if (e.detail === 'archived-chat') {
								showArchivedChats.set(true);
							}
						}}
					>
						<button
							class=" flex items-center rounded-xl py-2.5 px-2.5 w-full hover:bg-gray-100 dark:hover:bg-gray-900 transition"
							on:click={() => {
								showDropdown = !showDropdown;
							}}
						>
							<div class=" self-center mr-3">
								<img
									src={$user.profile_image_url}
									class=" max-w-[30px] object-cover rounded-full"
									alt="User profile"
								/>
							</div>
							<div class=" self-center font-medium">{$user.name}</div>
						</button>
					</UserMenu>
				{/if}
			</div>
		</div> -->
		<FloatBtn />
	</div>
</div>

<style>
	.scrollbar-hidden:active::-webkit-scrollbar-thumb,
	.scrollbar-hidden:focus::-webkit-scrollbar-thumb,
	.scrollbar-hidden:hover::-webkit-scrollbar-thumb {
		visibility: visible;
	}
	.scrollbar-hidden::-webkit-scrollbar-thumb {
		visibility: hidden;
	}
</style>