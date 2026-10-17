const favoritesGrid = document.getElementById("favorites-grid");

async function renderFavorites() {
  try {
    const products = await loadProducts();
    const savedIds = getFavorites();

    // Keep only IDs that still exist in products.json, and no duplicates
    const validIds = savedIds.filter(function (id, index) {
      return findProduct(products, id) && savedIds.indexOf(id) === index;
    });
    if (validIds.length !== savedIds.length) {
      saveStorage(STORAGE_KEYS.favorites, validIds); // clean up broken data
      updateCounts();
    }

    favoritesGrid.innerHTML = "";

    // Friendly empty state
    if (validIds.length === 0) {
      favoritesGrid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><h3>No favorites yet</h3>' +
        "<p>Tap the heart on any perfume to save it here.</p>" +
        '<a class="btn" href="#shop">Browse the shop</a></div>';
      return;
    }

    validIds.forEach(function (id) {
      // true = this card is inside Favorites, so removing asks for confirmation
      favoritesGrid.appendChild(createProductCard(findProduct(products, id), true));
    });
  } catch (error) {
    favoritesGrid.innerHTML =
      '<div class="notice notice-error" style="grid-column:1/-1">We could not load your favorites. ' +
      "Please open this site with VS Code Live Server, then refresh.</div>";
  }
}

renderFavorites();
