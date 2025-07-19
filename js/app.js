// js/app.js  — auto‑discovers restaurant files listed in data/index.json
(async () => {
  const dataFolder = 'data/';

  /* 1. Fetch the master index --------------------------------------- */
  let fileList = [];
  try {
    fileList = await fetch(`${dataFolder}index.json`).then(r => {
      if (!r.ok) throw new Error('index.json not found');
      return r.json();
    });
  } catch (err) {
    console.error('Could not load data/index.json:', err);
    return;
  }

  /* 2. Load every restaurant JSON in parallel ----------------------- */
  let restaurantData = [];
  try {
    restaurantData = await Promise.all(
      fileList.map(file =>
        fetch(`${dataFolder}${file}`)
          .then(r => {
            if (!r.ok) throw new Error(`${file} not found`);
            return r.json();
          })
      )
    );
  } catch (err) {
    console.error('Error loading restaurant files:', err);
    return;
  }

  /* 3. DOM refs ------------------------------------------------------ */
  const searchInput      = document.getElementById('restaurantSearch');
  const ingredientInput  = document.getElementById('ingredientSearch');
  const suggestions      = document.getElementById('suggestions');
  const menuContainer    = document.getElementById('menuContainer');
  let currentRestaurant  = null;  // track active restaurant
  let activeIndex        = -1;    // track highlighted suggestion

  /* 4. Render helpers ------------------------------------------------ */
  function showSuggestions(list) {
    suggestions.innerHTML = list.length
      ? list.map((r, i) => `<div class="suggestion-item" data-id="${r.id}" data-index="${i}">${r.name}</div>`).join('')
      : '<div class="suggestion-item">No results found</div>';
  }

  function clearActive() {
    activeIndex = -1;
    suggestions.querySelectorAll('.suggestion-item').forEach(el => el.classList.remove('active'));
  }

  function setActive(idx) {
    clearActive();
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (items.length && idx >= 0 && idx < items.length) {
      items[idx].classList.add('active');
      activeIndex = idx;
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectActive() {
    const item = suggestions.querySelector('.suggestion-item.active');
    if (item) item.click();
  }

  function renderMenu(restaurant, filter = '') {
    currentRestaurant = restaurant;
    const items = filter
      ? restaurant.menu.filter(item =>
          item.ingredients.some(ing => ing.toLowerCase().includes(filter))
        )
      : restaurant.menu;
    menuContainer.innerHTML = `
      <div class="restaurant-card">
        <h3>${restaurant.name}</h3>
      </div>
      ${items.map(item => `
        <div class="restaurant-card">
          <div class="menu-item">
            <h4>${item.name}</h4>
            ${item.description ? `<p>${item.description}</p>` : ``}
            <div class="ingredients">
              <strong>Ingredients:</strong>
              ${item.ingredients.length
                ? `<ul>${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>`
                : `<p class="no-data">Ingredients to come!</p>`}
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  /* 5. Events -------------------------------------------------------- */
  searchInput.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      suggestions.innerHTML = '';
      menuContainer.innerHTML = '';
      currentRestaurant = null;
      return;
    }
    const matches = restaurantData.filter(r => r.name.toLowerCase().includes(q));
    showSuggestions(matches);
    clearActive();
  });

  searchInput.addEventListener('keydown', e => {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((activeIndex + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((activeIndex - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) selectActive();
        break;
    }
  });

  suggestions.addEventListener('click', e => {
    if (!e.target.matches('.suggestion-item')) return;
    const rest = restaurantData.find(r => r.id === e.target.dataset.id);
    searchInput.value = rest.name;
    suggestions.innerHTML = '';
    ingredientInput.value = '';
    renderMenu(rest);
  });

  // ingredient filter
  ingredientInput.addEventListener('input', e => {
    if (!currentRestaurant) return;
    const filter = e.target.value.toLowerCase().trim();
    renderMenu(currentRestaurant, filter);
  });

  // focus shows all
  searchInput.addEventListener('focus', () => {
    showSuggestions(restaurantData);
    clearActive();
  });
})();
