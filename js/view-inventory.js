/**
 * Roberice POS & Inventory System - View Inventory Script
 */

let inventoryCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventory();

  document.getElementById('searchInventory').addEventListener('input', renderInventoryTable);
  document.getElementById('filterStatus').addEventListener('change', renderInventoryTable);
});

async function loadInventory() {
  try {
    const response = await fetch('api/get_products.php');
    if (!response.ok) throw new Error('Failed to load inventory.');

    const data = await response.json();

    inventoryCache = data.map(p => ({
      id: String(p.product_id),
      name: p.product_name,
      category: p.category,
      priceSack: Number(p.price_sack),
      priceKg: Number(p.price_kg),
      kgPerSack: Number(p.kg_per_sack),
      stockSacks: Number(p.stock_sacks || 0),
      stockKg: Number(p.stock_kg || 0),
      thresholdKg: Number(p.reorder_level_kg || 0),
      status: p.product_status
    }));

    renderInventoryTable();
  } catch (error) {
    console.error(error);

    const tbody = document.getElementById('inventoryTableBody');

    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Failed to load inventory.</td></tr>`;
    }
  }
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  const searchQuery = document.getElementById('searchInventory').value.toLowerCase();
  const selectedStatus = document.getElementById('filterStatus').value;

  const filtered = inventoryCache.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);

    const isOut = p.stockSacks <= 0 && p.stockKg <= 0;
    const lowStock = isLowStock(p);

    let matchesStatus = true;

    if (selectedStatus === 'instock') {
      matchesStatus = !isOut && !lowStock;
    } else if (selectedStatus === 'lowstock') {
      matchesStatus = lowStock && !isOut;
    } else if (selectedStatus === 'outofstock') {
      matchesStatus = isOut;
    }

    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No matching rice items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const stockInfo = formatStock(p.stockSacks, p.stockKg, p.kgPerSack);
    const isOut = p.stockSacks <= 0 && p.stockKg <= 0;
    const lowStock = isLowStock(p);

    let statusBadge = '';

    if (isOut) {
      statusBadge = `<span class="badge badge-danger">Out of Stock</span>`;
    } else if (lowStock) {
      statusBadge = `<span class="badge badge-warning">Low Stock</span>`;
    } else {
      statusBadge = `<span class="badge badge-success">In Stock</span>`;
    }

    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${formatCurrency(p.priceSack)}</td>
        <td>${formatCurrency(p.priceKg)}</td>
        <td>${p.stockSacks} sacks</td>
        <td>${p.stockKg} kg</td>
        <td><strong>${stockInfo.display}</strong></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}