// app.js
// Auto‑discovers restaurant files listed in data/index.json
(async () => {
  const dataFolder    = 'data/';
  const indexUrl      = `${dataFolder}index.json`;
  let restaurantFiles = [];

  // 1. Load master index
  try {
    restaurantFiles = await fetch(indexUrl)
      .then(r => r.ok ? r.json() : Promise.reject('index.json not found'));
  } catch (err) {
    console.error('Could not load data/index.json:', err);
    return;
  }

  // 2. Fetch all restaurant data
  const restaurantData = await Promise.all(
    restaurantFiles.map(fn =>
      fetch(dataFolder + fn).then(r => r.ok ? r.json() : Promise.reject(fn))
    )
  );

  // 3. Grab DOM elements
  const searchInput     = document.getElementById('restaurantSearch');
  const nameInput       = document.getElementById('itemSearch');
  const ingredientInput = document.getElementById('ingredientSearch');
  const suggestions     = document.getElementById('suggestions');
  const menuContainer   = document.getElementById('menuContainer');
  const expandBtn       = document.getElementById('expandAll');
  const collapseBtn     = document.getElementById('collapseAll');
  const themeToggle     = document.getElementById('themeToggle');
  const root            = document.documentElement;

  let currentRestaurant = null;

  // Utility: clear active suggestion
  function clearActive() {
    suggestions.querySelectorAll('.suggestion-item')
      .forEach(el => el.classList.remove('active'));
  }

  // Show list of matching restaurants
  function showSuggestions(list) {
    suggestions.innerHTML = list
      .map(r => `<div class="suggestion-item" data-id="${r.id}">${r.name}</div>`)
      .join('');
  }

  // Render the menu items according to current filters
  function renderMenu() {
    if (!currentRestaurant) {
      menuContainer.innerHTML = '';
      return;
    }
    const nameQ = nameInput.value.trim().toLowerCase();
    const ingQ  = ingredientInput.value.trim().toLowerCase();

    // Build HTML
    menuContainer.innerHTML = currentRestaurant.menu
      .map((item, idx) => {
        const itemName = item.name.toLowerCase();
        const ingText  = item.ingredients.join(' ').toLowerCase();
        // filter by name & ingredient queries
        if (
          (nameQ === '' || itemName.includes(nameQ)) &&
          (ingQ  === '' || ingText.includes(ingQ))
        ) {
          return `
            <div class="menu-item">
              <div class="item-header">
                <h3 class="item-name">${item.name}</h3>
                <button class="toggle-btn" data-idx="${idx}">Ingredients</button>
              </div>
              <div class="ingredients-content" data-idx="${idx}" style="display:none;">
                <ul>
                  ${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
              </div>
            </div>
          `;
        } else {
          return '';
        }
      })
      .join('');
  }

  // 4. Event: select a restaurant
  suggestions.addEventListener('click', e => {
    if (!e.target.classList.contains('suggestion-item')) return;
    clearActive();
    e.target.classList.add('active');
    currentRestaurant = restaurantData.find(r => r.id === e.target.dataset.id);
    searchInput.value     = currentRestaurant.name;
    nameInput.value       = '';
    ingredientInput.value = '';
    suggestions.innerHTML = '';
    renderMenu();
  });

  // 5. Search input → show matching restaurants
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q === '') {
      suggestions.innerHTML = '';
      return;
    }
    const matches = restaurantData.filter(r =>
      r.name.toLowerCase().includes(q)
    );
    showSuggestions(matches);
  });

  // 6. Re‑render when item‑name or ingredient inputs change
  nameInput.addEventListener('input', renderMenu);
  ingredientInput.addEventListener('input', renderMenu);

  // 7. Expand/Collapse all
  expandBtn.addEventListener('click', () => {
    menuContainer.querySelectorAll('.ingredients-content')
      .forEach(c => c.style.display = 'block');
  });
  collapseBtn.addEventListener('click', () => {
    menuContainer.querySelectorAll('.ingredients-content')
      .forEach(c => c.style.display = 'none');
  });

  // 8. Toggle individual ingredient lists
  menuContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('toggle-btn')) return;
    const idx = e.target.dataset.idx;
    const content = menuContainer.querySelector(
      `.ingredients-content[data-idx="${idx}"]`
    );
    content.style.display = (content.style.display === 'none' || !content.style.display)
      ? 'block'
      : 'none';
  });

  // 9. Theme toggle
  const savedTheme = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
})();
