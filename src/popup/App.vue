<template>
  <div class="popup-container">
    <!-- Header -->
    <header>
      <h1>Focus Forge</h1>
      <div class="status-chip" :class="timerData.state.toLowerCase()">
        {{ timerData.state }}
      </div>
    </header>

    <!-- Timer View -->
    <main v-if="timerData.state === 'IDLE' || timerData.state === 'FOCUSING'">
      <TimerDisplay :end-time="timerData.endTime" :state="timerData.state" />
      <button v-if="timerData.state === 'IDLE'" @click="startTimer" class="btn-primary">
        Start Focus
      </button>
      <button v-if="timerData.state === 'FOCUSING'" @click="stopTimer" class="btn-secondary">
        Stop & Reset
      </button>
    </main>

    <!-- Unlock View -->
    <main v-if="timerData.state === 'BREAKING' || timerData.state === 'BSOD'">
      <div class="unlock-view">
        <h3>Session Locked</h3>
        <p class="unlock-hint">Enter password to unlock all tabs.</p>
        <input type="password" v-model="passwordInput" placeholder="Password" class="password-input">
        <button @click="verifyPassword" class="btn-primary">Unlock</button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TimerDisplay from './components/TimerDisplay.vue';
import type { TimerData, Settings } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/types';

const timerData = ref<TimerData>({ state: 'IDLE', endTime: 0 });
const passwordInput = ref('');
const errorMessage = ref('');

// --- Crypto Helpers ---
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length * 2);
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function ab2hex(ab: ArrayBuffer): string {
  return Array.from(new Uint8Array(ab)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hex2ab(hex: string): ArrayBuffer {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))).buffer;
}

// --- Timer Commands ---
const startTimer = () => chrome.runtime.sendMessage({ command: 'START_TIMER' });
const stopTimer = () => chrome.runtime.sendMessage({ command: 'STOP_TIMER' });

// --- Password Verification ---
const verifyPassword = async () => {
  errorMessage.value = '';
  if (!passwordInput.value) {
    errorMessage.value = 'Password cannot be empty.';
    return;
  }

  const settingsData = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const settings = settingsData[STORAGE_KEYS.SETTINGS] as Settings;

  if (!settings || !settings.passwordHash || !settings.salt) {
    errorMessage.value = 'Password not set in options.';
    return;
  }

  try {
    const keyMaterial = await crypto.subtle.importKey('raw', str2ab(passwordInput.value), { name: 'PBKDF2' }, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hex2ab(settings.salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const hash = ab2hex(derivedBits);

    if (hash === settings.passwordHash) {
      // On success, send stop command
      stopTimer();
    } else {
      errorMessage.value = 'Incorrect password.';
    }
  } catch (e) {
    errorMessage.value = 'Verification failed.';
    console.error(e);
  }
  passwordInput.value = '';
};

// --- Lifecycle and Listeners ---
onMounted(() => {
  // Get initial state when popup opens
  chrome.runtime.sendMessage({ command: 'GET_TIMER_DATA' }, (response) => {
    timerData.value = response;
  });

  // Listen for real-time updates from the service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TIMER_UPDATED') {
      timerData.value = message.data;
    }
  });
});

</script>

<style scoped>
.popup-container {
  width: 300px;
  padding: 20px;
  background-color: #1e1e1e;
  color: #f0f0f0;
  text-align: center;
  font-family: sans-serif;
}
header h1 { font-size: 24px; color: #42b883; margin: 0 0 10px 0; }
.status-chip { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
.status-chip.idle { background-color: #4a4a4a; }
.status-chip.focusing { background-color: #42b883; }
.status-chip.breaking { background-color: #3498db; }
.status-chip.bsod { background-color: #e74c3c; }

button { border: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; transition: background-color 0.2s ease; margin-top: 10px; }
.btn-primary { background-color: #42b883; color: white; }
.btn-primary:hover { background-color: #36a372; }
.btn-secondary { background-color: #e74c3c; color: white; }
.btn-secondary:hover { background-color: #c0392b; }

.unlock-view h3 { margin-bottom: 5px; }
.unlock-view .unlock-hint { font-size: 12px; color: #aaa; margin-top: 0; margin-bottom: 15px; }
.password-input { width: 100%; padding: 8px; box-sizing: border-box; border-radius: 4px; border: 1px solid #555; background-color: #333; color: #f0f0f0; margin-bottom: 10px; }
.error-message { color: #ffdddd; font-size: 12px; height: 15px; }
</style>
