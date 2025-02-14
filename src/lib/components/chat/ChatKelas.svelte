<script lang="ts">
	import { goto } from '$app/navigation';
	import { v4 as uuidv4 } from 'uuid';
	import { onMount } from 'svelte';
    import InputMenu from './MessageInput/InputMenu.svelte';
    import Tooltip from '../common/Tooltip.svelte';

	// const i18n = getContext('i18n');


	// Simplified stores
	let messages = [];
	let prompt = '';
	let loaded = true;
	let autoScroll = true;
	let messagesContainerElement;

    let isRecording = false;
	let mediaRecorder: MediaRecorder;
	let audioChunks: Blob[] = [];
	let audioUrl = '';

	// Message structure
	interface Message {
		id: string;
		content: string;
		sender: string;
		timestamp: number;
        groupId: string;
		isAudio?: boolean;
	}

	onMount(() => {
		// Load any existing messages
		const savedMessages = localStorage.getItem('chatMessages');
		if (savedMessages) {
			messages = JSON.parse(savedMessages);
		}
	});

	const scrollToBottom = () => {
		if (messagesContainerElement) {
			messagesContainerElement.scrollTop = messagesContainerElement.scrollHeight;
		}
	};

	const submitMessage = () => {
		if (prompt.trim() === '') return;

		const newMessage: Message = {
			id: uuidv4(),
			content: prompt.trim(),
			sender: 'user',
			timestamp: Date.now(),
			groupId: groupId // Add group context
		};

		messages = [...messages, newMessage];
		prompt = '';
		localStorage.setItem(getStorageKey(), JSON.stringify(messages));
		setTimeout(scrollToBottom, 50);
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitMessage();
		}
	};

    const screenCaptureHandler = async () => {
		try {
			// Request screen media
			const mediaStream = await navigator.mediaDevices.getDisplayMedia({
				video: { cursor: 'never' },
				audio: false
			});
			// Once the user selects a screen, temporarily create a video element
			const video = document.createElement('video');
			video.srcObject = mediaStream;
			// Ensure the video loads without affecting user experience or tab switching
			await video.play();
			// Set up the canvas to match the video dimensions
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			// Grab a single frame from the video stream using the canvas
			const context = canvas.getContext('2d');
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			// Stop all video tracks (stop screen sharing) after capturing the image
			mediaStream.getTracks().forEach((track) => track.stop());

			// bring back focus to this current tab, so that the user can see the screen capture
			window.focus();

			// Convert the canvas to a Base64 image URL
			const imageUrl = canvas.toDataURL('image/png');
			// Add the captured image to the files array to render it
			files = [...files, { type: 'image', url: imageUrl }];
			// Clean memory: Clear video srcObject
			video.srcObject = null;
		} catch (error) {
			// Handle any errors (e.g., user cancels screen sharing)
			console.error('Error capturing screen:', error);
		}
	};

    let filesInputElement;

    const startVoiceRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);

			mediaRecorder.ondataavailable = (e) => {
				audioChunks.push(e.data);
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				audioUrl = URL.createObjectURL(audioBlob);
				
				// Add audio message to chat
				const newMessage: Message = {
					id: uuidv4(),
					content: audioUrl,
					sender: 'user',
					timestamp: Date.now(),
					isAudio: true // Add this to your Message interface
				};
				
				messages = [...messages, newMessage];
				localStorage.setItem('chatMessages', JSON.stringify(messages));
				audioChunks = [];
			};

			mediaRecorder.start();
			isRecording = true;
		} catch (error) {
			console.error('Error accessing microphone:', error);
			alert('Microphone access is required for voice recording');
		}
	};

	const stopVoiceRecording = () => {
		mediaRecorder.stop();
		isRecording = false;
	};

    export let groupId: string;

	// Modify storage key to be group-specific
	const getStorageKey = () => `chatMessages_${groupId}`;

	// Update onMount to use group-specific storage
	onMount(() => {
		const savedMessages = localStorage.getItem(getStorageKey());
		messages = savedMessages ? JSON.parse(savedMessages) : [];
	});

</script>

<div class="h-screen max-h-[100dvh] w-full max-w-full flex flex-col">
	<!-- Navbar (simplified) -->
	<nav class="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700">
		<div class="flex items-center justify-between">
		</div>
	</nav>

	<!-- Messages Container -->
	<div
		class="flex-1 overflow-auto p-4 space-y-4"
		bind:this={messagesContainerElement}
	>
		{#each messages.filter(m => m.groupId === groupId) as message}
        <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[70%] rounded-lg p-3 {
                message.sender === 'user' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }">
                {#if message.isAudio}
                    <audio controls class="mt-2">
                        <source src={message.content} type="audio/wav" />
                        Your browser does not support audio playback
                    </audio>
                {:else}
                    <p class="break-words">{message.content}</p>
                {/if}
                <div class="text-xs mt-1 {message.sender === 'user' ? 'text-gray-100' : 'text-gray-500'}">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
		{/each}
	</div>

	<!-- Input Area -->
	<div class="border-t dark:border-gray-700 p-4">
        <div class="flex gap-2 items-center">
            <!-- File button -->
            <InputMenu
                {screenCaptureHandler}
                uploadFilesHandler={() => filesInputElement.click()}
                onClose={async () => document.getElementById('chat-input')?.focus()}
            >
                <button
                    class="bg-transparent hover:bg-white/80 text-gray-800 dark:text-white dark:hover:bg-gray-800 transition rounded-full p-2"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                </button>
            </InputMenu>
    
            <!-- Chat input -->
            <textarea
                class="flex-1 p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800"
                rows="1"
                bind:value={prompt}
                on:keydown={handleKeyPress}
                placeholder="Mulai Chat Kelas"
            />
    
            <!-- Right-side buttons container -->
            <div class="flex items-center gap-2">
                <!-- Voice recording button -->
                <Tooltip content={isRecording ? "Stop Recording" : "Start Recording"}>
                    <button
                        class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition rounded-full p-2"
                        type="button"
                        on:click={isRecording ? stopVoiceRecording : startVoiceRecording}
                    >
                        {#if isRecording}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-red-500">
                                <path fill-rule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clip-rule="evenodd" />
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                            </svg>
                        {/if}
                    </button>
                </Tooltip>
    
                <!-- Send button -->
                <!-- <button
                    on:click={submitMessage}
                    class="px-4 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Send
                </button> -->
            </div>
        </div>
    </div>
</div>

<style>
	/* Keep existing styles */
	textarea {
		resize: none;
		overflow-y: hidden;
	}
	
	/* Add any additional styling needed */
</style>