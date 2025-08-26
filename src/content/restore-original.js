// This script restores the original state of the page by removing any modifications made during the BREAKING state.

(() => {
  const overlayId = 'focus-forge-overlay';
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.remove();
  }
})();
