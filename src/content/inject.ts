(() => {
  const overlayId = 'focus-forge-overlay';
  if (document.getElementById(overlayId)) return;

  let timerInterval: number | null = null;

  // --- DOM Creation ---
  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.className = 'ff-overlay';

  const content = document.createElement('div');
  content.className = 'ff-content';

  const h1 = document.createElement('h1');
  h1.textContent = 'Time for a break!';
  const p = document.createElement('p');
  p.textContent = 'To unlock, please use the Focus Forge popup.';

  // Timer container
  const timerContainer = document.createElement('div');
  timerContainer.className = 'ff-timer-container';
  const halo = document.createElement('div');
  halo.className = 'ff-breathing-halo';
  const timerText = document.createElement('div');
  timerText.className = 'ff-timer-text';
  timerText.textContent = '--:--';
  timerContainer.appendChild(halo);
  timerContainer.appendChild(timerText);

  // Pixel bar container
  const pixelBarContainer = document.createElement('div');
  pixelBarContainer.className = 'ff-pixel-bar-container';
  const PIXEL_COUNT = 30;
  for (let i = 0; i < PIXEL_COUNT; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'ff-pixel';
    pixelBarContainer.appendChild(pixel);
  }

  content.appendChild(h1);
  content.appendChild(timerContainer);
  content.appendChild(pixelBarContainer);
  content.appendChild(p);
  overlay.appendChild(content);

  // --- Timer Logic ---
  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const updateTimerDisplay = (endTime: number, totalDuration: number) => {
    const remainingMs = endTime - Date.now();
    timerText.textContent = formatTime(remainingMs);

    const elapsedMs = totalDuration - remainingMs;
    const progress = Math.min(elapsedMs / totalDuration, 1);
    const pixelsToFill = Math.floor(progress * PIXEL_COUNT);
    
    const pixels = pixelBarContainer.children;
    for (let i = 0; i < pixels.length; i++) {
      pixels[i].classList.toggle('filled', i < pixelsToFill);
    }

    if (remainingMs <= 0) {
      if (timerInterval) clearInterval(timerInterval);
    }
  };

  // --- Main Execution ---
  document.body.appendChild(overlay);

  // Get initial timer data and start the countdown
  chrome.runtime.sendMessage({ command: 'GET_TIMER_DATA' }, (response) => {
    if (response && response.state === 'BREAKING') {
      chrome.storage.local.get('settings', ({ settings }) => {
        const totalDuration = (settings.breakDuration || 5) * 60 * 1000;
        updateTimerDisplay(response.endTime, totalDuration);
        timerInterval = window.setInterval(() => updateTimerDisplay(response.endTime, totalDuration), 1000);
      });
    }
  });

  // Listen for message to remove overlay
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TIMER_UPDATED' && message.data.state === 'IDLE') {
      if (timerInterval) clearInterval(timerInterval);
      const el = document.getElementById(overlayId);
      if (el) el.remove();
    }
  });
})();
