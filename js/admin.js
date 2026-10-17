// Change the owner's login here
const ADMIN_USERNAME = "captivating aroma";   // not case-sensitive
const ADMIN_PASSWORD = "chrystangela";        // case-sensitive

const loginBox = document.getElementById("admin-login-box");
const dashboard = document.getElementById("admin-dashboard");
const ordersBox = document.getElementById("admin-orders");
const searchInput = document.getElementById("admin-search");
const statusFilter = document.getElementById("admin-status-filter");
const orderModal = document.getElementById("order-modal");
const orderModalBody = document.getElementById("order-modal-body");

/*ADMIN LOGIN*/
function isAdminLoggedIn() {
  try { return sessionStorage.getItem(STORAGE_KEYS.adminSession) === "yes"; } catch (error) { return false; }
}

function setAdminSession(isLoggedIn) {
  try {
    if (isLoggedIn) sessionStorage.setItem(STORAGE_KEYS.adminSession, "yes");
    else sessionStorage.removeItem(STORAGE_KEYS.adminSession);
  } catch (error) { console.error(error); }
}

document.getElementById("admin-login-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const user = document.getElementById("admin-user").value.trim();
  const pass = document.getElementById("admin-pass").value;
  const message = document.getElementById("admin-login-message");
  message.hidden = true;

  setFieldError("admin-user", user ? "" : "Enter your username.");
  setFieldError("admin-pass", pass ? "" : "Enter your password.");
  if (!user || !pass) return;

  if (user.toLowerCase() === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    this.reset();
    setAdminSession(true);
    showAdminView();
  } else {
    message.textContent = "Wrong username or password. Please try again.";
    message.hidden = false;
  }
});

document.getElementById("admin-toggle-pass").addEventListener("click", function () {
  const input = document.getElementById("admin-pass");
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  this.textContent = isHidden ? "Hide" : "Show";
  this.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

document.getElementById("admin-logout").addEventListener("click", function () {
  setAdminSession(false);
  closeOrderModal();
  showAdminView();
  showToast("You have been logged out.");
});

function showAdminView() {
  const loggedIn = isAdminLoggedIn();
  loginBox.hidden = loggedIn;
  dashboard.hidden = !loggedIn;
  if (loggedIn) renderAdmin();
}

/*DASHBOARD NUMBERS*/
function renderStats(orders) {
  function countStatus(status) {
    return orders.filter(function (order) { return order.status === status; }).length;
  }
  // Sales count COMPLETED orders only
  const sales = orders
    .filter(function (order) { return order.status === "Completed"; })
    .reduce(function (sum, order) { return sum + order.total; }, 0);

  const stats = [
    ["Total orders", orders.length],
    ["Pending", countStatus("Pending")],
    ["Confirmed", countStatus("Confirmed")],
    ["Completed", countStatus("Completed")],
    ["Cancelled", countStatus("Cancelled")],
    ["Sales (completed only)", formatPeso(sales)]
  ];
  document.getElementById("stat-grid").innerHTML = stats.map(function (stat) {
    return '<div class="stat"><strong>' + stat[1] + "</strong>" + stat[0] + "</div>";
  }).join("");
}

/* ORDER LIST WITH SEARCH + STATUS FILTER */
function getVisibleOrders(orders) {
  const text = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return orders
    .filter(function (order) {
      const matchesText = order.reference.toLowerCase().includes(text) || order.customer.fullName.toLowerCase().includes(text);
      const matchesStatus = status === "All" || order.status === status;
      return matchesText && matchesStatus;
    })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }); // newest first
}

function renderOrderList(allOrders) {
  const orders = getVisibleOrders(allOrders);
  document.getElementById("admin-results-note").textContent =
    "Showing " + orders.length + " of " + allOrders.length + " orders";

  if (allOrders.length === 0) {
    ordersBox.innerHTML = '<div class="empty-state"><h3>No orders yet</h3><p>Orders placed through checkout in this browser will appear here.</p><a class="btn" href="index.html#shop">Go to the shop</a></div>';
    return;
  }
  if (orders.length === 0) {
    ordersBox.innerHTML = '<div class="empty-state"><h3>No matching orders</h3><p>Try a different name, reference number or status.</p></div>';
    return;
  }

  const rows = orders.map(function (order) {
    return `<tr>
      <td>${order.reference}</td>
      <td>${formatDateTime(order.createdAt)}</td>
      <td>${escapeHTML(order.customer.fullName)}</td>
      <td>${order.fulfillment}</td>
      <td>${formatPeso(order.total)}</td>
      <td><span class="${statusClass(order.status)}">${order.status}</span></td>
      <td><button type="button" class="btn btn-outline btn-small" data-view="${order.reference}">View</button></td>
    </tr>`;
  }).join("");

  ordersBox.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Reference</th><th>Date and time</th><th>Customer</th><th>Method</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function renderAlert(orders) {
  const pending = orders.filter(function (order) { return order.status === "Pending"; }).length;
  const alertBox = document.getElementById("admin-alert");
  alertBox.hidden = pending === 0;
  if (pending === 0) return;
  alertBox.innerHTML = "<strong>" + pending + " new order" + (pending > 1 ? "s" : "") + "</strong> waiting for your confirmation. " +
    '<button type="button" class="link-btn" id="show-pending">Show pending orders</button>';
}

document.getElementById("admin-alert").addEventListener("click", function (event) {
  if (!event.target.closest("#show-pending")) return;
  searchInput.value = "";
  statusFilter.value = "Pending";
  renderAdmin();
});

function renderAdmin() {
  const orders = getOrders();
  renderAlert(orders);
  renderStats(orders);
  renderOrderList(orders);
}

searchInput.addEventListener("input", renderAdmin);
statusFilter.addEventListener("change", renderAdmin);
ordersBox.addEventListener("click", function (event) {
  const button = event.target.closest("[data-view]");
  if (button) openOrderModal(button.dataset.view);
});

/* ORDER DETAILS + STATUS UPDATE */
function openOrderModal(reference) {
  const order = getOrders().find(function (entry) { return entry.reference === reference; });
  if (!order) { showToast("Order not found.", "error"); return; }

  const itemRows = order.items.map(function (item) {
    return `<tr><td>${escapeHTML(item.name)}</td><td>${item.size}</td><td>${item.quantity}</td><td>${formatPeso(item.unitPrice)}</td><td>${formatPeso(item.subtotal)}</td></tr>`;
  }).join("");

  const statusOptions = ORDER_STATUSES.map(function (status) {
    return `<option value="${status}"${status === order.status ? " selected" : ""}>${status}</option>`;
  }).join("");

  orderModalBody.innerHTML = `
    <h2 id="order-modal-title">${order.reference}</h2>
    <p><span class="${statusClass(order.status)}">${order.status}</span></p>
    <div class="detail-grid">
      <div><strong>Date and time:</strong> ${formatDateTime(order.createdAt)}</div>
      <div><strong>Customer:</strong> ${escapeHTML(order.customer.fullName)}</div>
      <div><strong>Contact number:</strong> ${escapeHTML(order.customer.contact)}</div>
      <div><strong>Facebook:</strong> ${escapeHTML(order.customer.facebook)}</div>
      <div><strong>Fulfillment:</strong> ${order.fulfillment}</div>
      <div><strong>${order.fulfillment === "Delivery" ? "Delivery address" : "Meetup location"}:</strong> ${escapeHTML(order.location)}</div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Perfume</th><th>Size</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table></div>
    <p class="summary-row summary-total"><span>Total</span><span>${formatPeso(order.total)}</span></p>
    <p><strong>Customer notes:</strong> ${order.notes ? escapeHTML(order.notes) : "None"}</p>
    <div class="form-group">
      <label for="status-select">Update status</label>
      <select id="status-select">${statusOptions}</select>
    </div>
    <button type="button" class="btn" id="save-status" data-ref="${order.reference}">Save status</button>`;

  orderModal.classList.add("open");
  document.getElementById("order-modal-close").focus();
}

function closeOrderModal() {
  orderModal.classList.remove("open");
}

orderModalBody.addEventListener("click", function (event) {
  const button = event.target.closest("#save-status");
  if (!button) return;
  updateOrderStatus(button.dataset.ref, document.getElementById("status-select").value);
});

function updateOrderStatus(reference, newStatus) {
  const orders = getOrders();
  const order = orders.find(function (entry) { return entry.reference === reference; });
  if (!order || !ORDER_STATUSES.includes(newStatus)) { showToast("Could not update this order.", "error"); return; }
  if (order.status === newStatus) { showToast("The status is already " + newStatus + "."); return; }
  if (newStatus === "Cancelled" && !confirm("Cancel order " + reference + "?")) return;

  order.status = newStatus;
  if (!saveOrders(orders)) return;
  showToast("Order " + reference + " is now " + newStatus + ".", "success");
  renderAdmin();
  openOrderModal(reference); // refresh the pop-up with the new status
}

document.getElementById("order-modal-close").addEventListener("click", closeOrderModal);
orderModal.addEventListener("click", function (event) { if (event.target === orderModal) closeOrderModal(); });
document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeOrderModal(); });

/* 5. LIVE UPDATE — if an order is placed in another tab of THIS browser, refresh the dashboard */
window.addEventListener("storage", function (event) {
  if (event.key === STORAGE_KEYS.orders && isAdminLoggedIn()) renderAdmin();
});

/* 6. START-UP */
statusFilter.innerHTML = '<option value="All">All statuses</option>' + ORDER_STATUSES.map(function (status) {
  return '<option value="' + status + '">' + status + "</option>";
}).join("");
showAdminView();
