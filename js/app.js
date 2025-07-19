// js/app.js  — auto‑discovers restaurant files listed in data/index.json
(async () => {
  const dataFolder = 'data/';

  /* 1. Fetch the master index --------------------------------------- */
  let fileList = [];
  try {
    fileList = await fetch(`${dataFolder}index.json`)
      .then(r => {
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

  let currentRestaurant = null;  // track which one is rendered

  /* 4. Render helpers ------------------------------------------------ */
  function showSuggestions(list) {
    suggestions.innerHTML = list.length
      ? list.map(r => `<div class="suggestion-item" data-id="${r.id}">${r.name}</div>`).join('')
      : '<div class="suggestion-item">No results found</div>';
  }

  function renderMenu(restaurant, filter = '') {
    // only include those items whose ingredients contain the filter text
    const items = filter
      ? restaurant.menu.filter(item =>
          item.ingredients.some(ing =>
            ing.toLowerCase().includes(filter)
          )
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
            ${item.description
              ? `<p>${item.description}</p>`
              : ``}
            <p class="ingredients">
              <strong>Ingredients:</strong>
              ${item.ingredients.length
                ? `<ul>${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>`
                : `Ingredients to come!`}
            </p>
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
    const matches = restaurantData.filter(r =>
      r.name.toLowerCase().includes(q)
    );
    showSuggestions(matches);
  });

  suggestions.addEventListener('click', e => {
    if (!e.target.matches('.suggestion-item')) return;
    currentRestaurant = restaurantData.find(
      r => r.id === e.target.dataset.id
    );
    searchInput.value = currentRestaurant.name;
    suggestions.innerHTML = '';
    ingredientInput.value = '';
    renderMenu(currentRestaurant);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.toLowerCase().trim();
      const match = restaurantData.find(r =>
        r.name.toLowerCase().includes(q)
      );
      if (match) {
        currentRestaurant = match;
        suggestions.innerHTML = '';
        ingredientInput.value = '';
        renderMenu(currentRestaurant);
      }
    }
  });

  // new: filter displayed items by ingredient
  ingredientInput.addEventListener('input', e => {
    if (!currentRestaurant) return;
    const filter = e.target.value.toLowerCase().trim();
    renderMenu(currentRestaurant, filter);
  });

  // show all suggestions on focus
  searchInput.addEventListener('focus', () =>
    showSuggestions(restaurantData)
  );
})();
