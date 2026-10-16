/* ==========================================================
   common.js — code shared by EVERY page
   1 Storage keys & helpers   2 Product loading (Fetch + JSON)
   3 Favorites   4 Cart   5 Header & footer   6 Small tools
   ========================================================== */

/* 1. STORAGE KEYS — one place so names never get mixed up */
const STORAGE_KEYS = {
  cart: "ca_cart",             // [{ productId, size, quantity }]
  favorites: "ca_favorites",   // ["p01", "p05", ...]
  orders: "ca_orders",         // [order, order, ...]
  adminSession: "ca_admin_session"
};

// Read from Local Storage safely. If anything is missing or broken, return the fallback.
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error("Could not read " + key, error);
    return fallback;
  }
}

// Save to Local Storage. Returns true if it worked, false if it failed.
function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save " + key, error);
    showToast("Could not save your data. Check your browser storage settings.", "error");
    return false;
  }
}

/* 2. LOADING PRODUCTS from data/products.json using the Fetch API */
let productPromise = null; // remember the request so the JSON is fetched only once

function loadProducts() {
  if (!productPromise) {
    productPromise = fetch("data/products.json")
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (data) { return data.products; })
      .catch(function (error) {
        console.error("Product loading failed", error);
        productPromise = null;   // allow a retry
        throw error;             // the page shows its own error message
      });
  }
  return productPromise;
}

function findProduct(products, id) {
  return products.find(function (product) { return product.id === id; });
}

function getSizePrice(product, sizeLabel) {
  const size = product.sizes.find(function (s) { return s.label === sizeLabel; });
  return size ? size.price : 0;
}

/* 3. FAVORITES */
function getFavorites() {
  const list = readStorage(STORAGE_KEYS.favorites, []);
  return Array.isArray(list) ? list : [];
}

function isFavorite(productId) {
  return getFavorites().includes(productId);
}

// Add if missing, remove if already saved. Returns true if it is now a favorite.
function toggleFavorite(productId) {
  let favorites = getFavorites();
  const nowFavorite = !favorites.includes(productId);
  if (nowFavorite) {
    favorites.push(productId);          // no duplicates: we checked first
  } else {
    favorites = favorites.filter(function (id) { return id !== productId; });
  }
  saveStorage(STORAGE_KEYS.favorites, favorites);
  updateCounts();
  return nowFavorite;
}

/* 4. CART */
function getCart() {
  const cart = readStorage(STORAGE_KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(cart) {
  saveStorage(STORAGE_KEYS.cart, cart);
  updateCounts();
  document.dispatchEvent(new Event("cart-changed")); // tells cart.js to redraw
}

// Add a perfume to the cart. Same perfume + same size = increase quantity.
function addToCart(product, sizeLabel, quantity) {
  if (!product.available) {
    showToast(product.name + " is currently unavailable.", "error");
    return false;
  }
  if (!getSizePrice(product, sizeLabel)) {
    showToast("Please choose a bottle size.", "error");
    return false;
  }
  const cart = getCart();
  const existing = cart.find(function (item) {
    return item.productId === product.id && item.size === sizeLabel;
  });
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 20);
  } else {
    cart.push({ productId: product.id, size: sizeLabel, quantity: quantity });
  }
  saveCart(cart);
  showToast(product.name + " (" + sizeLabel + ") added to cart.", "success");
  return true;
}

function countCartItems() {
  return getCart().reduce(function (total, item) { return total + item.quantity; }, 0);
}

/* 5. HEADER & FOOTER — written once here, so every page stays consistent */
function renderHeader() {
  const holder = document.getElementById("site-header");
  if (!holder) return;
  const page = document.body.dataset.page; // "home" on index.html, "admin" on admin.html

  // The owner's dashboard shows only the centered C&A logo (no customer links)
  if (page === "admin") {
    holder.innerHTML =
      '<header class="site-header"><div class="container nav nav-center">' +
      '<span class="brand"><img src="images/logo.jpg" alt="" width="52" height="52"><span>C&amp;A</span></span>' +
      "</div></header>";
    return;
  }

  const base = ""; // links scroll to a section of index.html
  const links = [
    { section: "home", label: "Home" },
    { section: "shop", label: "Shop" },
    { section: "favorites", label: 'Favorites <span class="count-badge" id="fav-count">0</span>' },
    { section: "cart", label: 'Cart <span class="count-badge" id="cart-count">0</span>' }
  ];
  const linkHtml = links.map(function (link) {
    return '<li><a href="' + base + "#" + link.section + '" data-section="' + link.section + '">' + link.label + "</a></li>";
  }).join("");

  holder.innerHTML =
    '<header class="site-header"><div class="container nav">' +
    '<a class="brand" href="index.html"><img src="images/logo.jpg" alt="" width="44" height="44"><span>C&amp;A</span></a>' +
    '<button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
    '<ul class="nav-links" id="nav-links">' + linkHtml +
    '</ul>' +
    "</div></header>";

  document.getElementById("nav-toggle").addEventListener("click", function () {
    const menu = document.getElementById("nav-links");
    const isOpen = menu.classList.toggle("open");
    this.setAttribute("aria-expanded", isOpen);
  });
}

function renderFooter() {
  const holder = document.getElementById("site-footer");
  if (!holder) return;

  // Full footer with contact and social media (admin.html has no footer)
  holder.innerHTML =
    '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
    "<div><h3>Captivating Aroma</h3><p>Leave a captivating impression. Your favorite scents, all in one place.</p></div>" +
    "<div><h3>Contact</h3><ul>" +
    "<li>Phone: 0927 4549 706</li><li>Email:captivatingaromabyanc@gmail.com</li><li>Pasig City, Philippines</li></ul></div>" +
    '<div><h3>Follow us</h3><ul><li><a href="https://www.facebook.com/people/Captivating-Aroma-by-AC/61563662847766/" target="_blank" rel="noopener">Facebook</a></li>' +
    '<li><a href="https://instagram.com/captivatingaroma?srtk=MTUwdWU2ZzhjNHNkMA%3D%3D" target="_blank" rel="noopener">Instagram</a></li>';
}

// Update the little numbers beside Favorites and Cart
function updateCounts() {
  const favCount = document.getElementById("fav-count");
  const cartCount = document.getElementById("cart-count");
  if (favCount) favCount.textContent = getFavorites().length;
  if (cartCount) cartCount.textContent = countCartItems();
}

/* 6. SMALL TOOLS */
function formatPeso(amount) {
  return "₱" + Number(amount).toLocaleString("en-PH");
}

// Stops user text from being treated as HTML (safe rendering)
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// If a perfume photo is missing, draw a simple gold placeholder instead
function imageFallback(img, name) {
  img.onerror = null;
  const initials = name.split(" ").slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#efe4cf"/>' +
    '<text x="200" y="215" font-family="Georgia" font-size="90" text-anchor="middle" fill="#b8924a">' + initials + "</text></svg>";
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Pop-up message in the corner. type: "success", "error" or nothing
function showToast(message, type) {
  let area = document.getElementById("toast-area");
  if (!area) {
    area = document.createElement("div");
    area.id = "toast-area";
    area.className = "toast-area";
    area.setAttribute("role", "status");
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " toast-" + type : "");
  toast.textContent = message;
  area.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3200);
}

/* 7. ORDER HELPERS — shared by index.html and admin.html */
const ORDER_STATUSES = ["Pending", "Confirmed", "Preparing", "Ready for Meetup", "Out for Delivery", "Completed", "Cancelled"];

// Read all saved orders. Broken entries are ignored.
function getOrders() {
  const orders = readStorage(STORAGE_KEYS.orders, []);
  if (!Array.isArray(orders)) return [];
  return orders.filter(function (order) { return order && order.reference && Array.isArray(order.items); });
}

function saveOrders(orders) {
  return saveStorage(STORAGE_KEYS.orders, orders);
}

// Example: CA-20261012-4821 (date + random 4 digits, checked so it is never repeated)
function generateOrderReference() {
  const now = new Date();
  const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  const used = getOrders().map(function (order) { return order.reference; });
  let reference;
  do {
    reference = "CA-" + datePart + "-" + Math.floor(1000 + Math.random() * 9000);
  } while (used.includes(reference));
  return reference;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return "Unknown date";
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

// "Ready for Meetup" becomes the CSS class "status status-ready-for-meetup"
function statusClass(status) {
  return "status status-" + String(status).toLowerCase().replace(/\s+/g, "-");
}

// Show or clear an error message under an input. Needs <p id="err-INPUTID"> in the HTML.
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorBox = document.getElementById("err-" + inputId);
  if (errorBox) errorBox.textContent = message;
  if (input) {
    input.classList.toggle("input-invalid", Boolean(message));
    input.setAttribute("aria-invalid", Boolean(message));
  }
}


// Close the phone menu after tapping a link, and highlight the section you are reading
function setupNavBehavior() {
  const menu = document.getElementById("nav-links");
  if (!menu) return;
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) menu.classList.remove("open");
  });

  if (document.body.dataset.page !== "home") return; // highlight only on the one-page site
  const sectionIds = ["home", "shop", "favorites", "cart", "about"];

  function highlightCurrentSection() {
    let current = "home";
    sectionIds.forEach(function (id) {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= 120) current = id;
    });
    menu.querySelectorAll("a[data-section]").forEach(function (link) {
      link.classList.toggle("active", link.dataset.section === current);
    });
  }
  window.addEventListener("scroll", highlightCurrentSection, { passive: true });
  highlightCurrentSection();
}

// Runs on every page when it finishes loading
document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
  updateCounts();
  setupNavBehavior();
});