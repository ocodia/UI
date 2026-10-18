// Application-owned delivery simulation. No email is sent and no state is persisted.
(() => {
  const action = document.querySelector('#send-reminder'), retry = document.querySelector('#reminder-retry'), status = document.querySelector('#reminder-status');
  if (!action || !retry || !status) return;
  let generation = 0, timer = null, attempts = 0;
  function prepare() {
    if (document.activeElement === retry) {
      const trigger = document.querySelector('#request-actions');
      (trigger && !trigger.hidden ? trigger : document.querySelector('#invoice-link')).focus();
    }
    const request = ++generation;
    clearTimeout(timer); action.disabled = true; retry.disabled = true;
    status.textContent = 'Preparing a payment reminder for invoice INV-1042…';
    timer = setTimeout(() => {
      if (request !== generation || !status.isConnected || !action.isConnected) return;
      action.disabled = false; retry.disabled = false;
      if (++attempts === 1) {
        status.textContent = 'Reminder delivery failed. Nothing was sent. You can retry below.';
        retry.hidden = false;
      } else {
        status.textContent = 'Reminder retry completed in this demo. No email was sent.';
        if (document.activeElement === retry) {
          const trigger = document.querySelector('#request-actions');
          (trigger && !trigger.hidden ? trigger : document.querySelector('#invoice-link')).focus();
        }
        retry.hidden = true;
      }
    }, 400);
  }
  action.addEventListener('click', prepare); retry.addEventListener('click', prepare);
  action.hidden = false;
  window.addEventListener('pagehide', () => { generation++; clearTimeout(timer); }, { once: true });
})();
