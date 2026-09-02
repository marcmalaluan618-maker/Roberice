/**
 * Roberice POS & Inventory System - Inventory Management Script
 */

let inventoryCache = [];

document.addEventListener('DOMContentLoaded', () => {
  renderInventoryManageTable();
  renderAdjustmentLogs();

  document.getElementById('btnOpenRestockModal')
    .addEventListener('click', () => openRestockModal());

  document.getElementById('btnOpenAdjustModal')
    .addEventListener('click', () => openAdjustModal());

  document.getElementById('restockForm')
    .addEventListener('submit', handleRestockSubmit);

  document.getElementById('adjustStockForm')
    .addEventListener('submit', handleAdjustSubmit);
});


async function renderInventoryManageTable() {
  const tbody = document.getElementById('inventoryManageTable');
  if (!tbody) return;

  try {
    const response = await fetch('api/get_inventory.php');

    if (!response.ok) {
      throw new Error('Failed to load inventory.');
    }

    const data = await response.json();

    inventoryCache = data.map(p => ({
      id: String(p.product_id),
      name: p.product_name,
      category: p.category,
      kgPerSack: Number(p.kg_per_sack),
      stockSacks: Number(p.stock_sacks || 0),
      stockKg: Number(p.stock_kg || 0),
      thresholdKg: Number(p.reorder_level_kg || 0)
    }));

    if (inventoryCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            No products found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = inventoryCache.map(p => {
      const stockInfo = formatStock(
        p.stockSacks,
        p.stockKg,
        p.kgPerSack
      );

      const lowStock = isLowStock(p);
      const isOut = p.stockSacks <= 0 && p.stockKg <= 0;

      let statusBadge;

      if (isOut) {
        statusBadge = `
          <span class="badge badge-danger">
            Out of Stock
          </span>
        `;
      } else if (lowStock) {
        statusBadge = `
          <span class="badge badge-warning">
            Low Stock
          </span>
        `;
      } else {
        statusBadge = `
          <span class="badge badge-success">
            Sufficient
          </span>
        `;
      }

      return `
        <tr>
          <td>
            <strong>${p.name}</strong>
            <span style="font-size:11px;color:var(--text-muted);">
              (${p.category})
            </span>
          </td>

          <td>${p.stockSacks} sacks</td>

          <td>${p.stockKg} kg</td>

          <td>
            <strong>${stockInfo.display}</strong>
          </td>

          <td>${p.thresholdKg} kg total</td>

          <td>${statusBadge}</td>

          <td>
            <div style="display:flex;gap:6px;">
              <button
                class="btn btn-primary btn-sm"
                onclick="openRestockModal('${p.id}')">
                Restock
              </button>

              <button
                class="btn btn-secondary btn-sm"
                onclick="openAdjustModal('${p.id}')">
                Adjust
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          Failed to load inventory.
        </td>
      </tr>
    `;
  }
}


async function renderAdjustmentLogs() {
  const tbody = document.getElementById('adjustmentLogTable');
  if (!tbody) return;

  try {
    const response = await fetch('api/get_adjustments.php');

    if (!response.ok) {
      throw new Error('Failed to load adjustment logs.');
    }

    const adjustments = await response.json();

    if (adjustments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No adjustments logged yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = adjustments.map(a => {
      let typeBadge;

      if (a.adjustment_type === 'restock') {
        typeBadge = `
          <span class="badge badge-success">
            Restock
          </span>
        `;
      } else if (a.adjustment_type === 'spoilage') {
        typeBadge = `
          <span class="badge badge-danger">
            Damage / Spoilage
          </span>
        `;
      } else {
        typeBadge = `
          <span class="badge badge-info">
            Correction
          </span>
        `;
      }

      const sacks = Number(a.sacks);
      const kg = Number(a.kg);

      const shiftText =
        `${sacks > 0 ? sacks + ' sacks' : ''} ${kg > 0 ? kg + ' kg' : ''}`
          .trim() || '0';

      return `
        <tr>
          <td>${formatDateTime(a.adjustment_date)}</td>

          <td>
            <strong>${a.product_name}</strong>
          </td>

          <td>${typeBadge}</td>

          <td>${shiftText}</td>

          <td>${a.note || '-'}</td>

          <td>${a.performed_by || 'Admin User'}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Failed to load adjustment logs.
        </td>
      </tr>
    `;
  }
}


function populateProductSelect(selectId, productId = null) {
  const select = document.getElementById(selectId);

  select.innerHTML = inventoryCache.map(p => `
    <option
      value="${p.id}"
      ${p.id === productId ? 'selected' : ''}>
      ${p.name}
      (Current: ${p.stockSacks} sacks, ${p.stockKg} kg)
    </option>
  `).join('');
}


function openRestockModal(productId = null) {
  populateProductSelect(
    'restockProductSelect',
    productId
  );

  document.getElementById('restockSacks').value = '0';
  document.getElementById('restockKg').value = '0';

  openModal('modalRestock');
}


function openAdjustModal(productId = null) {
  populateProductSelect(
    'adjustProductSelect',
    productId
  );

  document.getElementById('adjustType').value = 'correction';
  document.getElementById('adjustSacks').value = '0';
  document.getElementById('adjustKg').value = '0';
  document.getElementById('adjustNote').value = '';

  openModal('modalStockAdjust');
}


async function handleRestockSubmit(e) {
  e.preventDefault();

  const productId =
    document.getElementById('restockProductSelect').value;

  const sacks =
    parseInt(document.getElementById('restockSacks').value) || 0;

  const kg =
    parseFloat(document.getElementById('restockKg').value) || 0;

  if (sacks <= 0 && kg <= 0) {
    showToast(
      'Please enter a sack or kilogram amount to restock.',
      'warning'
    );
    return;
  }

  const userData =
    JSON.parse(
      sessionStorage.getItem('roberice_logged_user')
    ) || {};

  const user =
    userData.name ||
    userData.username ||
    'Admin User';

  try {
    const response = await fetch(
      'api/adjust_stock.php',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          productId,
          type: 'restock',
          sacks,
          kg,
          note: '',
          user
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      showToast(
        result.message || 'Unable to restock item.',
        'warning'
      );
      return;
    }

    showToast(
      `${result.productName} restocked successfully.`,
      'success'
    );

    closeModal('modalRestock');

    await renderInventoryManageTable();
    await renderAdjustmentLogs();

  } catch (error) {
    console.error(error);

    showToast(
      'Unable to restock inventory.',
      'warning'
    );
  }
}


async function handleAdjustSubmit(e) {
  e.preventDefault();

  const productId =
    document.getElementById('adjustProductSelect').value;

  const type =
    document.getElementById('adjustType').value;

  const sacks =
    parseInt(document.getElementById('adjustSacks').value) || 0;

  const kg =
    parseFloat(document.getElementById('adjustKg').value) || 0;

  const note =
    document.getElementById('adjustNote').value.trim();

  if (!note) {
    showToast(
      'Please provide a reason for the adjustment.',
      'warning'
    );
    return;
  }

  if (type === 'spoilage' && sacks <= 0 && kg <= 0) {
    showToast(
      'Please enter the damaged stock quantity.',
      'warning'
    );
    return;
  }

  if (type === 'correction' && sacks < 0 || kg < 0) {
    showToast(
      'Stock values cannot be negative.',
      'warning'
    );
    return;
  }

  const userData =
    JSON.parse(
      sessionStorage.getItem('roberice_logged_user')
    ) || {};

  const user =
    userData.name ||
    userData.username ||
    'Admin User';

  try {
    const response = await fetch(
      'api/adjust_stock.php',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          productId,
          type,
          sacks,
          kg,
          note,
          user
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      showToast(
        result.message || 'Unable to adjust stock.',
        'warning'
      );
      return;
    }

    if (result.lowStock) {
      showToast(
        `Stock adjusted. ${result.productName} is now Low Stock.`,
        'warning'
      );
    } else {
      showToast(
        `Stock adjusted successfully for ${result.productName}.`,
        'success'
      );
    }

    closeModal('modalStockAdjust');

    await renderInventoryManageTable();
    await renderAdjustmentLogs();

  } catch (error) {
    console.error(error);

    showToast(
      'Unable to adjust inventory.',
      'warning'
    );
  }
}