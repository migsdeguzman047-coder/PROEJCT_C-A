/* ==========================================================
   orders.js — checkout form, validation and saving orders
   Flow: validate form -> "Are you sure?" pop-up -> re-check cart
         -> build order object -> save in Local Storage ("ca_orders")
         -> clear cart -> show confirmation
   NOTE: This is a front-end demo. The order is saved only in this
   browser. Nothing is sent to the owner.
   ========================================================== */

const checkoutForm = document.getElementById("checkout-form");
const placeOrderButton = document.getElementById("place-order");
const cartMain = document.getElementById("cart-main");
const confirmationBox = document.getElementById("order-confirmation");
const confirmModal = document.getElementById("confirm-modal");
const confirmDetails = document.getElementById("confirm-details");
const confirmYes = document.getElementById("confirm-yes");
let isSubmitting = false; // stops double clicks from creating two orders

/* 1. FIELD HELPERS */
function getFulfillment() {
  return checkoutForm.querySelector('input[name="fulfillment"]:checked').value;
}

// Show the address box for Delivery, or the meetup box for Meetup
function updateFulfillmentFields() {
  const isDelivery = getFulfillment() === "Delivery";
  document.getElementById("address-group").hidden = !isDelivery;
  document.getElementById("meetup-group").hidden = isDelivery;
  setFieldError("address", "");
  setFieldError("meetup", "");
}

// Philippine mobile numbers: 09XXXXXXXXX or +639XXXXXXXXX (spaces and dashes allowed)
function isValidPhone(value) {
  return /^(09\d{9}|\+639\d{9})$/.test(value.replace(/[\s-]/g, ""));
}

function getLocationValue() {
  const id = getFulfillment() === "Delivery" ? "address" : "meetup";
  return document.getElementById(id).value.trim();
}

/* 2. VALIDATION — returns true only when everything is correct */
function validateCheckoutForm() {
  const fullName = document.getElementById("fullName").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const facebook = document.getElementById("facebook").value.trim();
  const errors = []; // list of [fieldId, message]

  if (fullName.length < 2) errors.push(["fullName", "Enter your full name."]);
  if (!contact) errors.push(["contact", "Enter your contact number."]);
  else if (!isValidPhone(contact)) errors.push(["contact", "Use a valid mobile number, like 09171234567 or +639171234567."]);
  if (facebook.length < 2) errors.push(["facebook", "Enter your Facebook name or profile link."]);

  // Only the field that matches the chosen method is required
  if (getFulfillment() === "Delivery") {
    if (getLocationValue().length < 10) errors.push(["address", "Enter your complete delivery address (house no., street, barangay, city)."]);
  } else if (getLocationValue().length < 3) {
    errors.push(["meetup", "Enter your preferred meetup location."]);
  }

  // Clear old messages, then show the new ones
  ["fullName", "contact", "facebook", "address", "meetup"].forEach(function (id) { setFieldError(id, ""); });
  errors.forEach(function (error) { setFieldError(error[0], error[1]); });

  if (errors.length > 0) document.getElementById(errors[0][0]).focus(); // jump to first problem
  return errors.length === 0;
}

/* 3. BUILD THE ORDER OBJECT — copies names and prices, so the order stays correct even if the catalog changes */
function createOrder(lines) {
  const total = lines.reduce(function (sum, line) { return sum + line.subtotal; }, 0);
  return {
    reference: generateOrderReference(),
    createdAt: new Date().toISOString(),
    status: "Pending",
    customer: {
      fullName: document.getElementById("fullName").value.trim(),
      contact: document.getElementById("contact").value.trim(),
      facebook: document.getElementById("facebook").value.trim()
    },
    fulfillment: getFulfillment(),
    location: getLocationValue(),
    notes: document.getElementById("notes").value.trim(),
    items: lines.map(function (line) {
      return { productId: line.product.id, name: line.product.name, size: line.item.size, unitPrice: line.unitPrice, quantity: line.quantity, subtotal: line.subtotal };
    }),
    total: total
  };
}

/* 4. "ARE YOU SURE?" POP-UP — lets the customer re-check name and address */
function openConfirmModal(lines, total) {
  const notes = document.getElementById("notes").value.trim();
  const rows = [
    ["Name", document.getElementById("fullName").value.trim()],
    ["Contact number", document.getElementById("contact").value.trim()],
    ["Facebook", document.getElementById("facebook").value.trim()],
    ["Method", getFulfillment()],
    [getFulfillment() === "Delivery" ? "Delivery address" : "Meetup location", getLocationValue()]
  ];
  if (notes) rows.push(["Notes", notes]);

  // The perfumes being ordered: name, size, quantity and price
  const perfumeRows = lines.map(function (line) {
    return '<div class="summary-row"><span>' + escapeHTML(line.product.name) + " (" + line.item.size + ") &times; " + line.quantity +
      "</span><span>" + formatPeso(line.subtotal) + "</span></div>";
  }).join("");

  const detailRows = rows.map(function (row) {
    return '<p style="margin:0 0 .5rem"><strong>' + row[0] + ":</strong> " + escapeHTML(row[1]) + "</p>";
  }).join("");

  confirmDetails.innerHTML =
    '<div class="summary-box" style="box-shadow:none;background:var(--cream);margin-bottom:1rem">' + perfumeRows +
    '<div class="summary-row summary-total"><span>Total</span><span>' + formatPeso(total) + "</span></div>" +
    '<p style="font-size:.88rem;color:var(--muted);margin:.6rem 0 0">Delivery fee, if any, will be confirmed by the owner.</p></div>' +
    detailRows;

  confirmModal.classList.add("open");
  document.getElementById("confirm-back").focus();
}

function closeConfirmModal() {
  confirmModal.classList.remove("open");
}

document.getElementById("confirm-back").addEventListener("click", closeConfirmModal);
confirmModal.addEventListener("click", function (event) { if (event.target === confirmModal) closeConfirmModal(); });
document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeConfirmModal(); });

/* 5. CONFIRMATION SCREEN */
function showConfirmation(order) {
  const rows = order.items.map(function (item) {
    return `<tr><td>${escapeHTML(item.name)}</td><td>${item.size}</td><td>${item.quantity}</td><td>${formatPeso(item.subtotal)}</td></tr>`;
  }).join("");

  confirmationBox.innerHTML = `
    <div class="form-card" style="max-width:720px;margin:0 auto">
      <h3>Order received</h3>
      <p><strong>Order reference:</strong> ${order.reference}</p>
      <div class="notice notice-success">Thank you for choosing Captivating Aroma! Your order has been received. We appreciate your trust in us and look forward to helping you find your signature scent. Please wait for the owner to confirm your order.</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Perfume</th><th>Size</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="summary-row summary-total"><span>Total</span><span>${formatPeso(order.total)}</span></p>
      <p><strong>${order.fulfillment}:</strong> ${escapeHTML(order.location)}</p>
      <a class="btn" href="#shop" id="continue-shopping">Continue shopping</a>
    </div>`;

  cartMain.hidden = true;
  confirmationBox.hidden = false;
  document.getElementById("cart").scrollIntoView({ behavior: "smooth" });

  document.getElementById("continue-shopping").addEventListener("click", function () {
    confirmationBox.hidden = true;
    cartMain.hidden = false;
  });
}

/* 6. STEP 1: the form is submitted -> validate, then ask "Are you sure?" */
checkoutForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (isSubmitting) return;
  if (!validateCheckoutForm()) return;

  try {
    const lines = await buildCartLines();
    if (lines.length === 0) { showToast("Your cart is empty.", "error"); return; }
    if (lines.some(function (line) { return !line.product.available; })) {
      showToast("Remove unavailable perfumes first.", "error");
      return;
    }
    const total = lines.reduce(function (sum, line) { return sum + line.subtotal; }, 0);
    openConfirmModal(lines, total);
  } catch (error) {
    console.error(error);
    showToast("Something went wrong. Please try again.", "error");
  }
});

/* 7. STEP 2: the customer pressed "Yes, place my order" -> save the order */
confirmYes.addEventListener("click", async function () {
  if (isSubmitting) return;               // ignore repeated clicks
  isSubmitting = true;
  confirmYes.disabled = true;
  confirmYes.textContent = "Placing order...";

  try {
    const lines = await buildCartLines(); // check the cart again, right now
    if (lines.length === 0 || lines.some(function (line) { return !line.product.available; })) {
      showToast("Your cart changed. Please review it and try again.", "error");
      closeConfirmModal();
      return;
    }

    const order = createOrder(lines);
    const orders = getOrders();
    orders.push(order);
    if (!saveOrders(orders)) { closeConfirmModal(); return; } // saveOrders already showed an error

    saveCart([]);                          // clear the cart (order details are kept in the order)
    checkoutForm.reset();
    updateFulfillmentFields();
    closeConfirmModal();
    showConfirmation(order);
  } catch (error) {
    console.error(error);
    showToast("Something went wrong. Please try again.", "error");
    closeConfirmModal();
  } finally {
    isSubmitting = false;
    confirmYes.disabled = false;
    confirmYes.textContent = "Yes, place my order";
  }
});

checkoutForm.querySelectorAll('input[name="fulfillment"]').forEach(function (radio) {
  radio.addEventListener("change", updateFulfillmentFields);
});
updateFulfillmentFields();
