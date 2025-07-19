// app.js
;(async () => {
  const dataFolder = 'data/';
  const indexUrl   = `${dataFolder}index.json`;

  // 1) load list of filenames
  let files = [];
  try {
    files = await fetch(indexUrl).then(r => {
      if (!r.ok) throw new Error('index.json not found');
      return r.json();
    });
  } catch (e) {
    console.error(e);
    return;
  }

  // 2) fetch each restaurant’s full JSON
  const restaurants = await Promise.all(
    files.map(f =>
      fetch(dataFolder + f).then(r => r.ok ? r.json() : Promise.reject(f))
    )
  );

  // 3) grab DOM refs
  const restaurantInput = document.getElementById('restaurantSearch');
  const nameInput       = document.getElementById('itemSearch');
  const ingInput        = document.getElementById('ingredientSearch');
  const menuContainer   = document.getElementById('menuContainer');
  const expandBtn       = document.getElementById('expandAll');
  const collapseBtn     = document.getElementById('collapseAll');
  const themeToggle     = document.getElementById('themeToggle');
  const root            = document.documentElement;

  // 4) renderMenu: loops all restaurants → items → filters
  function renderMenu() {
    const rq = restaurantInput.value.trim().toLowerCase();
    const nq = nameInput      .value.trim().toLowerCase();
    const iq = ingInput       .value.trim().toLowerCase();

    // build HTML
    const html = restaurants.map(r => {
      if (rq && !r.name.toLowerCase().includes(rq)) return '';
      // filter items
      const items = r.menu.filter(item => {
        const inName = !nq || item.name.toLowerCase().includes(nq);
        const inIng  = !iq || item.ingredients.join(' ').toLowerCase().includes(iq);
        return inName && inIng;
      });

      if (!items.length) return '';
      // map each item to markup
      const itemsHTML = items.map((item, idx) => `
        <div class="menu-item">
          <div class="item-header">
            <h3 class="item-name">${item.name}</h3>
            <button class="toggle-btn" data-id="${r.id}-${idx}">Ingredients</button>
          </div>
          <div
            class="ingredients-content"
            id="ing-${r.id}-${idx}"
            style="display:none"
          >
            <ul>
              ${item.ingredients.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('');

      // wrap in a restaurant section
      return `
        <section class="restaurant">
          <h2>${r.name}</h2>
          ${itemsHTML}
        </section>
      `;
    }).join('');

    menuContainer.innerHTML = html || '<p>No matching items found.</p>';
  }

  // 5) wire up all three filters
  [restaurantInput, nameInput, ingInput].forEach(inp =>
    inp.addEventListener('input', renderMenu)
  );

  // 6) expand / collapse
  expandBtn.addEventListener('click', () =>
    document.querySelectorAll('.ingredients-content')
      .forEach(el => el.style.display = 'block')
  );
  collapseBtn.addEventListener('click', () =>
    document.querySelectorAll('.ingredients-content')
      .forEach(el => el.style.display = 'none')
  );

  // 7) individual toggle
  menuContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('toggle-btn')) return;
    const id = e.target.dataset.id;
    const box = document.getElementById(`ing-${id}`);
    box.style.display = (box.style.display === 'none') ? 'block' : 'none';
  });

  // 8) theme switch
  const saved = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', saved);
  themeToggle.textContent = (saved === 'light') ? '🌙' : '☀️';
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = (next === 'light') ? '🌙' : '☀️';
  });

  // 9) initial paint
  renderMenu();
})();
