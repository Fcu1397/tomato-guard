<template>
  <div class="timer-display">{{ formattedTime }}</div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import type { TimerState } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/types';

const props = defineProps({
  endTime: {
    type: Number,
    required: true,
  },
  state: {
    type: String as PropType<TimerState>,
    required: true,
  },
});

const formattedTime = ref('--:--');
let intervalId: number | null = null;

const formatTime = (ms: number) => {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const updateDisplay = () => {
  const remaining = props.endTime - Date.now();
  formattedTime.value = formatTime(remaining);
};

watch(() => [props.endTime, props.state], () => {
  if (intervalId) clearInterval(intervalId);

  if (props.state === 'IDLE') {
    // In idle, show the default focus duration
    formattedTime.value = formatTime(DEFAULT_SETTINGS.focusDuration * 60 * 1000);
  } else {
    updateDisplay();
    intervalId = window.setInterval(updateDisplay, 1000);
  }
}, { immediate: true });

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

</script>

<style scoped>
.timer-display {
  font-size: 6rem;
  font-weight: 300;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
}
</style>
