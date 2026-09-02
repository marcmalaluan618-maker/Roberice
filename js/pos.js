/**
 * Roberice POS & Inventory System - Point of Sale Script
 */

let cart = [];
let productsCache = [];

document.addEventListener('DOMContentLoaded', () => initPOS());

async function initPOS() {
  await loadProducts();
  document.getElementById('searchProduct').addEventListener('input', renderProductGrid);
  document.getElementById('filterCategory').addEventListener('change', renderProductGrid);
  document.getElementById('btnClearCart').addEventListener('click', () => {
    cart = [];
    renderCart();
  });
  document.getElementById('inputPaymentReceived').addEventListener('input', calculateChange);
  document.getElementById('btnCompleteSale').addEventListener('click', processSale);
  renderCart();
}

async function loadProducts() {
  try {
    const response = await fetch('api/get_products.php');
    const data = await response.json();

    productsCache = data.map(p => ({
      id: String(p.product_id),
      name: p.product_name,
      category: p.category,
      priceSack: Number(p.price_sack),
      priceKg: Number(p.price_kg),
      kgPerSack: Number(p.kg_per_sack),
      stockSacks: Number(p.stock_sacks),
      stockKg: Number(p.stock_kg),
      thresholdKg: Number(p.reorder_level_kg),
      status: p.product_status
    }));

    populateCategoryFilter();
    renderProductGrid();
  } catch (error) {
    console.error(error);
    showToast('Unable to load products.', 'danger');
  }
}

function populateCategoryFilter() {
  const select = document.getElementById('filterCategory');
  const current = select.value;
  const categories = [...new Set(productsCache.map(p => p.category))];

  select.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  if ([...select.options].some(o => o.value === current)) select.value = current;
}

function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const search = document.getElementById('searchProduct').value.toLowerCase();
  const category = document.getElementById('filterCategory').value;

  const filtered = productsCache.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No rice varieties found.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const stockInfo = formatStock(p.stockSacks, p.stockKg, p.kgPerSack);
    const isOut = p.stockSacks <= 0 && p.stockKg <= 0;
    const lowStock = isLowStock(p);

    let badge = `<span class="badge badge-success">In Stock</span>`;
    if (isOut) badge = `<span class="badge badge-danger">Out of Stock</span>`;
    else if (lowStock) badge = `<span class="badge badge-warning">Low Stock</span>`;

    return `
      <div class="product-card ${isOut ? 'out-of-stock' : ''}" ${isOut ? '' : `onclick="addToCart('${p.id}')"`}>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="product-card-title">${p.name}</div>
            <div class="product-card-category">${p.category}</div>
          </div>
          ${badge}
        </div>
        <div class="product-card-prices">
          <div class="price-item">
            <span class="label">Sack</span>
            <span class="val">${formatCurrency(p.priceSack)}</span>
          </div>
          <div class="price-item" style="text-align:right;">
            <span class="label">Per Kg</span>
            <span class="val">${formatCurrency(p.priceKg)}</span>
          </div>
        </div>
        <div class="product-card-stock">
          Stock: ${stockInfo.display}
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(productId) {
  const product = productsCache.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.productId === productId && item.unit === 'sack');

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      productId: product.id,
      productName: product.name,
      unit: 'sack',
      qty: 1,
      priceSack: product.priceSack,
      priceKg: product.priceKg
    });
  }

  showToast(`Added ${product.name} to cart.`, 'success');
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsList');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div>Cart is empty. Select rice items from the list to start sale.</div>
      </div>
    `;
    updateTotals();
    return;
  }

  container.innerHTML = cart.map((item, index) => {
    const unitPrice = item.unit === 'sack' ? item.priceSack : item.priceKg;
    const subtotal = unitPrice * item.qty;

    return `
      <div class="cart-item">
        <div class="cart-item-top">
          <div class="cart-item-name">${item.productName}</div>
          <button class="btn-remove-item" onclick="removeFromCart(${index})">&times;</button>
        </div>
        <div class="cart-item-controls">
          <div class="unit-selector">
            <button class="unit-btn ${item.unit === 'sack' ? 'active' : ''}" onclick="toggleUnit(${index},'sack')">Sack</button>
            <button class="unit-btn ${item.unit === 'kg' ? 'active' : ''}" onclick="toggleUnit(${index},'kg')">Kg</button>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty(${index},${item.qty - 1})">-</button>
            <input type="number" class="qty-input" value="${item.qty}" min="0.01" step="${item.unit === 'sack' ? '1' : '0.01'}" onchange="updateQty(${index},parseFloat(this.value))">
            <button class="qty-btn" onclick="updateQty(${index},${item.qty + 1})">+</button>
          </div>
          <div class="cart-item-price">${formatCurrency(subtotal)}</div>
        </div>
      </div>
    `;
  }).join('');

  updateTotals();
}

function toggleUnit(index, unit) {
  if (!cart[index]) return;
  cart[index].unit = unit;
  if (unit === 'sack') cart[index].qty = Math.max(1, Math.floor(cart[index].qty));
  renderCart();
}

function updateQty(index, qty) {
  if (!cart[index]) return;

  qty = Number(qty);

  if (!qty || qty <= 0) {
    removeFromCart(index);
    return;
  }

  if (cart[index].unit === 'sack') qty = Math.floor(qty);

  cart[index].qty = qty;
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function getGrandTotal() {
  return cart.reduce((total, item) => {
    const price = item.unit === 'sack' ? item.priceSack : item.priceKg;
    return total + price * item.qty;
  }, 0);
}

function updateTotals() {
  const total = getGrandTotal();
  document.getElementById('lblSubtotal').textContent = formatCurrency(total);
  document.getElementById('lblTotal').textContent = formatCurrency(total);
  calculateChange();
}

function calculateChange() {
  const total = getGrandTotal();
  const payment = parseFloat(document.getElementById('inputPaymentReceived').value) || 0;
  const change = payment - total;
  const button = document.getElementById('btnCompleteSale');
  const label = document.getElementById('lblChange');

  if (cart.length && total > 0 && payment >= total) {
    button.disabled = false;
    label.textContent = formatCurrency(change);
    label.style.color = 'var(--success-text)';
  } else {
    button.disabled = true;
    label.textContent = payment > 0 && payment < total ? 'Insufficient Amount' : '₱0.00';
    label.style.color = payment > 0 && payment < total ? 'var(--danger-text)' : 'var(--text-main)';
  }
}

async function processSale() {
  if (!cart.length) return;

  const paymentReceived = parseFloat(document.getElementById('inputPaymentReceived').value) || 0;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const user = JSON.parse(sessionStorage.getItem('roberice_logged_user')) || {};

  try {
    const response = await fetch('api/process_sale.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username || 'admin',
        paymentReceived,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          unit: item.unit,
          qty: item.qty
        }))
      })
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Unable to complete sale.', 'danger');
      return;
    }

    const transaction = {
      id: result.transactionCode,
      timestamp: result.transactionDate,
      cashierName: result.cashierName,
      items: result.items,
      totalAmount: Number(result.totalAmount),
      paymentReceived: Number(result.paymentReceived),
      changeAmount: Number(result.changeAmount),
      paymentMethod: result.paymentMethod
    };

    renderReceiptModal(transaction);
    addAuditLog('Sale Completed', `Processed transaction ${transaction.id} for ${formatCurrency(transaction.totalAmount)} (${transaction.paymentMethod}).`);

    cart = [];
    document.getElementById('inputPaymentReceived').value = '';
    renderCart();
    await loadProducts();

    showToast(`Sale completed! Transaction ID: ${transaction.id}`, 'success');
  } catch (error) {
    console.error(error);
    showToast('Unable to complete sale.', 'danger');
  }
}

function renderReceiptModal(txn) {
  const container = document.getElementById('receiptContent');
  if (!container) return;

  const items = txn.items.map(i => `
    <div class="receipt-row">
      <span>${i.productName} (${i.qty} ${i.unit})</span>
      <span>${formatCurrency(Number(i.subtotal))}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="receipt-header">
      <h2>ROBERICE STORE</h2>
      <div>Rice Wholesaler & Retailer</div>
      <div>Official Sales Receipt</div>
    </div>
    <div class="receipt-divider"></div>
    <div class="receipt-row"><span>Txn ID:</span><span>${txn.id}</span></div>
    <div class="receipt-row"><span>Date/Time:</span><span>${txn.timestamp}</span></div>
    <div class="receipt-row"><span>Cashier:</span><span>${txn.cashierName}</span></div>
    <div class="receipt-divider"></div>
    ${items}
    <div class="receipt-divider"></div>
    <div class="receipt-row" style="font-weight:bold;font-size:14px;">
      <span>TOTAL AMOUNT:</span>
      <span>${formatCurrency(txn.totalAmount)}</span>
    </div>
    <div class="receipt-row">
      <span>Payment (${txn.paymentMethod}):</span>
      <span>${formatCurrency(txn.paymentReceived)}</span>
    </div>
    <div class="receipt-row"><span>Change:</span><span>${formatCurrency(txn.changeAmount)}</span></div>
    <div class="receipt-divider"></div>
    <div style="text-align:center;margin-top:10px;">Thank you for shopping at Roberice!</div>
  `;

  openModal('modalReceipt');
}