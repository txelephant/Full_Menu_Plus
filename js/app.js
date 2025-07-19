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

  /* 2. Load all restaurant data ------------------------------------- */
  let restaurantData = [];
  try {
    restaurantData = await Promise.all(
      fileList.map(file =>
        fetch(`${dataFolder}${file}`).then(r => r.json())
      )
    );
  } catch (err) {
    console.error('Error loading restaurant data:', err);
  }

  /* 3. UI References ----------------------------------------------- */
  const searchInput = document.getElementById('search-input');
  const suggestions = document.getElementById('suggestions');
  const ingredientInput = document.getElementById('ingredient-input');
  const menuContainer = document.getElementById('menu-container');

  let currentRestaurant = null;

  /* 4. Helper: Render menu items ------------------------------------ */
  const renderMenu = (rest, filter = '') => {
    menuContainer.innerHTML = '';
    if (!rest) return;

    rest.menu
      .filter(item =>
        item.name.toLowerCase().includes(filter) ||
        item.category.toLowerCase().includes(filter)
      )
      .forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
          <h3>${item.name}</h3>
          <p>${item.ingredients.join(', ')}</p>
        `;
        menuContainer.appendChild(div);
      });
  };

  /* 5. Helper: Show search suggestions ------------------------------ */
  const clearActive = () => {
    const items = suggestions.querySelectorAll('li');
    items.forEach(i => i.classList.remove('active'));
  };

  const showSuggestions = data => {
    suggestions.innerHTML = data
      .slice(0, 10)
      .map(rest => `<li>${rest.name}</li>`)
      .join('');
  };

  /* 6. Event Listeners --------------------------------------------- */
  searchInput.addEventListener('input', e => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) { suggestions.innerHTML = ''; return; }
    showSuggestions(
      restaurantData.filter(rest =>
        rest.name.toLowerCase().includes(val)
      )
    );
  });

  suggestions.addEventListener('click', e => {
    if (e.target.tagName !== 'LI') return;
    clearActive();
    e.target.classList.add('active');
    const restName = e.target.textContent;
    const rest = restaurantData.find(r => r.name === restName);

    if (!rest) return;
    currentRestaurant = rest;
    searchInput.value = rest.name;
    suggestions.innerHTML = '';
    ingredientInput.value = '';
    renderMenu(rest);
  });

  ingredientInput.addEventListener('input', e => {
    if (!currentRestaurant) return;
    const filter = e.target.value.toLowerCase().trim();
    renderMenu(currentRestaurant, filter);
  });

  searchInput.addEventListener('focus', () => { showSuggestions(restaurantData); clearActive(); });
})();
