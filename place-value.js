// The place-value selector joins the existing long-operation controls on 12 February 2027.
(() => {
  const PLACE_VALUE_RELEASE = new Date(2027, 1, 12, 0, 0, 0, 0);
  let originalSetMode;

  function updatePlaceValueAvailability() {
    const picker = document.getElementById('place-value-level');
    const status = document.getElementById('place-value-release-status');
    if (!picker || !status) return;

    const remaining = PLACE_VALUE_RELEASE.getTime() - Date.now();
    if (remaining <= 0) {
      picker.disabled = false;
      status.textContent = 'Available now! Choose a level, then select +, −, ×, or ÷.';
      if (originalSetMode && window.setMode !== originalSetMode) return;
      if (typeof window.setMode === 'function' && !window.setMode.__placeValueWrapped) {
        originalSetMode = window.setMode;
        const setModeWithPlaceValue = function (mode) {
          const operation = String(mode).match(/^(add|sub|mult|div)/);
          const level = picker.value;
          return originalSetMode(operation ? `${operation[1]}${level}` : mode);
        };
        setModeWithPlaceValue.__placeValueWrapped = true;
        window.setMode = setModeWithPlaceValue;
      }
      return;
    }

    picker.disabled = true;
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    status.textContent = `Place value unlocks 12 February 2027 — ${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  function setupPlaceValueRelease() {
    const picker = document.getElementById('place-value-level');
    if (!picker) return;

    picker.disabled = true;
    picker.addEventListener('change', () => {
      if (Date.now() < PLACE_VALUE_RELEASE.getTime() || typeof window.setMode !== 'function') return;
      const operation = String(window.currentMode || 'add').match(/^(add|sub|mult|div)/);
      if (operation) window.setMode(`${operation[1]}${picker.value}`);
    });
    updatePlaceValueAvailability();
    window.setInterval(updatePlaceValueAvailability, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPlaceValueRelease, { once: true });
  } else {
    setupPlaceValueRelease();
  }
})();
