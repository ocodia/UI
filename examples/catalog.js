// Optional explorer behavior. The complete catalogue stays readable without it.
(() => {
  const form = document.querySelector('#catalog-filter');
  const items = [...document.querySelectorAll('[data-component]')];
  function filter() {
    const query = document.querySelector('#query').value.trim().toLocaleLowerCase();
    const category = document.querySelector('#category').value;
    const status = document.querySelector('#status').value;
    let count = 0;
    for (const item of items) {
      item.hidden = !(item.textContent.toLocaleLowerCase().includes(query) && (!category || item.dataset.category === category) && (!status || item.dataset.status === status));
      if (!item.hidden) count++;
    }
    document.querySelector('#catalog-count').textContent = `${count} of ${items.length} components shown.`;
    document.querySelector('#catalog-empty').hidden = count > 0;
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('reset', () => queueMicrotask(filter));
  form.hidden = false;
})();
