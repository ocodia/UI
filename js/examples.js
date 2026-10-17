// Optional demo behavior. UI's stylesheet does not depend on this file.
const theme = document.querySelector('#theme');
if (theme) {
  document.querySelector('#theme-control').hidden = false;
  theme.addEventListener('change', () => {
    if (theme.value === 'auto') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme.value;
    }
  });
}

const dialog = document.querySelector('#example-dialog');
const opener = document.querySelector('#open-dialog');
if (dialog && opener && typeof dialog.showModal === 'function') {
  opener.hidden = false;
  opener.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => opener.focus());
}

const validationForm = document.querySelector('#state-email')?.form;
if (validationForm) {
  validationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    validationForm.querySelector('output').textContent = 'This address passes browser validation. Nothing was sent.';
  });
  validationForm.addEventListener('input', () => {
    validationForm.querySelector('output').textContent = '';
  });
}

const accessibleForm = document.querySelector('#accessible-example');
if (accessibleForm) {
  accessibleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    accessibleForm.querySelector('output').textContent = 'The project name is complete. Nothing was sent.';
  });
  accessibleForm.addEventListener('input', () => { accessibleForm.querySelector('output').textContent = ''; });
}
