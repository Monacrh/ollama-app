<script lang="ts">
    import { chatId } from '$lib/stores';
    import { getContext } from 'svelte';
    const i18n = getContext('i18n'); 
</script>
  
  {#if !$chatId}
    <div class="welcome-screen flex flex-col items-center justify-center h-full text-center px-4">
      <div class="max-w-2xl space-y-6">
        <!-- Animated Logo -->
        <div class="animate-float">
          <svg class="w-32 h-32 mx-auto text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </div>
  
        <!-- Welcome Text -->
        <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-500 to-blue-500 bg-clip-text text-transparent">
          {$i18n.t('welcome.title')}
        </h1>
        
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          {$i18n.t('welcome.subtitle')}
        </p>
  
        <!-- Action Buttons -->
        <div class="flex gap-4 justify-center">
          <button
            class="btn btn-primary"
            on:click={() => document.getElementById('new-chat-button')?.click()}
          >
            {$i18n.t('welcome.new_chat')}
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    .animate-float {
      animation: float 3s ease-in-out infinite;
    }
  
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
  
    .welcome-screen {
      animation: fadeIn 0.5s ease-out;
    }
  
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>