import { DEFAULT_SETTINGS, STORAGE_KEYS, TimerData, TimerState } from '../shared/types';

const ALARM_NAME = 'focusForgeAlarm';

// --- State Management ---

async function getTimerData(): Promise<TimerData> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.TIMER_DATA);
  return data[STORAGE_KEYS.TIMER_DATA] || { state: 'IDLE', endTime: 0 };
}

async function setTimerData(data: TimerData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TIMER_DATA]: data });
  // Broadcast the state change to all parts of the extension
  const message = { type: 'TIMER_UPDATED', data };
  // Send to popup and options page
  chrome.runtime.sendMessage(message);
  // Send to all content scripts in active tabs
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        // This can happen if the content script is not injected in that tab
        // console.log(`Could not send message to tab ${tab.id}:`, e);
      }
    }
  }
}

// --- Timer Logic ---

async function startTimer(state: TimerState) {
  await chrome.alarms.clear(ALARM_NAME);
  const settings = (await chrome.storage.local.get(STORAGE_KEYS.SETTINGS))[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
  const duration = state === 'FOCUSING' ? settings.focusDuration : settings.breakDuration;
  
  const endTime = Date.now() + duration * 60 * 1000;
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes: duration });
  await setTimerData({ state, endTime });
}

async function stopTimer() {
  await chrome.alarms.clear(ALARM_NAME);
  await setTimerData({ state: 'IDLE', endTime: 0 });
}

// --- Event Listeners ---

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    [STORAGE_KEYS.TIMER_DATA]: { state: 'IDLE', endTime: 0 },
    [STORAGE_KEYS.CYCLE_COUNT]: 0
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { state } = await getTimerData();
    if (state === 'FOCUSING') {
      // 1. Inject fireworks into the active tab first
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id && activeTab.url && !activeTab.url.startsWith('chrome://')) {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['fireworks-script.js'],
          });
        }
      } catch (e) {
        console.error('Failed to inject fireworks script:', e);
      }

      // 2. Decide whether to show BSOD or Rest Overlay, and set the next state
      const settings = (await chrome.storage.local.get(STORAGE_KEYS.SETTINGS))[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
      const cycleData = await chrome.storage.local.get(STORAGE_KEYS.CYCLE_COUNT);
      const newCycleCount = (cycleData[STORAGE_KEYS.CYCLE_COUNT] || 0) + 1;
      const allTabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });

      if (newCycleCount >= settings.blueScreenCycles) {
        await chrome.storage.local.set({ [STORAGE_KEYS.CYCLE_COUNT]: 0 });
        await setTimerData({ state: 'BSOD', endTime: 0 }); // Set BSOD state
        for (const tab of allTabs) {
          if (tab.id) {
            await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['assets/blue-screen.css'] });
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['blue-screen-script.js'] });
          }
        }
      } else {
        await chrome.storage.local.set({ [STORAGE_KEYS.CYCLE_COUNT]: newCycleCount });
        await startTimer('BREAKING'); // Set BREAKING state and start break timer
        for (const tab of allTabs) {
          if (tab.id) {
            await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['assets/overlay.css'] });
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] });
          }
        }
      }
    } else if (state === 'BREAKING') {
      await stopTimer();
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'START_TIMER') {
    startTimer('FOCUSING').then(() => sendResponse({ success: true }));
    return true;
  } else if (message.command === 'STOP_TIMER') {
    stopTimer().then(() => sendResponse({ success: true }));
    return true;
  } else if (message.command === 'GET_TIMER_DATA') {
    getTimerData().then(data => sendResponse(data));
    return true;
  }
});
