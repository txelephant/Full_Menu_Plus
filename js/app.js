// js/app.js
;(() => {
  // wrap in an async function so we can await fetches
  async function init() {
    const dataFolder     = 'data/';
    const indexUrl       = `${dataFolder}index.json`;
    const restaurantInput = document.getElementById('restaurantSearch');
    const nameInput       = document.getElementById('itemSearch');
    const ingInput        = document.getElementById('ingredientSearch');
    const menuContainer   = document.getElementById('menuContainer');
    const expandBtn       = document.getElementById('expandAll');
    const collapseBtn     = document.getElementById('collapseAll');
    const themeToggle     = document.getElementById('themeToggle');
    const root            = document.documentElement;

    // 1) Load list of JSON filenames
    let files = [];
    try {
      const res = await fetch(indexUrl);
      if (!res.ok) throw new Error('Could not load index.json');
      files = await res.json();
    } catch (err) {
      console.error(err);
      menuContainer.innerHTML = '<p style="color:red;">Error loading menu index.</p>';
      return;
    }

    // 2) Fetch all restaurant data
    let restaurants = [];
    try {
      restaurants = await Promise.all(
        files.map(fn =>
          fetch(dataFolder + fn).then(r => {
            if (!r.ok) throw new Error(`Failed to load ${fn}`);
            return r.json();
          })
        )
      );
    } catch (err) {
      console.error(err);
      menuContainer.innerHTML = '<p style="color:red;">Error loading restaurant data.</p>';
      return;
    }

    // 3) Render function
    function renderMenu() {
      const rq = restaurantInput.value.trim().toLowerCase();
      const nq = nameInput      .value.trim().toLowerCase();
      const iq = ingInput       .value.trim().toLowerCase();

      // build HTML for each restaurant + its filtered items
      const html = restaurants.map(r => {
        // filter by restaurant name
        if (rq && !r.name.toLowerCase().includes(rq)) return '';

        // filter menu items
        const items = r.menu.filter(item => {
          const inName = !nq || item.name.toLowerCase().includes(nq);
          const inIng  = !iq || item.ingredients.join(' ').toLowerCase().includes(iq);
          return inName && inIng;
        });

        if (!items.length) return '';

        // build each item markup
        const itemsHTML = items.map((item, idx) => {
          const uniqueId = `${r.id}-${idx}`;
          return `
            <div class="menu-item">
              <div class="item-header">
                <h3 class="item-name">${item.name}</h3>
                <button class="toggle-btn" data-id="${uniqueId}">
                  Ingredients
                </button>
              </div>
              <div
                class="ingredients-content"
                id="ing-${uniqueId}"
                style="display:none"
              >
                <ul>
                  ${item.ingredients.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            </div>
          `;
        }).join('');

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

    // 4) Wire up live filtering on all three inputs
    [restaurantInput, nameInput, ingInput].forEach(inp =>
      inp.addEventListener('input', renderMenu)
    );

    // 5) Expand / collapse all
    expandBtn.addEventListener('click', () =>
      document.querySelectorAll('.ingredients-content')
        .forEach(el => el.style.display = 'block')
    );
    collapseBtn.addEventListener('click', () =>
      document.querySelectorAll('.ingredients-content')
        .forEach(el => el.style.display = 'none')
    );

    // 6) Toggle single ingredient section
    menuContainer.addEventListener('click', e => {
      if (!e.target.classList.contains('toggle-btn')) return;
      const id  = e.target.dataset.id;
      const box = document.getElementById(`ing-${id}`);
      box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    });

    // 7) Theme toggle
    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = (savedTheme === 'light') ? '🌙' : '☀️';
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = (next === 'light') ? '🌙' : '☀️';
    });

    // 8) Initial render
    renderMenu();
  }

  // start the app
  document.addEventListener('DOMContentLoaded', init);
})();
