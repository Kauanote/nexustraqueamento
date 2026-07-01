(function () {
  'use strict';

  var DAYS = 30;
  var BASE_REVENUE = 85000;
  var MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var PAYMENT_METHODS = ['PIX', 'Cartão', 'Saldo', 'Boleto'];
  var PAYMENT_WEIGHTS = [0.42, 0.31, 0.17, 0.10];
  var DEPOSIT_AMOUNTS = [15, 50, 100];
  var DEPOSIT_NAMES = [
    'Ana Silva', 'Bruno Santos', 'Carla Oliveira', 'Diego Souza', 'Elena Lima',
    'Felipe Costa', 'Gabriela Ferreira', 'Henrique Almeida', 'Isabela Pereira', 'João Rodrigues',
    'Karina Martins', 'Lucas Barbosa', 'Marina Rocha', 'Nicolas Gomes', 'Olívia Dias'
  ];

  var EDIT_CONFIG = {
    revenue: {
      title: 'Editar Faturamento',
      label: 'Faturamento Total',
      hint: 'Recalcula toda a dashboard. Use formato: 133.874,90',
      currency: true,
      decimals: true,
      fullRecalc: true,
      min: 1000
    },
    users: {
      title: 'Editar Usuários',
      label: 'Total de Usuários',
      hint: 'Altera apenas este valor. Ex: 3.250',
      currency: false,
      decimals: false,
      fullRecalc: false,
      min: 1
    },
    profit: {
      title: 'Editar Lucro Líquido',
      label: 'Lucro Líquido',
      hint: 'Altera apenas este valor. Ex: 58.700,00',
      currency: true,
      decimals: true,
      fullRecalc: false,
      min: 1
    },
    transactions: {
      title: 'Editar Transações',
      label: 'Total de Transações',
      hint: 'Altera apenas este valor. Ex: 3.248',
      currency: false,
      decimals: false,
      fullRecalc: false,
      min: 1
    },
    ticket: {
      title: 'Editar Ticket Médio',
      label: 'Ticket Médio',
      hint: 'Altera apenas este valor. Ex: 26,15',
      currency: true,
      decimals: true,
      fullRecalc: false,
      min: 0.01
    },
    revenueDay: {
      title: 'Editar Receita/dia',
      label: 'Receita por dia',
      hint: 'Altera apenas este valor. Ex: 2.833,33',
      currency: true,
      decimals: true,
      fullRecalc: false,
      min: 0.01
    },
    activeUsers: {
      title: 'Editar Usuários Ativos',
      label: 'Usuários Ativos',
      hint: 'Altera apenas este valor. Ex: 2.080',
      currency: false,
      decimals: false,
      fullRecalc: false,
      min: 1
    },
    deposit: {
      title: 'Editar Valor do Depósito',
      label: 'Valor do depósito',
      hint: 'Altera apenas este depósito. Ex: 15,00 ou 50,00 ou 100,00',
      currency: true,
      decimals: true,
      fullRecalc: false,
      min: 0.01
    },
    'trend-users': {
      title: 'Editar Tendência — Usuários',
      label: 'Crescimento (%)',
      hint: 'Altera apenas este percentual. Ex: 12,4',
      currency: false,
      decimals: true,
      fullRecalc: false,
      isTrend: true,
      min: 0
    },
    'trend-revenue': {
      title: 'Editar Tendência — Faturamento',
      label: 'Crescimento (%)',
      hint: 'Altera apenas este percentual. Ex: 8,7',
      currency: false,
      decimals: true,
      fullRecalc: false,
      isTrend: true,
      min: 0
    },
    'trend-profit': {
      title: 'Editar Tendência — Lucro',
      label: 'Crescimento (%)',
      hint: 'Altera apenas este percentual. Ex: 9,2',
      currency: false,
      decimals: true,
      fullRecalc: false,
      isTrend: true,
      min: 0
    },
    'trend-transactions': {
      title: 'Editar Tendência — Transações',
      label: 'Crescimento (%)',
      hint: 'Altera apenas este percentual. Ex: 6,1',
      currency: false,
      decimals: true,
      fullRecalc: false,
      isTrend: true,
      min: 0
    }
  };

  var state = {
    revenue: BASE_REVENUE,
    users: 3250,
    profit: 58700,
    transactions: 3248,
    ticketMedio: null,
    revenueDay: null,
    activeUsers: null,
    deposits: null,
    selectedMonth: 5,
    year: 2026,
    trends: {
      users: 12.4,
      revenue: 8.7,
      profit: 9.2,
      transactions: 6.1
    }
  };

  var dailyPattern = [];
  var charts = {};
  var currentEditType = null;
  var currentDepositIndex = null;

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function parseBrazilianNumber(str) {
    if (str === null || str === undefined || str === '') return NaN;
    var s = String(str).trim().replace(/\s/g, '').replace(/^R\$\s?/i, '');
    if (!s) return NaN;
    if (s.indexOf(',') !== -1) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/\./g, '');
    }
    var num = parseFloat(s);
    return isNaN(num) ? NaN : num;
  }

  function formatCurrency(value, withDecimals) {
    var opts = withDecimals !== false
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumFractionDigits: 0 };
    return 'R$ ' + Number(value).toLocaleString('pt-BR', opts);
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('pt-BR');
  }

  function formatTrend(value) {
    return '+' + Number(value).toFixed(1).replace('.', ',') + '%';
  }

  function formatForInput(value, config) {
    if (config.isTrend) {
      return Number(value).toFixed(1).replace('.', ',');
    }
    if (config.currency && config.decimals) {
      return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (config.currency) {
      return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }
    return Math.round(value).toLocaleString('pt-BR');
  }

  function getValueForEdit(type) {
    if (type.indexOf('trend-') === 0) {
      var key = type.replace('trend-', '');
      return state.trends[key];
    }
    if (type === 'ticket') return state.ticketMedio !== null ? state.ticketMedio : state.revenue / state.transactions;
    if (type === 'revenueDay') return state.revenueDay !== null ? state.revenueDay : state.revenue / DAYS;
    if (type === 'activeUsers') return state.activeUsers !== null ? state.activeUsers : Math.round(state.users * 0.64);
    return state[type];
  }

  function getThemeColors() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      grid: dark ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.2)',
      text: dark ? '#64748b' : '#94a3b8',
      tooltipBg: dark ? '#1e2433' : '#0f172a',
      tooltipText: '#f8fafc'
    };
  }

  function createGradient(ctx, colorStart, colorEnd, height) {
    var gradient = ctx.createLinearGradient(0, 0, 0, height || 300);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }

  function generateDailyPattern(monthSeed) {
    var pattern = [];
    for (var d = 1; d <= DAYS; d++) {
      var weekday = new Date(state.year, monthSeed, d).getDay();
      var isWeekend = weekday === 0 || weekday === 6;
      var base = isWeekend ? 0.72 : 1.0;
      var wave = Math.sin((d / DAYS) * Math.PI * 2.3) * 0.18;
      var spike = d === 15 ? 0.35 : d === 28 ? 0.28 : 0;
      var dip = d === 8 ? -0.15 : d === 22 ? -0.12 : 0;
      var noise = (seededRandom(d * 17 + 3 + monthSeed * 100) - 0.5) * 0.22;
      pattern.push(Math.max(0.35, base + wave + spike + dip + noise));
    }
    return pattern;
  }

  function distributeRevenue(total) {
    var sum = dailyPattern.reduce(function (a, b) { return a + b; }, 0);
    var raw = dailyPattern.map(function (w, i) {
      return (w / sum) * total + seededRandom(i * 31 + 7 + state.selectedMonth * 50) * (total / DAYS) * 0.08;
    });
    var rawSum = raw.reduce(function (a, b) { return a + b; }, 0);
    var scale = total / rawSum;
    var result = raw.map(function (v, i) {
      return Math.round(v * scale + seededRandom(i * 13 + state.selectedMonth) * 47);
    });
    result[14] += total - result.reduce(function (a, b) { return a + b; }, 0);
    return result;
  }

  function distributeUsers(total) {
    var weights = [];
    for (var d = 1; d <= DAYS; d++) {
      weights.push(0.8 + seededRandom(d * 23 + state.selectedMonth * 30) * 0.6 + (d % 7 === 0 ? 0.3 : 0));
    }
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var raw = weights.map(function (w) { return Math.max(1, Math.round((w / sum) * total)); });
    raw[0] += total - raw.reduce(function (a, b) { return a + b; }, 0);
    return raw;
  }

  function distributeProfit(totalProfit, dailyRevenue) {
    var revSum = dailyRevenue.reduce(function (a, b) { return a + b; }, 0);
    var raw = dailyRevenue.map(function (v) { return Math.round((v / revSum) * totalProfit); });
    raw[14] += totalProfit - raw.reduce(function (a, b) { return a + b; }, 0);
    return raw;
  }

  function computeDerived(revenue) {
    var ratio = revenue / BASE_REVENUE;
    var monthFactor = 0.85 + seededRandom(state.selectedMonth * 77) * 0.3;
    var dailyRevenue = distributeRevenue(revenue);
    var users = Math.round(3250 * Math.pow(ratio, 0.72) * monthFactor);
    var transactions = Math.round(revenue / (26.15 * Math.pow(ratio, -0.08)));
    var profit = Math.round(revenue * (0.69 + seededRandom(revenue + state.selectedMonth) * 0.04));
    var signups = Math.round(users * 0.38);

    var paymentTotals = PAYMENT_WEIGHTS.map(function (w, i) {
      return Math.max(0.05, w + (seededRandom(revenue + i * 11 + state.selectedMonth) - 0.5) * 0.04);
    });
    var paySum = paymentTotals.reduce(function (a, b) { return a + b; }, 0);
    var paymentPercents = paymentTotals.map(function (p) { return Math.round((p / paySum) * 1000) / 10; });
    paymentPercents[0] += 100 - paymentPercents.reduce(function (a, b) { return a + b; }, 0);

    return {
      users: users,
      profit: profit,
      transactions: transactions,
      dailyRevenue: dailyRevenue,
      dailyProfit: distributeProfit(profit, dailyRevenue),
      dailyUsers: distributeUsers(signups),
      paymentPercents: paymentPercents,
      trends: {
        users: 12.4 + (ratio - 1) * 8,
        revenue: 8.7 + (ratio - 1) * 12 + seededRandom(revenue * 3) * 2,
        profit: 9.2 + (ratio - 1) * 10,
        transactions: 6.1 + (ratio - 1) * 7
      }
    };
  }

  function getMetrics() {
    var derived = computeDerived(state.revenue);
    return {
      revenue: state.revenue,
      users: state.users,
      profit: state.profit,
      transactions: state.transactions,
      ticketMedio: state.ticketMedio !== null ? state.ticketMedio : state.revenue / state.transactions,
      revenueDay: state.revenueDay !== null ? state.revenueDay : state.revenue / DAYS,
      activeUsers: state.activeUsers !== null ? state.activeUsers : Math.round(state.users * 0.64),
      dailyRevenue: derived.dailyRevenue,
      dailyProfit: distributeProfit(state.profit, derived.dailyRevenue),
      dailyUsers: distributeUsers(Math.round(state.users * 0.38)),
      paymentPercents: derived.paymentPercents,
      trends: state.trends
    };
  }

  function setElValue(el, value, mode) {
    if (!el) return;
    el.dataset.value = value;
    if (mode === 'currency') el.textContent = formatCurrency(value);
    else if (mode === 'number') el.textContent = formatNumber(value);
    else if (mode === 'trend') el.textContent = formatTrend(value);
  }

  function animateValue(el, end, mode) {
    if (!el) return;
    var start = parseFloat(el.dataset.value) || 0;
    var duration = 700;
    var startTime = performance.now();

    function tick(now) {
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (end - start) * eased;
      if (mode === 'currency') el.textContent = formatCurrency(current);
      else if (mode === 'number') el.textContent = formatNumber(current);
      else if (mode === 'trend') el.textContent = formatTrend(current);
      if (progress < 1) requestAnimationFrame(tick);
      else setElValue(el, end, mode);
    }
    requestAnimationFrame(tick);
  }

  function getMonthLabel() { return MONTH_NAMES[state.selectedMonth]; }
  function getMonthShort() { return getMonthLabel().substring(0, 3) + '/' + state.year; }
  function getMonthDatePrefix() { return String(state.selectedMonth + 1).padStart(2, '0'); }

  function updatePeriodLabels() {
    var name = getMonthLabel();
    var prefix = getMonthDatePrefix();
    document.getElementById('period-label').textContent = name;
    document.getElementById('page-subtitle').textContent = 'Visão geral — ' + name + ' ' + state.year;
    document.getElementById('chart-badge').textContent = getMonthShort();
    document.getElementById('users-sub').textContent = 'Total acumulado em ' + name;
    document.getElementById('revenue-sub').textContent = 'Período: 01/' + prefix + ' — 30/' + prefix;
    document.getElementById('tx-sub').textContent = 'Aprovadas em ' + name;
  }

  function shuffleArray(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function formatDateTime(d) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function generateDeposits() {
    var names = shuffleArray(DEPOSIT_NAMES);
    var now = new Date();
    var times = [new Date(now.getTime())];

    for (var i = 1; i < 15; i++) {
      var gapMs = 50000 + Math.floor(Math.random() * 70001);
      times.push(new Date(times[i - 1].getTime() - gapMs));
    }

    return names.map(function (name, i) {
      return {
        id: 'DEP-' + String(102400 + i * 317).slice(-6),
        user: name,
        value: DEPOSIT_AMOUNTS[Math.floor(Math.random() * DEPOSIT_AMOUNTS.length)],
        method: 'PIX',
        status: 'Aprovado',
        statusCls: 'approved',
        date: formatDateTime(times[i])
      };
    });
  }

  function generateActivity(metrics) {
    var now = new Date();
    return [
      { text: 'Novo usuário cadastrado', dot: 'blue', time: formatDateTime(new Date(now.getTime() - 45000)) },
      { text: 'Depósito confirmado — ' + formatCurrency(50), dot: 'green', time: formatDateTime(new Date(now.getTime() - 120000)) },
      { text: 'Pagamento aprovado via PIX', dot: 'green', time: formatDateTime(new Date(now.getTime() - 195000)) },
      { text: 'Saque realizado — ' + formatCurrency(100), dot: 'orange', time: formatDateTime(new Date(now.getTime() - 310000)) },
      { text: 'Usuário VIP — plano Premium', dot: 'purple', time: formatDateTime(new Date(now.getTime() - 420000)) },
      { text: 'Transação processada — Cartão', dot: 'blue', time: formatDateTime(new Date(now.getTime() - 540000)) },
      { text: 'Novo cadastro via referral', dot: 'blue', time: formatDateTime(new Date(now.getTime() - 660000)) },
      { text: 'Depósito confirmado — Boleto', dot: 'green', time: formatDateTime(new Date(now.getTime() - 780000)) }
    ];
  }

  function renderCards(m, animate) {
    var items = [
      { id: 'card-users', value: m.users, mode: 'number' },
      { id: 'card-revenue', value: m.revenue, mode: 'currency' },
      { id: 'card-profit', value: m.profit, mode: 'currency' },
      { id: 'card-transactions', value: m.transactions, mode: 'number' },
      { id: 'stat-ticket', value: m.ticketMedio, mode: 'currency' },
      { id: 'stat-revenue-day', value: m.revenueDay, mode: 'currency' },
      { id: 'stat-active', value: m.activeUsers, mode: 'number' },
      { id: 'trend-users', value: m.trends.users, mode: 'trend' },
      { id: 'trend-revenue', value: m.trends.revenue, mode: 'trend' },
      { id: 'trend-profit', value: m.trends.profit, mode: 'trend' },
      { id: 'trend-transactions', value: m.trends.transactions, mode: 'trend' }
    ];

    items.forEach(function (item) {
      var el = document.getElementById(item.id);
      if (!el) return;
      if (animate) animateValue(el, item.value, item.mode);
      else setElValue(el, item.value, item.mode);
    });
  }

  function renderTable(deposits) {
    document.getElementById('transactions-body').innerHTML = deposits.map(function (tx, i) {
      return '<tr><td>' + tx.id + '</td><td>' + tx.user + '</td><td class="editable deposit-value" data-edit="deposit" data-index="' + i + '" data-value="' + tx.value + '">' + formatCurrency(tx.value) +
        '</td><td>' + tx.method + '</td><td><span class="status-badge ' + tx.statusCls + '">' + tx.status +
        '</span></td><td>' + tx.date + '</td></tr>';
    }).join('');
  }

  function renderTimeline(events) {
    document.getElementById('activity-timeline').innerHTML = events.map(function (ev) {
      return '<li><span class="timeline-dot ' + ev.dot + '"></span><div class="timeline-content"><strong>' +
        ev.text + '</strong><span>' + ev.time + '</span></div></li>';
    }).join('');
  }

  function getDayLabels() {
    return Array.from({ length: DAYS }, function (_, i) { return String(i + 1).padStart(2, '0'); });
  }

  function buildChartOptions(extra) {
    var colors = getThemeColors();
    var base = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 12,
          cornerRadius: 8,
          displayColors: false
        }
      },
      animation: { duration: 900, easing: 'easeOutQuart' }
    };
    if (extra) Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  function getScaleOptions(formatY) {
    var colors = getThemeColors();
    return {
      x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 12, color: colors.text, font: { size: 11 } } },
      y: { grid: { color: colors.grid }, border: { display: false }, ticks: { color: colors.text, font: { size: 11 }, padding: 8, callback: formatY } }
    };
  }

  function initCharts() {
    var labels = getDayLabels();
    var m = getMetrics();
    var revCtx = document.getElementById('chart-revenue').getContext('2d');
    var profitCtx = document.getElementById('chart-profit').getContext('2d');
    var usersCtx = document.getElementById('chart-users').getContext('2d');
    var colors = getThemeColors();

    charts.revenue = new Chart(revCtx, {
      type: 'line',
      data: { labels: labels, datasets: [{ data: m.dailyRevenue, borderColor: '#3b82f6', backgroundColor: createGradient(revCtx, 'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.02)', 320), fill: true, tension: 0.45, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6 }] },
      options: buildChartOptions({ scales: getScaleOptions(function (v) { return formatCurrency(v, false); }) })
    });

    charts.profit = new Chart(profitCtx, {
      type: 'line',
      data: { labels: labels, datasets: [{ data: m.dailyProfit, borderColor: '#10b981', backgroundColor: createGradient(profitCtx, 'rgba(16,185,129,0.35)', 'rgba(16,185,129,0.02)', 280), fill: true, tension: 0.45, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 }] },
      options: buildChartOptions({ scales: getScaleOptions(function (v) { return formatCurrency(v, false); }) })
    });

    charts.users = new Chart(usersCtx, {
      type: 'bar',
      data: { labels: labels, datasets: [{ data: m.dailyUsers, backgroundColor: createGradient(usersCtx, 'rgba(99,102,241,0.95)', 'rgba(59,130,246,0.45)', 280), borderRadius: 6, maxBarThickness: 14 }] },
      options: buildChartOptions({ scales: getScaleOptions() })
    });

    charts.payments = new Chart(document.getElementById('chart-payments'), {
      type: 'doughnut',
      data: { labels: PAYMENT_METHODS, datasets: [{ data: m.paymentPercents, backgroundColor: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b'], borderWidth: 0, hoverOffset: 10, spacing: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { padding: 18, usePointStyle: true, color: colors.text } }, tooltip: { backgroundColor: colors.tooltipBg, callbacks: { label: function (c) { return c.label + ': ' + c.raw + '%'; } } } }, animation: { duration: 900 } }
    });
  }

  function refreshChartTheme() {
    var colors = getThemeColors();
    [charts.revenue, charts.profit, charts.users].forEach(function (chart) {
      if (!chart) return;
      chart.options.scales.x.ticks.color = colors.text;
      chart.options.scales.y.ticks.color = colors.text;
      chart.options.scales.y.grid.color = colors.grid;
      chart.update('none');
    });
    if (charts.payments) {
      charts.payments.options.plugins.legend.labels.color = colors.text;
      charts.payments.update('none');
    }
  }

  function updateCharts(m) {
    charts.revenue.data.datasets[0].data = m.dailyRevenue;
    charts.profit.data.datasets[0].data = m.dailyProfit;
    charts.users.data.datasets[0].data = m.dailyUsers;
    charts.payments.data.datasets[0].data = m.paymentPercents;
    charts.revenue.update('active');
    charts.profit.update('active');
    charts.users.update('active');
    charts.payments.update('active');
  }

  function renderAll(animate, regenDeposits) {
    if (regenDeposits || !state.deposits) state.deposits = generateDeposits();
    var m = getMetrics();
    renderCards(m, animate);
    updateCharts(m);
    renderTable(state.deposits);
    renderTimeline(generateActivity(m));
    updatePeriodLabels();
  }

  function resetDerivedOverrides() {
    state.ticketMedio = null;
    state.revenueDay = null;
    state.activeUsers = null;
  }

  function updateDashboard(newRevenue) {
    if (!newRevenue || newRevenue < 1000) return;
    state.revenue = newRevenue;
    resetDerivedOverrides();
    var derived = computeDerived(newRevenue);
    state.users = derived.users;
    state.profit = derived.profit;
    state.transactions = derived.transactions;
    state.trends = derived.trends;
    renderAll(true);
  }

  function applySingleEdit(type, value) {
    var config = EDIT_CONFIG[type];
    if (!config || isNaN(value)) return;

    if (config.isTrend) {
      state.trends[type.replace('trend-', '')] = value;
      setElValue(document.getElementById(type), value, 'trend');
      return;
    }

    if (type === 'ticket') {
      state.ticketMedio = value;
      setElValue(document.getElementById('stat-ticket'), value, 'currency');
      return;
    }
    if (type === 'revenueDay') {
      state.revenueDay = value;
      setElValue(document.getElementById('stat-revenue-day'), value, 'currency');
      return;
    }
    if (type === 'activeUsers') {
      state.activeUsers = Math.round(value);
      setElValue(document.getElementById('stat-active'), state.activeUsers, 'number');
      return;
    }

    if (type === 'users' || type === 'transactions') {
      state[type] = Math.round(value);
      animateValue(document.getElementById('card-' + type), state[type], 'number');
      if (type === 'transactions' && state.ticketMedio === null) {
        setElValue(document.getElementById('stat-ticket'), state.revenue / state.transactions, 'currency');
      }
      if (type === 'users' && state.activeUsers === null) {
        setElValue(document.getElementById('stat-active'), Math.round(state.users * 0.64), 'number');
      }
      return;
    }

    if (type === 'profit') {
      state.profit = value;
      animateValue(document.getElementById('card-profit'), value, 'currency');
    }
  }

  function openDepositModal(index) {
    if (!state.deposits || !state.deposits[index]) return;
    var config = EDIT_CONFIG.deposit;
    currentEditType = 'deposit';
    currentDepositIndex = index;
    document.getElementById('modal-title').textContent = config.title;
    document.getElementById('edit-label').textContent = config.label;
    document.getElementById('modal-hint').textContent = config.hint;
    document.getElementById('edit-input').value = formatForInput(state.deposits[index].value, config);
    document.getElementById('modal-overlay').classList.add('active');
    setTimeout(function () { document.getElementById('edit-input').select(); document.getElementById('edit-input').focus(); }, 100);
  }

  function openEditModal(type) {
    var config = EDIT_CONFIG[type];
    if (!config) return;
    currentEditType = type;
    document.getElementById('modal-title').textContent = config.title;
    document.getElementById('edit-label').textContent = config.label;
    document.getElementById('modal-hint').textContent = config.hint;
    document.getElementById('edit-input').value = formatForInput(getValueForEdit(type), config);
    document.getElementById('modal-overlay').classList.add('active');
    setTimeout(function () { document.getElementById('edit-input').select(); document.getElementById('edit-input').focus(); }, 100);
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    currentEditType = null;
    currentDepositIndex = null;
  }

  function initEditable() {
    document.querySelectorAll('[data-edit]').forEach(function (el) {
      if (el.getAttribute('data-edit') === 'deposit') return;
      el.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        openEditModal(el.getAttribute('data-edit'));
      });
    });

    document.getElementById('transactions-body').addEventListener('dblclick', function (e) {
      var cell = e.target.closest('[data-edit="deposit"]');
      if (!cell) return;
      e.stopPropagation();
      openDepositModal(parseInt(cell.getAttribute('data-index'), 10));
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    document.getElementById('modal-save').addEventListener('click', function () {
      if (!currentEditType) return;
      var val = parseBrazilianNumber(document.getElementById('edit-input').value);
      if (currentEditType === 'deposit') {
        if (isNaN(val) || val <= 0 || currentDepositIndex === null) return;
        state.deposits[currentDepositIndex].value = val;
        renderTable(state.deposits);
        closeModal();
        return;
      }
      var config = EDIT_CONFIG[currentEditType];
      if (isNaN(val) || val < config.min) return;
      if (config.fullRecalc) updateDashboard(val);
      else applySingleEdit(currentEditType, val);
      closeModal();
    });

    document.getElementById('edit-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('modal-save').click();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function initPeriodSelect() {
    var select = document.getElementById('period-select');
    document.getElementById('period-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      select.classList.toggle('open');
    });
    document.getElementById('period-dropdown').querySelectorAll('li').forEach(function (li) {
      li.addEventListener('click', function () {
        state.selectedMonth = parseInt(li.getAttribute('data-month'), 10);
        document.querySelectorAll('#period-dropdown li').forEach(function (item) { item.classList.remove('active'); });
        li.classList.add('active');
        select.classList.remove('open');
        dailyPattern = generateDailyPattern(state.selectedMonth);
        resetDerivedOverrides();
        var derived = computeDerived(state.revenue);
        state.users = derived.users;
        state.profit = derived.profit;
        state.transactions = derived.transactions;
        state.trends = derived.trends;
        renderAll(true, true);
      });
    });
    document.addEventListener('click', function () { select.classList.remove('open'); });
  }

  function initTheme() {
    var saved = localStorage.getItem('dashboard-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dashboard-theme', next);
      refreshChartTheme();
    });
  }

  function initSidebar() {
    var app = document.getElementById('app');
    if (localStorage.getItem('sidebar-collapsed') === '1') app.classList.add('sidebar-collapsed');
    document.getElementById('sidebar-toggle').addEventListener('click', function () {
      app.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed', app.classList.contains('sidebar-collapsed') ? '1' : '0');
    });
  }

  function init() {
    dailyPattern = generateDailyPattern(state.selectedMonth);
    var derived = computeDerived(BASE_REVENUE);
    state.users = derived.users;
    state.profit = derived.profit;
    state.transactions = derived.transactions;
    state.trends = derived.trends;
    initCharts();
    renderAll(false, true);
    initEditable();
    initPeriodSelect();
    initTheme();
    initSidebar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.updateDashboard = updateDashboard;
})();
