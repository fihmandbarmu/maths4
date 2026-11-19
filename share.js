(() => {
  const button = document.getElementById('share-button');
  const status = document.getElementById('share-status');
  if (!button || !status) return;

  const shareUrl = () => window.location.href;

  async function copyUrl() {
    const url = shareUrl();
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return;
    }

    // Clipboard API is unavailable on some browsers and non-secure origins.
    const temporaryInput = document.createElement('textarea');
    temporaryInput.value = url;
    temporaryInput.setAttribute('readonly', '');
    temporaryInput.style.position = 'fixed';
    temporaryInput.style.opacity = '0';
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    const copied = document.execCommand('copy');
    temporaryInput.remove();
    if (!copied) throw new Error('Copy command was not available');
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = '';
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: document.title.trim(),
            text: 'Try Meowadd! 🐱',
            url: shareUrl()
          });
          status.textContent = 'Thanks for sharing!';
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') return;
          // If native sharing is unavailable or fails, try copying the link.
        }
      }

      await copyUrl();
      status.textContent = 'Link copied to clipboard!';
    } catch (error) {
      status.textContent = 'Sharing is unavailable. Copy the page address from your browser.';
    } finally {
      button.disabled = false;
    }
  });
})();
