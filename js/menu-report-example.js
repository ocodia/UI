// Application-owned, in-memory archive and undo for the documentation report card.
(() => {
  const archive = document.querySelector('#archive-report'), undo = document.querySelector('#undo-archive');
  const state = document.querySelector('#report-state'), feedback = document.querySelector('#report-feedback');
  if (!archive || !undo || !state || !feedback) return;
  const draftState = state.textContent;
  archive.addEventListener('click', () => {
    archive.disabled = true;
    state.textContent = 'Archived';
    feedback.textContent = 'October shoreline survey archived for this visit. You can undo this below.';
    undo.hidden = false;
  });
  undo.addEventListener('click', () => {
    archive.disabled = false;
    state.textContent = draftState;
    feedback.textContent = 'October shoreline survey restored to drafts.';
    if (document.activeElement === undo) {
      const trigger = document.querySelector('#report-actions');
      (trigger && !trigger.hidden ? trigger : document.querySelector('#after-menu')).focus();
    }
    undo.hidden = true;
  });
  archive.hidden = false;
})();
