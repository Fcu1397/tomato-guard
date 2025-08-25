(() => {
  const overlayId = 'focus-forge-bsod-overlay';
  if (document.getElementById(overlayId)) return;

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.className = 'ff-bsod-overlay';

  overlay.innerHTML = `
    <div class="ff-bsod-content">
        <h1>:(</h1>
        <p>Your PC ran into a problem that it couldn't handle, and now it needs to restart.</p>
        <p>Please open the Focus Forge popup to restore your session.</p>
        <div class="ff-bsod-details">
            <p>If you call a support person, give them this info:<br>
            Stop code: 0x000000F1 (0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000)</p>
        </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Listen for message to remove overlay
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TIMER_UPDATED' && message.data.state === 'IDLE') {
      const el = document.getElementById(overlayId);
      if (el) el.remove();
    }
  });
})();
