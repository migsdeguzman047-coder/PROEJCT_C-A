/* ==========================================================
   cart.js — the Cart section
   The cart in Local Storage only keeps: productId, size, quantity.
   Names, images and prices are looked up from products.json,
   so prices are always calculated from the catalog.
   ========================================================== */

const cartEmpty = document.getElementById("cart-empty");
const cartFilled = document.getElementById("cart-filled");
const cartItemsBox = document.getElementById("cart-items");
const summaryBox = document.getElementById("order-summary");
const MAX_QUANTITY = 20;

// Turn the saved cart into "lines" with full product info and totals.
// orders.js also uses this function when placing an order.
async function buildCartLines() {
  const products = await loadProducts();
  const savedCart = getCart();

  // Keep only valid items: product exists, size exists, quantity is a whole number >= 1
  const validItems = savedCart.filter(function (item) {
    const product = item && findProduct(products, item.productId);
    return product && getSizePrice(product, item.size) > 0 && Number.isInteger(item.quantity) && item.quantity >= 1;
  });
  if (validItems.length !== savedCart.length) {
    saveStorage(STORAGE_KEYS.cart, validItems); // remove broken items quietly
    updateCounts();
  }

  return validItems.map(function (item) {
    const product = findProduct(products, item.productId);
    const quantity = Math.min(item.quantity, MAX_QUANTITY);
    const unitPrice = getSizePrice(product, item.size);
    return { item: item, product: product, quantity: quantity, unitPrice: unitPrice, subtotal: unitPrice * quantity };
  });
}

function createCartRow(line) {
  const name = escapeHTML(line.product.name);
  const unavailableNote = line.product.available
    ? ""
    : '<p class="unavailable-note">This perfume is now unavailable. Please remove it to check out.</p>';
  return `
    <div class="cart-item" data-id="${line.product.id}" data-size="${line.item.size}">
      <img src="${line.product.image}" alt="${name}">
      <div>
        <h3 style="margin:0;font-size:1.2rem">${name}</h3>
        <p style="margin:0;color:var(--muted)">${line.item.size} &middot; ${formatPeso(line.unitPrice)} each</p>
        ${unavailableNote}
        <div class="qty-control">
          <button type="button" data-action="minus" aria-label="Decrease quantity of ${name}">&minus;</button>
          <span aria-live="polite">${line.quantity}</span>
          <button type="button" data-action="plus" aria-label="Increase quantity of ${name}">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <strong>${formatPeso(line.subtotal)}</strong><br>
        <button type="button" class="btn btn-danger btn-small" data-action="remove" style="margin-top:.5rem">Remove</button>
      </div>
    </div>`;
}

function renderSummary(lines) {
  const total = lines.reduce(function (sum, line) { return sum + line.subtotal; }, 0);
  const hasUnavailable = lines.some(function (line) { return !line.product.available; });

  const rows = lines.map(function (line) {
    return `<div class="summary-row"><span>${escapeHTML(line.product.name)} (${line.item.size}) &times; ${line.quantity}</span><span>${formatPeso(line.subtotal)}</span></div>`;
  }).join("");

  summaryBox.innerHTML = `
    <h3>Order summary</h3>
    ${rows}
    <div class="summary-row summary-total"><span>Total</span><span>${formatPeso(total)}</span></div>
    <p style="font-size:.88rem;color:var(--muted);margin:.8rem 0 0">Delivery fee, if any, will be confirmed by the owner.</p>
    ${hasUnavailable ? '<div class="notice notice-error" style="margin-top:1rem">Remove unavailable perfumes before checking out.</div>' : ""}`;

  // Block checkout while an unavailable perfume is in the cart
  document.getElementById("place-order").disabled = hasUnavailable;
}

async function renderCart() {
  let lines;
  try {
    lines = await buildCartLines();
  } catch (error) {
    cartFilled.hidden = true;
    cartEmpty.hidden = false;
    cartEmpty.innerHTML = '<h3>We could not load your cart</h3><p>Please open this site with VS Code Live Server, then refresh.</p>';
    return;
  }

  const isEmpty = lines.length === 0;
  cartEmpty.hidden = !isEmpty;
  cartFilled.hidden = isEmpty;
  if (isEmpty) return;

  cartItemsBox.innerHTML = lines.map(createCartRow).join("");
  cartItemsBox.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () { imageFallback(img, img.alt); });
  });
  renderSummary(lines);
}

// Buttons inside the cart: one listener for all rows
cartItemsBox.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  const row = event.target.closest(".cart-item");
  if (!button || !row) return;

  const cart = getCart();
  const item = cart.find(function (entry) {
    return entry.productId === row.dataset.id && entry.size === row.dataset.size;
  });
  if (!item) return;

  const action = button.dataset.action;
  if (action === "plus") {
    if (item.quantity >= MAX_QUANTITY) { showToast("Maximum of " + MAX_QUANTITY + " per item.", "error"); return; }
    item.quantity += 1;
  } else if (action === "minus") {
    if (item.quantity <= 1) { showToast("Use Remove to take this perfume out of your cart."); return; }
    item.quantity -= 1;
  } else if (action === "remove") {
    if (!confirm("Remove this perfume from your cart?")) return;
    cart.splice(cart.indexOf(item), 1);
  }
  saveCart(cart); // fires "cart-changed", which redraws the cart
});

// Redraw whenever the cart changes (for example, Add to Cart from the shop)
document.addEventListener("cart-changed", renderCart);
renderCart();
