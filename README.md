# C&A — Captivating Aroma

**Student Name:** [Your Full Name]
**Student Number:** [Your Student Number]
**Class / Section:** [Your Section]
**Subject:** Integrative Programming and Technologies
**Website Category:** E-Commerce / Perfume Ordering System

## Project Description

C&A (Captivating Aroma) is a front-end perfume ordering website. Customers browse 60 scents, save favorites, add perfumes to a cart (20ml or 50ml), and place an order for delivery or meetup. Before an order is placed, a pop-up asks "Are you sure you want to continue?" so the customer can re-check their name and address. The owner uses a separate admin dashboard to view orders and update their status.

The customer site is a single scrollable page (`index.html`). The owner's dashboard is a separate page (`admin.html`).

This is a front-end demo. There is no backend or database, so orders are saved only in the browser that placed them.

## Main Features

**Customer site (`index.html`)**
- Sticky navigation (Home, Shop, Favorites, Cart, Admin) with smooth scrolling and visible Cart and Favorites counts
- Hero, bestsellers, "Why choose C&A", and About sections
- Shop: products loaded from JSON, search by name, filters by category (Sweet, Floral, Fresh, Woody) and gender, size selection with live price, details pop-up, unavailable-product messages
- Favorites: heart button, saved in Local Storage, remove with confirmation, add to cart with size choice, empty state
- Cart: quantity controls, remove with confirmation, automatic totals, availability checks
- Checkout: validated form (name, PH mobile number, Facebook, Delivery or Meetup, notes), "Are you sure?" review pop-up, duplicate-submit protection, unique order reference, confirmation message

**Admin dashboard (`admin.html`)**
- Demo login (labeled as not secure)
- Banner showing how many orders are waiting, and live refresh when an order is placed in another tab of the same browser
- Totals: all orders, Pending, Confirmed, Completed, Cancelled, and sales from Completed orders only
- Searchable list (customer name or reference) and status filter
- Full order details and status updates (Pending, Confirmed, Preparing, Ready for Meetup, Out for Delivery, Completed, Cancelled)

## Technologies Used

- HTML5
- CSS3 (variables, grid, flexbox, responsive layout)
- Vanilla JavaScript (ES6)
- JSON (`data/products.json`)
- Fetch API
- Browser Local Storage (and Session Storage for the demo admin session)
- Google Fonts (free): Cormorant Garamond and Jost

## Folder Structure

```
C-and-A/
├── index.html          Customer site (one page)
├── admin.html          Owner dashboard (separate page)
├── css/
│   └── style.css       All styles
├── js/
│   ├── common.js       Shared: storage, cart/favorites helpers, header/footer, toast
│   ├── products.js     Bestsellers + Shop (cards, search, filters, details pop-up)
│   ├── favorites.js    Favorites section
│   ├── cart.js         Cart section
│   ├── orders.js       Checkout validation and saving orders
│   └── admin.js        Admin dashboard
├── data/
│   └── products.json   Product catalog (60 perfumes)
├── images/
│   ├── logo.jpg
│   ├── menu.png
│   └── products/       Perfume photos: p01.jpg ... p60.jpg
└── README.md
```

## How to Run

1. Install **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. In VS Code, choose **File > Open Folder** and open the `C-and-A` folder.
4. Right-click `index.html` and choose **Open with Live Server**.
5. For the owner dashboard, open `admin.html` the same way (or click **Admin** in the navigation).

Do not double-click `index.html`. The Fetch API needs a local server to read `data/products.json`.

**Demo admin login:** username `admin`, password `demo-admin`.

## Adding Perfume Photos

Save each photo in `images/products/` and name it after the product ID in `data/products.json` (`p01.jpg` is the first perfume, `p02.jpg` the second, and so on). Missing photos show a gold placeholder.

## How Local Storage and JSON Are Used

**JSON** holds the starting catalog. `common.js` loads it with `fetch("data/products.json")`. Browser JavaScript cannot write to that file, so the catalog is read-only.

**Local Storage** keeps the customer's changes in their own browser:

| Key | Contents |
|---|---|
| `ca_cart` | Product ID, size and quantity |
| `ca_favorites` | List of saved product IDs |
| `ca_orders` | All placed orders (with names and prices copied in) |

The admin login session uses Session Storage (`ca_admin_session`), which clears when the tab closes.

## Known Limitations (Front-End Only)

- **No backend, no database.** Orders are saved only in the browser that placed them. The admin dashboard sees only orders in the same browser. There is no cross-device sync.
- **No real notification.** The owner is not notified when an order is placed.
- **The admin login is a demonstration and is not secure.** Anyone can read the demo credentials in the code. Real access control needs a backend or a trusted authentication service.
- **No customer accounts.** Customers order without logging in, and cannot cancel an order themselves. The owner cancels orders in the admin dashboard.
- **No online payment.**
- Clearing browser data removes all saved favorites, carts and orders.

## Screenshot Checklist

Capture each on desktop. Capture the starred ones on mobile too.

- [ ] Home hero ★
- [ ] Bestsellers and Why choose C&A
- [ ] Shop with all products ★
- [ ] Search result (for example, "vanilla")
- [ ] Category filter active (for example, Woody)
- [ ] Product details pop-up with size selection
- [ ] Unavailable product message (Delina or Fahrenheit)
- [ ] Favorites with items
- [ ] Favorites empty state
- [ ] Cart with items and order summary ★
- [ ] Empty cart message
- [ ] Checkout showing validation errors
- [ ] Checkout with Delivery selected, then with Meetup selected
- [ ] "Are you sure you want to continue?" pop-up
- [ ] Order confirmation with reference number
- [ ] Admin login
- [ ] Admin dashboard with totals ★
- [ ] Admin order list with search or filter
- [ ] Admin order details and status update
- [ ] Admin empty state (before any orders)
- [ ] Browser DevTools showing Local Storage keys (Application tab)
