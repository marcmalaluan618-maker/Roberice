/**
 * Roberice POS & Inventory System - General Helper Utilities
 */

// Format numbers into Philippine Peso currency format: ₱1,250.00
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format Sack & Kg stock into clean readable text: "15 Sacks + 20 Kg" (Total: 770 Kg)
function formatStock(sacks, kg, kgPerSack = 50) {
  const s = parseInt(sacks) || 0;
  const k = parseFloat(kg) || 0;
  const totalKg = (s * kgPerSack) + k;

  let text = '';
  if (s > 0 && k > 0) {
    text = `${s} Sack${s > 1 ? 's' : ''} + ${k} Kg`;
  } else if (s > 0) {
    text = `${s} Sack${s > 1 ? 's' : ''}`;
  } else if (k > 0) {
    text = `${k} Kg`;
  } else {
    text = 'Out of Stock';
  }

  return {
    display: text,
    totalKg: totalKg
  };
}

// Format ISO or date strings into readable format: "Sep 01, 2026 11:05 AM"
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Low Stock calculation rule
function isLowStock(product) {
  if (!product) return false;

  const status = String(product.status || 'active').toLowerCase();

  if (status === 'inactive' || status === 'deleted') {
    return false;
  }

  const stockSacks = Number(product.stockSacks) || 0;
  const stockKg = Number(product.stockKg) || 0;
  const kgPerSack = Number(product.kgPerSack) || 0;
  const thresholdKg = Number(product.thresholdKg) || 0;

  const totalKg = (stockSacks * kgPerSack) + stockKg;

  return totalKg <= thresholdKg;
}

// Toast notification UI display
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Toggle Handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}
