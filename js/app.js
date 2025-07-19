// js/app.js  (no photos, no prices)
(async () => {
  const dataFolder = 'data/';

  const fileList = [
    'la-terraza.json'
  ];

  // 1. Load JSON files
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
    console.error('Data load error:', err);
    return;
  }

  // 2. DOM refs
  const searchInput   = document.getElementById('restaurantSearch');
  const suggestions   = document.getElementById('suggestions');
  const menuContainer = document.getElementById('menuContainer');

  // 3. Render helpers
  function showSuggestions(list) {
    suggestions.innerHTML = list.length
      ? list.map(r => `<div class="suggestion-item" data-id="${r.id}">${r.name}</div>`).join('')
      : '<div class="suggestion-item">No results found</div>';
  }

  function renderMenu(restaurant) {
    menuContainer.innerHTML = `
      <div class="restaurant-card">
        <h3>${restaurant.name}</h3>
      </div>
      ${restaurant.menu.map(item => `
        <div class="restaurant-card">
          <div class="menu-item">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="ingredients"><strong>Ingredients:</strong> ${item.ingredients.join(', ')}</p>
          </div>
        </div>
      `).join('')}
    `;
  }

  // 4. Events
  searchInput.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { suggestions.innerHTML = ''; menuContainer.innerHTML = ''; return; }
    const matches = restaurantData.filter(r => r.name.toLowerCase().includes(q));
    showSuggestions(matches);
  });

  suggestions.addEventListener('click', e => {
    if (e.target.matches('.suggestion-item')) {
      const rest = restaurantData.find(r => r.id === e.target.dataset.id);
      searchInput.value = rest.name;
      suggestions.innerHTML = '';
      renderMenu(rest);
    }
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.toLowerCase().trim();
      const match = restaurantData.find(r => r.name.toLowerCase().includes(q));
      if (match) { suggestions.innerHTML = ''; renderMenu(match); }
    }
  });

  searchInput.addEventListener('focus', () => showSuggestions(restaurantData));
})();
