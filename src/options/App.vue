<template>
  <div class="options-container">
    <h1>Focus Forge Settings</h1>

    <form ref="formRef">
      <section>
        <h2>Timer Durations (minutes)</h2>
        <div class="form-group">
          <label for="focusDuration">Focus Duration</label>
          <input id="focusDuration" type="number" v-model.number="localSettings.focusDuration" min="1">
        </div>
        <div class="form-group">
          <label for="breakDuration">Break Duration</label>
          <input id="breakDuration" type="number" v-model.number="localSettings.breakDuration" min="1">
        </div>
      </section>

      <section>
        <h2>Security</h2>
        <div class="form-group">
          <label for="password">Password (to end breaks early)</label>
          <input id="password" type="password" v-model="newPassword" placeholder="Leave blank to not change">
        </div>
        <p class="form-hint">Password is stored securely using PBKDF2 hashing. We never store your raw password.</p>
      </section>

      <section>
        <h2>Destruction Mode</h2>
        <div class="form-group">
          <label for="blueScreenCycles">Fake Blue Screen after N cycles</label>
          <input id="blueScreenCycles" type="number" v-model.number="localSettings.blueScreenCycles" min="1">
        </div>
      </section>

      <button type="submit" class="btn-save">Save Settings</button>
      <p v-if="saveStatus" class="save-status">{{ saveStatus }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/shared/types';
import type { Settings } from '@/shared/types';

// Use reactive for the settings object to ensure deep reactivity
const localSettings = reactive<Settings>({ ...DEFAULT_SETTINGS });
const newPassword = ref('');
const saveStatus = ref('');

// Template refs for robust event handling
const formRef = ref<HTMLFormElement | null>(null);
const debugBtnRef = ref<HTMLButtonElement | null>(null);

// --- Crypto Helpers for Password Hashing ---
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

// --- Settings Logic ---
const saveSettings = async () => {
  try {
    // Create a plain object from the reactive one for saving
    const settingsToSave: Settings = { ...localSettings };

    if (newPassword.value) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey('raw', str2ab(newPassword.value), { name: 'PBKDF2' }, false, ['deriveBits']);
      const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
      settingsToSave.passwordHash = ab2hex(derivedBits);
      settingsToSave.salt = ab2hex(salt);
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settingsToSave });
    newPassword.value = '';
    saveStatus.value = 'Settings saved successfully!';
  } catch (error) {
    console.error('Error saving settings:', error);
    saveStatus.value = 'Error: Could not save settings.';
  }
  setTimeout(() => { saveStatus.value = '' }, 3000);
};

const debugStorage = () => {
  chrome.storage.local.get(null, (items) => {
    console.log('[Focus Forge Debug] All items in chrome.storage.local:');
    console.log(JSON.parse(JSON.stringify(items)));
  });
};

onMounted(async () => {
  // Load initial settings
  const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (data[STORAGE_KEYS.SETTINGS]) {
    Object.assign(localSettings, data[STORAGE_KEYS.SETTINGS]);
  }

  // Attach event listeners robustly
  if (formRef.value) {
    formRef.value.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
  }

  if (debugBtnRef.value) {
    debugBtnRef.value.addEventListener('click', debugStorage);
  }
});

</script>

<style scoped>
.options-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px 40px;
  background-color: #282c34;
  color: #f0f0f0;
  border-radius: 8px;
  font-family: sans-serif;
}

h1 {
  color: #42b883;
  text-align: center;
  margin-bottom: 30px;
}

section {
  margin-bottom: 30px;
  border-top: 1px solid #444;
  padding-top: 20px;
}

h2 {
  font-size: 18px;
  color: #f0f0f0;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #333;
  color: #f0f0f0;
  box-sizing: border-box;
}

.form-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: -10px;
}

.btn-save, .btn-debug {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
}

.btn-save {
  background-color: #42b883;
}
.btn-save:hover {
  background-color: #36a372;
}

.btn-debug {
  background-color: #555;
}
.btn-debug:hover {
  background-color: #666;
}

.save-status {
  text-align: center;
  margin-top: 15px;
  color: #42b883;
}
</style>
