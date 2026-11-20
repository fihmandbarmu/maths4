(() => {
  const button = document.getElementById('share-button');
  const status = document.getElementById('share-status');
  if (!button) return;

  function createComposer() {
    if (document.getElementById('message-composer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'message-composer';
    overlay.className = 'message-composer';
    overlay.innerHTML = `
      <div class="compose-window" role="dialog" aria-modal="true" aria-label="New Message">
        <div class="compose-header">
          <span>New Message</span>
          <button type="button" class="compose-close" aria-label="Close">×</button>
        </div>
        <div class="compose-fields">
          <div class="compose-field"><label for="compose-to">To</label><input id="compose-to" type="email" autocomplete="email"></div>
          <button type="button" class="compose-toggle-recipients">Cc Bcc</button>
          <div class="compose-field compose-extra" hidden><label for="compose-cc">Cc</label><input id="compose-cc" type="email"></div>
          <div class="compose-field compose-extra" hidden><label for="compose-bcc">Bcc</label><input id="compose-bcc" type="email"></div>
          <div class="compose-field"><label for="compose-subject" class="sr-only">Subject</label><input id="compose-subject" type="text" placeholder="Subject"></div>
        </div>
        <div class="compose-toolbar" aria-label="Formatting toolbar">
          <button type="button" data-command="undo" title="Undo">↶</button>
          <button type="button" data-command="redo" title="Redo">↷</button>
          <select class="compose-font" aria-label="Font"><option>Sans Serif</option><option>Arial</option><option>Verdana</option><option>Georgia</option></select>
          <select class="compose-size" aria-label="Font size"><option>Normal</option><option>Small</option><option>Large</option></select>
          <button type="button" data-command="bold"><b>B</b></button>
          <button type="button" data-command="italic"><i>I</i></button>
          <button type="button" data-command="underline"><u>U</u></button>
          <button type="button" data-command="insertUnorderedList" title="Bulleted list">≡</button>
        </div>
        <div id="compose-body" class="compose-body" contenteditable="true" role="textbox" aria-label="Message body"><p>Try Meowadd! 🐱<br>${window.location.href}</p></div>
        <div class="compose-footer">
          <button type="button" class="compose-send">Send</button>
          <button type="button" class="compose-delete" aria-label="Delete">🗑</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.compose-close').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });

    overlay.querySelector('.compose-toggle-recipients').addEventListener('click', () => {
      overlay.querySelectorAll('.compose-extra').forEach(field => { field.hidden = !field.hidden; });
    });

    overlay.querySelectorAll('[data-command]').forEach(item => {
      item.addEventListener('mousedown', event => event.preventEvent?.());
      item.addEventListener('click', () => {
        document.execCommand(item.dataset.command, false, null);
        document.getElementById('compose-body').focus();
      });
    });

    overlay.querySelector('.compose-font').addEventListener('change', event => {
      document.execCommand('fontName', false, event.target.value);
    });
    overlay.querySelector('.compose-size').addEventListener('change', event => {
      document.execCommand('fontSize', false, event.target.value === 'Small' ? '2' : event.target.value === 'Large' ? '5' : '3');
    });

    overlay.querySelector('.compose-send').addEventListener('click', () => {
      const to = overlay.querySelector('#compose-to').value;
      const cc = overlay.querySelector('#compose-cc').value;
      const bcc = overlay.querySelector('#compose-bcc').value;
      const subject = overlay.querySelector('#compose-subject').value || 'Try Meowadd!';
      const body = overlay.querySelector('#compose-body').innerText.trim();
      const params = new URLSearchParams({ subject, body });
      if (cc) params.set('cc', cc);
      if (bcc) params.set('bcc', bcc);
      window.location.href = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
    });

    overlay.querySelector('.compose-delete').addEventListener('click', close);
    overlay.querySelector('#compose-to').focus();
  }

  button.textContent = 'Send Meowadd! 🐱';
  button.addEventListener('click', createComposer);
})();
