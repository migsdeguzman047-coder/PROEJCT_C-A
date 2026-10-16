/* ==========================================================
   products.js — Bestsellers + Shop section
   1 Product card   2 Hearts   3 Details pop-up
   4 Search & filters   5 Start-up
   ========================================================== */

const productGrid = document.getElementById("product-grid");
const featuredGrid = document.getElementById("featured-grid");
const resultsNote = document.getElementById("results-note");
const searchInput = document.getElementById("search-input");
const genderFilter = document.getElementById("gender-filter");
const categoryChips = document.getElementById("category-chips");

let allProducts = [];          // every perfume loaded from products.json
let activeCategory = "All";    // current category filter

/* 1. PRODUCT CARD — used by Bestsellers, Shop and Favorites */
function createProductCard(product, inFavorites) {
  const card = document.createElement("article");
  card.className = "product-card";
  const name = escapeHTML(product.name);

  const sizeOptions = product.sizes.map(function (size) {
    return `<option value="${size.label}">${size.label} - ${formatPeso(size.price)}</option>`;
  }).join("");

  const bestsellerTag = product.bestseller ? '<span class="tag tag-best">Bestseller</span>' : "";
  const outTag = product.available ? "" : '<span class="tag tag-out">Unavailable</span>';

  // Buyable products get a size picker + Add to Cart. Others get a clear message.
  const buyArea = product.available
    ? `<select class="size-select" aria-label="Bottle size for ${name}">${sizeOptions}</select>
       <p class="product-price" data-price>${formatPeso(product.sizes[0].price)}</p>
       <div class="product-actions">
         <button type="button" class="btn btn-small" data-action="add">Add to Cart</button>
         <button type="button" class="btn btn-outline btn-small" data-action="details">Details</button>
       </div>`
    : `<p class="unavailable-note">Sorry, this perfume is currently unavailable.</p>
       <div class="product-actions">
         <button type="button" class="btn btn-small" disabled>Unavailable</button>
         <button type="button" class="btn btn-outline btn-small" data-action="details">Details</button>
       </div>`;

  card.innerHTML = `
    <div class="product-image">
      <button type="button" class="image-btn" data-action="details" aria-label="View details of ${name}">
        <img src="${product.image}" alt="${name} perfume" loading="lazy">
      </button>
      <button type="button" class="heart-btn" data-id="${product.id}" data-name="${name}">&#9829;</button>
    </div>
    <div class="product-body">
      <div class="product-meta">${bestsellerTag}${outTag}<span class="tag">${product.category}</span><span class="tag">${product.gender}</span></div>
      <h3>${name}</h3>
      <p class="product-desc">${escapeHTML(product.description)}</p>
      ${buyArea}
    </div>`;

  // Missing photo? show the gold placeholder
  card.querySelector("img").addEventListener("error", function () { imageFallback(this, product.name); });

  const sizeSelect = card.querySelector(".size-select");
  if (sizeSelect) {
    // Changing the size updates the price shown on the card
    sizeSelect.addEventListener("change", function () {
      card.querySelector("[data-price]").textContent = formatPeso(getSizePrice(product, sizeSelect.value));
    });
  }

  // One click listener for the whole card (event delegation)
  card.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "details") openProductModal(product);
    if (button.dataset.action === "add") addToCart(product, sizeSelect.value, 1);
    if (button.classList.contains("heart-btn")) handleHeartClick(product, inFavorites);
  });

  setHeartState(card.querySelector(".heart-btn"));
  return card;
}

/* 2. HEARTS */
function setHeartState(button) {
  const saved = isFavorite(button.dataset.id);
  button.classList.toggle("active", saved);
  button.setAttribute("aria-pressed", saved);
  button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + button.dataset.name + (saved ? " from favorites" : " to favorites"));
}

// Make every heart on the page match what is saved
function refreshHearts() {
  document.querySelectorAll(".heart-btn").forEach(setHeartState);
}

function handleHeartClick(product, inFavorites) {
  const alreadySaved = isFavorite(product.id);
  // Ask first when removing from the Favorites section
  if (alreadySaved && inFavorites && !confirm("Remove " + product.name + " from your favorites?")) return;

  const nowSaved = toggleFavorite(product.id);
  showToast(product.name + (nowSaved ? " saved to favorites." : " removed from favorites."), nowSaved ? "success" : "");
  refreshHearts();
  renderFavorites(); // favorites.js: redraw the Favorites section
}

/* 3. DETAILS POP-UP */
const modal = document.getElementById("product-modal");
const modalBody = document.getElementById("modal-body");
let lastFocusedElement = null;

function openProductModal(product) {
  lastFocusedElement = document.activeElement;
  const name = escapeHTML(product.name);
  const sizeOptions = product.sizes.map(function (size) {
    return `<option value="${size.label}">${size.label} - ${formatPeso(size.price)}</option>`;
  }).join("");

  const buyArea = product.available
    ? `<p class="product-price" id="modal-price">${formatPeso(product.sizes[0].price)}</p>
       <div class="modal-row">
         <div><label for="modal-size">Bottle size</label><select id="modal-size">${sizeOptions}</select></div>
         <div><label for="modal-qty">Quantity</label><input type="number" id="modal-qty" min="1" max="20" value="1"></div>
       </div>
       <p class="field-error" id="modal-error"></p>
       <div class="modal-row">
         <button type="button" class="btn" id="modal-add">Add to Cart</button>
         <button type="button" class="btn btn-outline" id="modal-fav"></button>
       </div>`
    : `<p class="unavailable-note">Sorry, this perfume is currently unavailable.</p>
       <div class="modal-row"><button type="button" class="btn btn-outline" id="modal-fav"></button></div>`;

  modalBody.innerHTML = `
    <div class="modal-grid">
      <img src="${product.image}" alt="${name} perfume">
      <div class="modal-content">
        <div class="product-meta"><span class="tag">${product.category}</span><span class="tag">${product.gender}</span></div>
        <h2 id="modal-title">${name}</h2>
        <p>${escapeHTML(product.description)}</p>
        ${buyArea}
      </div>
    </div>`;

  modalBody.querySelector("img").addEventListener("error", function () { imageFallback(this, product.name); });

  function updateFavButton() {
    document.getElementById("modal-fav").textContent = isFavorite(product.id) ? "Remove from favorites" : "Save to favorites";
  }
  updateFavButton();
  document.getElementById("modal-fav").addEventListener("click", function () {
    handleHeartClick(product, false);
    updateFavButton();
  });

  if (product.available) {
    const sizeSelect = document.getElementById("modal-size");
    sizeSelect.addEventListener("change", function () {
      document.getElementById("modal-price").textContent = formatPeso(getSizePrice(product, sizeSelect.value));
    });
    document.getElementById("modal-add").addEventListener("click", function () {
      const quantity = Number(document.getElementById("modal-qty").value);
      const error = document.getElementById("modal-error");
      // Validate quantity: whole number from 1 to 20
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        error.textContent = "Enter a quantity from 1 to 20.";
        return;
      }
      error.textContent = "";
      if (addToCart(product, sizeSelect.value, quantity)) closeProductModal();
    });
  }

  modal.classList.add("open");
  document.getElementById("modal-close").focus();
}

function closeProductModal() {
  modal.classList.remove("open");
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.getElementById("modal-close").addEventListener("click", closeProductModal);
modal.addEventListener("click", function (event) { if (event.target === modal) closeProductModal(); });
document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeProductModal(); });

/* 4. SEARCH & FILTERS */
function getFilteredProducts() {
  const text = searchInput.value.trim().toLowerCase();
  const gender = genderFilter.value;
  return allProducts.filter(function (product) {
    const matchesName = product.name.toLowerCase().includes(text);
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesGender = gender === "All" || product.gender === gender;
    return matchesName && matchesCategory && matchesGender;
  });
}

function renderShop() {
  const results = getFilteredProducts();
  productGrid.innerHTML = "";
  resultsNote.textContent = "Showing " + results.length + " of " + allProducts.length + " perfumes";

  if (results.length === 0) {
    productGrid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1"><h3>No perfumes found</h3>' +
      "<p>Try a different name or clear your filters.</p>" +
      '<button type="button" class="btn" id="clear-filters">Clear filters</button></div>';
    document.getElementById("clear-filters").addEventListener("click", clearFilters);
    return;
  }
  results.forEach(function (product) { productGrid.appendChild(createProductCard(product, false)); });
}

function clearFilters() {
  searchInput.value = "";
  genderFilter.value = "All";
  setActiveCategory("All");
  renderShop();
}

function setActiveCategory(category) {
  activeCategory = category;
  categoryChips.querySelectorAll(".chip").forEach(function (chip) {
    const isActive = chip.dataset.category === category;
    chip.classList.toggle("active", isActive);
    chip.setAttribute("aria-pressed", isActive);
  });
}

searchInput.addEventListener("input", renderShop);
genderFilter.addEventListener("change", renderShop);
categoryChips.addEventListener("click", function (event) {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  setActiveCategory(chip.dataset.category);
  renderShop();
});

/* 5. START-UP */
function renderBestsellers() {
  const bestsellers = allProducts.filter(function (p) { return p.bestseller; }).slice(0, 4);
  featuredGrid.innerHTML = "";
  bestsellers.forEach(function (product) { featuredGrid.appendChild(createProductCard(product, false)); });
}

async function startProducts() {
  try {
    allProducts = await loadProducts();
    renderBestsellers();
    renderShop();
  } catch (error) {
    // Most common cause: the page was opened by double-clicking instead of Live Server
    const message =
      '<div class="notice notice-error" style="grid-column:1/-1">We could not load the perfumes. ' +
      "Please open this site with VS Code Live Server, then refresh. " +
      '<button type="button" class="btn btn-small" onclick="location.reload()">Try again</button></div>';
    productGrid.innerHTML = message;
    featuredGrid.innerHTML = message;
  }
}

startProducts();
