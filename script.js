// FullCycle Property Care — interactive bits
// 1) Live pricing calculator   2) Booking form confirmation   3) Footer year stamp

document.addEventListener('DOMContentLoaded', () => {

  // ===== 1. CALCULATOR =====
  // GTA 2026 base prices for a medium yard. Small × 0.8, large × 1.4. Rounded to nearest $5.
  // Each service uses its own pricing model — lawn is recurring monthly, leaves is per-cleanup,
  // snow is either seasonal flat-rate or per-visit. We render a breakdown, not a single total,
  // because the units differ ($/mo vs $/season vs flat job).
  const SIZE_MULT     = { small: 0.8, medium: 1.0, large: 1.4 };
  const DRIVEWAY_MULT = { single: 0.8, double: 1.0, triple: 1.35, extra: 1.6 };
  const DRIVEWAY_LABEL = {
    single: 'single-car driveway',
    double: 'double-car driveway',
    triple: 'triple-car or long driveway',
    extra:  'extra-wide driveway (4+ cars across)'
  };

  const PRICING = {
    lawn: {
      weekly:   { base: 180, unit: '/mo',     desc: 'weekly mowing through the season' },
      biweekly: { base: 110, unit: '/mo',     desc: 'bi-weekly mowing through the season' },
      onetime:  { base: 60,  unit: '',        desc: 'one-time mow' }
    },
    leaves: {
      one: { base: 225, unit: '', desc: '1 full property cleanup, late fall' },
      two: { base: 390, unit: '', desc: '2 cleanups (early + late fall)' }
    },
    snow: {
      seasonal: { base: 600, unit: ' / season', desc: 'unlimited visits, Nov–Apr' },
      pervisit: { base: 55,  unit: ' / visit',  desc: 'pay only when we plow' }
    }
  };

  const SERVICES = [
    { key: 'lawn',   name: 'Lawn mowing'  },
    { key: 'leaves', name: 'Leaf cleanup' },
    { key: 'snow',   name: 'Snow removal' }
  ];

  const sizeEl      = document.getElementById('calc-size');
  const breakdownEl = document.getElementById('calc-breakdown');
  const emptyEl     = document.getElementById('calc-empty');

  const round5 = n => Math.round(n / 5) * 5;

  function getServiceState(key) {
    const checkEl = document.getElementById('svc-' + key);
    const modeEl  = document.getElementById('mode-' + key);
    return { checkEl, modeEl };
  }

  const drivewayEl = document.getElementById('size-snow');

  function updatePrice() {
    const yardMult = SIZE_MULT[sizeEl.value] || 1;
    const drivewayMult = DRIVEWAY_MULT[drivewayEl.value] || 1;
    breakdownEl.innerHTML = '';
    let anyChecked = false;

    SERVICES.forEach(svc => {
      const { checkEl, modeEl } = getServiceState(svc.key);
      const isSnow = svc.key === 'snow';
      modeEl.disabled = !checkEl.checked;
      if (isSnow) drivewayEl.disabled = !checkEl.checked;
      if (!checkEl.checked) return;

      anyChecked = true;
      const cfg = PRICING[svc.key][modeEl.value];
      const mult = isSnow ? drivewayMult : yardMult;
      const price = round5(cfg.base * mult);
      const desc = isSnow ? cfg.desc + ' · ' + DRIVEWAY_LABEL[drivewayEl.value] : cfg.desc;

      const li = document.createElement('li');
      li.className = 'breakdown-row';
      li.innerHTML =
        '<div class="b-text">' +
          '<span class="b-service">' + svc.name + '</span>' +
          '<span class="b-desc">' + desc + '</span>' +
        '</div>' +
        '<span class="b-price">$' + price + '<span class="b-unit">' + cfg.unit + '</span></span>';
      breakdownEl.appendChild(li);
    });

    emptyEl.hidden = anyChecked;
  }

  // Track whether the customer actually interacted with the calculator. If they didn't,
  // we skip the calculator fields in the email so defaults don't masquerade as customer input.
  let calculatorTouched = false;
  const markTouched = () => { calculatorTouched = true; };

  sizeEl.addEventListener('change', updatePrice);
  drivewayEl.addEventListener('change', updatePrice);
  sizeEl.addEventListener('change', markTouched);
  drivewayEl.addEventListener('change', markTouched);
  SERVICES.forEach(svc => {
    const { checkEl, modeEl } = getServiceState(svc.key);
    checkEl.addEventListener('change', updatePrice);
    modeEl.addEventListener('change', updatePrice);
    checkEl.addEventListener('change', markTouched);
    modeEl.addEventListener('change', markTouched);
  });
  updatePrice();

  // ===== 2. BOOKING FORM =====
  const form = document.getElementById('booking-form');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Show the matching follow-up dropdowns based on which service the customer picked.
  // Each service gets a Plan dropdown plus a Size dropdown (yard for lawn/leaf, driveway for snow).
  const formServiceEl   = document.getElementById('form-service');
  const formPlanRow     = document.getElementById('form-plan-row');
  const formPlanEl      = document.getElementById('form-plan');
  const formDrivewayRow = document.getElementById('form-driveway-row');
  const formDrivewayEl  = document.getElementById('form-driveway');
  const formYardRow     = document.getElementById('form-yard-row');
  const formYardEl      = document.getElementById('form-yard');
  const SNOW_SERVICES = new Set(['Snow removal']);
  const YARD_SERVICES = new Set(['Lawn mowing', 'Leaf cleanup']);

  const PLAN_OPTIONS = {
    'Lawn mowing': [
      { value: 'weekly',   label: 'Weekly (recurring)' },
      { value: 'biweekly', label: 'Bi-weekly (recurring)' },
      { value: 'onetime',  label: 'One-time visit' }
    ],
    'Leaf cleanup': [
      { value: 'one', label: '1 full cleanup (late fall)' },
      { value: 'two', label: '2 cleanups (early + late fall)' }
    ],
    'Snow removal': [
      { value: 'seasonal', label: 'Seasonal flat-rate (Nov–Apr, unlimited)' },
      { value: 'pervisit', label: 'Per-visit (only pay when we plow)' }
    ]
  };

  function toggleFollowup(rowEl, selectEl, show) {
    rowEl.hidden = !show;
    if (show) {
      selectEl.setAttribute('required', '');
    } else {
      selectEl.removeAttribute('required');
      selectEl.value = '';
    }
  }
  function syncFormFollowups() {
    const svc = formServiceEl.value;
    const opts = PLAN_OPTIONS[svc];
    if (opts) {
      formPlanEl.innerHTML = '<option value="">Select plan…</option>' +
        opts.map(o => '<option value="' + o.value + '">' + o.label + '</option>').join('');
    }
    toggleFollowup(formPlanRow,     formPlanEl,     !!opts);
    toggleFollowup(formDrivewayRow, formDrivewayEl, SNOW_SERVICES.has(svc));
    toggleFollowup(formYardRow,     formYardEl,     YARD_SERVICES.has(svc));
  }
  formServiceEl.addEventListener('change', syncFormFollowups);
  syncFormFollowups();

  // When the customer clicks "Book My Free On-Site Visit" inside the calculator,
  // pre-fill the booking form's service + size so they don't have to repeat themselves.
  // Only auto-fills when exactly one service is checked in the calculator.
  const bookFromCalcBtn = document.querySelector('.calc-result a[href="#book"]');
  const SERVICE_LABEL = { lawn: 'Lawn mowing', leaves: 'Leaf cleanup', snow: 'Snow removal' };
  if (bookFromCalcBtn) {
    bookFromCalcBtn.addEventListener('click', () => {
      const checked = SERVICES.filter(svc => document.getElementById('svc-' + svc.key).checked);
      if (checked.length !== 1) return;
      const svc = checked[0];
      formServiceEl.value = SERVICE_LABEL[svc.key];
      syncFormFollowups();
      const calcMode = document.getElementById('mode-' + svc.key).value;
      if (calcMode) formPlanEl.value = calcMode;
      if (svc.key === 'snow' && drivewayEl.value) {
        formDrivewayEl.value = drivewayEl.value;
      } else if ((svc.key === 'lawn' || svc.key === 'leaves') && sizeEl.value) {
        formYardEl.value = sizeEl.value;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = '#d14';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const sizeLabels = {
      small: 'Small (under 2,000 sq ft)',
      medium: 'Medium (2,000–5,000 sq ft)',
      large: 'Large (5,000+ sq ft)'
    };
    const drivewayDisplay = {
      single: 'Single-car driveway',
      double: 'Double-car driveway',
      triple: 'Triple-car or long driveway',
      extra:  'Extra-wide (4+ cars across)'
    };

    // Build a clean JSON payload for our serverless function — only filled fields.
    // _honey is a hidden honeypot: real users leave it empty, bots fill it.
    const payload = {
      _honey:  (form.querySelector('[name="_honey"]') || {}).value || '',
      name:    form.elements['name'].value.trim(),
      email:   form.elements['email'].value.trim(),
      phone:   form.elements['phone'].value.trim(),
      address: form.elements['address'].value.trim()
    };

    const service = formServiceEl.value;
    payload.service = service;

    // Show only the price the customer actually picked (one specific plan + size).
    const planKey = formPlanEl.value;
    const planLabel = (PLAN_OPTIONS[service] || []).find(o => o.value === planKey);

    if (YARD_SERVICES.has(service) && formYardEl.value && planKey) {
      const k = formYardEl.value;
      payload.yard = sizeLabels[k];
      if (planLabel) payload.plan = planLabel.label;
      const cfg = PRICING[service === 'Lawn mowing' ? 'lawn' : 'leaves'][planKey];
      if (cfg) payload.price = '$' + round5(cfg.base * SIZE_MULT[k]) + (cfg.unit || '');
    }
    if (SNOW_SERVICES.has(service) && formDrivewayEl.value && planKey) {
      const k = formDrivewayEl.value;
      payload.driveway = drivewayDisplay[k];
      if (planLabel) payload.plan = planLabel.label;
      const cfg = PRICING.snow[planKey];
      if (cfg) payload.price = '$' + round5(cfg.base * DRIVEWAY_MULT[k]) + cfg.unit;
    }

    const note = form.elements['message'].value.trim();
    if (note) payload.notes = note;

    // Calculator data — only attach if the customer engaged with it AND configured services.
    if (calculatorTouched) {
      const yardMult = SIZE_MULT[sizeEl.value] || 1;
      const drivewayMult = DRIVEWAY_MULT[drivewayEl.value] || 1;
      const lines = [];
      SERVICES.forEach(svc => {
        const { checkEl, modeEl } = getServiceState(svc.key);
        if (!checkEl.checked) return;
        const isSnow = svc.key === 'snow';
        const cfg = PRICING[svc.key][modeEl.value];
        const price = round5(cfg.base * (isSnow ? drivewayMult : yardMult));
        const desc = isSnow ? cfg.desc + ' · ' + DRIVEWAY_LABEL[drivewayEl.value] : cfg.desc;
        lines.push(svc.name + ' $' + price + cfg.unit + ' (' + desc + ')');
      });
      if (lines.length) payload.calculator = lines.join('  ·  ');
    }

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const confirmation = document.createElement('div');
        confirmation.className = 'form-confirmation';
        confirmation.innerHTML = `
          <h3>Thanks — we got it.</h3>
          <p>We'll be in touch within an hour to schedule your free on-site visit.</p>
          <p>Need us sooner? Call <a href="tel:4373182562">437-318-2562</a>.</p>
        `;
        form.replaceWith(confirmation);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      let errorEl = form.querySelector('.form-error');
      if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error';
        errorEl.style.color = '#d14';
        errorEl.style.marginTop = '0.5rem';
        submitBtn.insertAdjacentElement('afterend', errorEl);
      }
      errorEl.textContent = "Something went wrong — please call us at 437-318-2562 or email info@fullcyclecare.ca.";
    }
  });

  // ===== 3. FOOTER YEAR =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== 3b. MOBILE NAV TOGGLE =====
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // ===== 5. WORK CAROUSEL =====
  // "Our work" shows 3 photos per slide on desktop, 1 on mobile.
  // Arrows + dots move a whole page at a time; layout recalculates on resize.
  const wcTrack = document.getElementById('work-track');
  if (wcTrack) {
    const wcViewport = wcTrack.parentElement;
    const wcPrev = document.getElementById('work-prev');
    const wcNext = document.getElementById('work-next');
    const wcDots = document.getElementById('work-dots');
    const cardCount = wcTrack.children.length;
    const GAP = 16;
    let index = 0;
    let pages = 1;

    const perView = () => (window.innerWidth <= 860 ? 1 : 3);

    function render() {
      const shift = index * (wcViewport.clientWidth + GAP);
      wcTrack.style.transform = 'translateX(' + (-shift) + 'px)';
      Array.from(wcDots.children).forEach((d, i) =>
        d.classList.toggle('is-active', i === index));
    }

    function layout() {
      pages = Math.ceil(cardCount / perView());
      if (index > pages - 1) index = pages - 1;
      wcDots.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'work-dot' + (i === index ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to photo set ' + (i + 1));
        dot.addEventListener('click', () => { index = i; render(); });
        wcDots.appendChild(dot);
      }
      render();
    }

    wcPrev.addEventListener('click', () => { index = (index - 1 + pages) % pages; render(); });
    wcNext.addEventListener('click', () => { index = (index + 1) % pages; render(); });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    layout();
  }

  // ===== 4. SYNC SERVICE-CARD DROPDOWNS =====
  // Click any "Learn More" → all three open/close together.
  const serviceDetails = document.querySelectorAll('.service-info');
  let syncingDetails = false;
  serviceDetails.forEach(details => {
    details.addEventListener('toggle', () => {
      if (syncingDetails) return;
      syncingDetails = true;
      const isOpen = details.open;
      serviceDetails.forEach(other => {
        if (other !== details) other.open = isOpen;
      });
      syncingDetails = false;
    });
  });
});
