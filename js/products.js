/**
 * Roberice POS & Inventory System - Products & Pricing Script
 */

let productsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  renderProductsTable();
  document.getElementById('btnOpenAddProduct').addEventListener('click', openAddProductModal);
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
});

async function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  try {
    const response = await fetch('api/get_products.php');
    if (!response.ok) throw new Error('Failed to retrieve products.');

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

    if (productsCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No rice varieties configured yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = productsCache.map(p => {
      const stockInfo = formatStock(p.stockSacks, p.stockKg, p.kgPerSack);
      const lowStock = isLowStock(p);

      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.category}</td>
          <td>${formatCurrency(p.priceSack)}</td>
          <td>${formatCurrency(p.priceKg)}</td>
          <td>${p.kgPerSack} kg</td>
          <td><strong>${stockInfo.display}</strong></td>
          <td>${p.thresholdKg} kg</td>
          <td>
            <span class="badge ${lowStock ? 'badge-warning' : 'badge-success'}">
              ${lowStock ? 'Low Stock' : 'Active'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openEditProductModal('${p.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Failed to load products.</td></tr>`;
  }
}

function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Add New Rice Variety';
  document.getElementById('prodEditId').value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodCategory').value = '';
  document.getElementById('prodPriceSack').value = '';
  document.getElementById('prodPriceKg').value = '';
  document.getElementById('prodKgPerSack').value = '50';
  document.getElementById('prodThresholdKg').value = '200';
  document.getElementById('initialStockRow').style.display = 'grid';
  document.getElementById('prodInitialSacks').value = '10';
  document.getElementById('prodInitialKg').value = '0';
  openModal('modalProductForm');
}

function openEditProductModal(productId) {
  const p = productsCache.find(product => product.id === productId);
  if (!p) return;

  document.getElementById('productModalTitle').textContent = 'Edit Rice Variety';
  document.getElementById('prodEditId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodPriceSack').value = p.priceSack;
  document.getElementById('prodPriceKg').value = p.priceKg;
  document.getElementById('prodKgPerSack').value = p.kgPerSack;
  document.getElementById('prodThresholdKg').value = p.thresholdKg;
  document.getElementById('initialStockRow').style.display = 'none';

  openModal('modalProductForm');
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('prodEditId').value;
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value.trim();
  const priceSack = parseFloat(document.getElementById('prodPriceSack').value);
  const priceKg = parseFloat(document.getElementById('prodPriceKg').value);
  const kgPerSack = parseInt(document.getElementById('prodKgPerSack').value) || 50;
  const thresholdKg = parseFloat(document.getElementById('prodThresholdKg').value) || 200;

  if (!name || !category || isNaN(priceSack) || isNaN(priceKg)) {
    showToast('Please complete all required fields.', 'warning');
    return;
  }

  if (priceSack < 0 || priceKg < 0) {
    showToast('Prices cannot be negative values.', 'warning');
    return;
  }

  try {
    let url;
    let body;

    if (editId) {
      url = 'api/update_product.php';
      body = {
        productId: editId,
        name,
        category,
        priceSack,
        priceKg,
        kgPerSack,
        thresholdKg
      };
    } else {
      url = 'api/add_product.php';

      const initialSacks = parseInt(document.getElementById('prodInitialSacks').value) || 0;
      const initialKg = parseFloat(document.getElementById('prodInitialKg').value) || 0;

      body = {
        name,
        category,
        priceSack,
        priceKg,
        kgPerSack,
        thresholdKg,
        initialSacks,
        initialKg
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.success) {
      showToast(
        editId
          ? `Product "${name}" updated successfully.`
          : `New product "${name}" created successfully.`,
        'success'
      );

      closeModal('modalProductForm');
      renderProductsTable();
    } else {
      showToast(result.message || 'Something went wrong.', 'warning');
    }
  } catch (error) {
    console.error(error);
    showToast('Unable to save product.', 'warning');
  }
}

async function deleteProduct(productId) {
  const p = productsCache.find(product => product.id === productId);
  if (!p) return;

  if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;

  try {
    const response = await fetch('api/delete_product.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const result = await response.json();

    if (result.success) {
      showToast(`Deleted product "${p.name}".`, 'info');
      renderProductsTable();
    } else {
      showToast(result.message || 'Unable to delete product.', 'warning');
    }
  } catch (error) {
    console.error(error);
    showToast('Unable to delete product.', 'warning');
  }
}