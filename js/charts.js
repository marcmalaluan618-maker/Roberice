function renderSalesBarChart(containerId, transactions = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    days.push({
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleString('en-US', { month: 'short', day: '2-digit' }),
      total: 0
    });
  }

  transactions.forEach(t => {
    const dateStr = t.timestamp.split(' ')[0];
    const day = days.find(d => d.dateStr === dateStr);

    if (day) day.total += Number(t.totalAmount);
  });

  const maxVal = Math.max(...days.map(d => d.total), 5000);
  const ceilMax = Math.ceil(maxVal / 1000) * 1000;

  const width = 500;
  const height = 220;
  const padLeft = 45;
  const padBottom = 30;
  const chartWidth = width - padLeft - 20;
  const chartHeight = height - padBottom - 20;
  const barWidth = 32;
  const gap = (chartWidth - days.length * barWidth) / (days.length + 1);

  let grid = '';

  for (let i = 0; i <= 4; i++) {
    const val = (ceilMax / 4) * i;
    const y = height - padBottom - (val / ceilMax) * chartHeight;

    grid += `
      <line x1="${padLeft}" y1="${y}" x2="${width - 10}" y2="${y}"
        stroke="#ded8c8" stroke-dasharray="3,3"/>
      <text x="${padLeft - 8}" y="${y + 4}" font-size="10"
        fill="#9a9d91" text-anchor="end">
        ${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}
      </text>
    `;
  }

  let bars = '';

  days.forEach((day, index) => {
    const x = padLeft + gap + index * (barWidth + gap);
    const barHeight = (day.total / ceilMax) * chartHeight;
    const y = height - padBottom - barHeight;
    const color = index >= days.length - 2 ? '#1f4d32' : '#b9c9ba';

    bars += `
      <g>
        <title>${day.label}: ₱${day.total.toLocaleString()}</title>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
          rx="4" fill="${color}"></rect>
        <text x="${x + barWidth / 2}" y="${height - 10}"
          font-size="11" fill="#68756d" text-anchor="middle">
          ${day.label}
        </text>
      </g>
    `;
  });

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
      ${grid}
      ${bars}
    </svg>
  `;
}

function renderCategoryPieChart(containerId, transactions = [], products = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sales = {};

  products.forEach(p => {
    sales[p.name] = 0;
  });

  transactions.forEach(t => {
    t.items.forEach(item => {
      const product = products.find(p => p.name === item.productName);
      if (!product) return;

      const kg = item.unit === 'sack'
        ? item.qty * product.kgPerSack
        : item.qty;

      sales[item.productName] += kg;
    });
  });

  const entries = Object.entries(sales).filter(([, value]) => value > 0);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No sales data yet.</div>`;
    return;
  }

  const colors = ['#1f4d32','#c9a227','#6f8f74','#9d7d18','#2e5f43','#d8bd5b'];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  let angle = 0;
  let slices = '';
  let legend = '';

  const cx = 140;
  const cy = 110;
  const r = 75;
  const innerR = 40;

  entries.forEach(([name, value], i) => {
    const pct = Math.round((value / total) * 100);
    const sliceAngle = (value / total) * 360;

    const start = angle;
    const end = angle + sliceAngle;
    angle = end;

    const x1 = cx + r * Math.cos((Math.PI / 180) * (start - 90));
    const y1 = cy + r * Math.sin((Math.PI / 180) * (start - 90));
    const x2 = cx + r * Math.cos((Math.PI / 180) * (end - 90));
    const y2 = cy + r * Math.sin((Math.PI / 180) * (end - 90));

    const ix1 = cx + innerR * Math.cos((Math.PI / 180) * (start - 90));
    const iy1 = cy + innerR * Math.sin((Math.PI / 180) * (start - 90));
    const ix2 = cx + innerR * Math.cos((Math.PI / 180) * (end - 90));
    const iy2 = cy + innerR * Math.sin((Math.PI / 180) * (end - 90));

    const largeArc = sliceAngle > 180 ? 1 : 0;

    slices += `
      <path
        d="M ${ix1} ${iy1}
        L ${x1} ${y1}
        A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix2} ${iy2}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}
        Z"
        fill="${colors[i % colors.length]}">
      </path>
    `;

    legend += `
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:4px;">
        <span style="width:10px;height:10px;background:${colors[i % colors.length]};display:inline-block;"></span>
        <span>${name.split(' ')[0]}: <strong>${pct}%</strong></span>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="display:flex;align-items:center;">
      <svg width="220" height="220" viewBox="0 0 280 220">
        ${slices}
      </svg>
      <div style="padding-left:10px;">
        ${legend}
      </div>
    </div>
  `;
}