// FullCycle Property Care — interactive bits
// 1) Live pricing calculator   2) Booking form confirmation   3) Footer year stamp

document.addEventListener('DOMContentLoaded', () => {

  // ===== 1. CALCULATOR =====
  // Monthly base prices for recurring service (GTA rates, 2026).
  // Small lawn weekly = $180 × 0.8 × 1.0 = $144/mo (~$36/visit). Bi-weekly = $86/mo (~$43/visit).
  const RECURRING_BASE = { lawn: 180, leaves: 40, snow: 80 };
  // One-time visit base prices (single-visit, no commitment — priced as a one-off premium).
  // Small lawn one-time = $60 × 0.8 = $48 → ~$50. Leaf cleanup is a full-property job in fall/spring.
  const ONETIME_BASE   = { lawn: 60, leaves: 200, snow: 50 };
  const SIZE_MULT      = { small: 0.8, medium: 1.0, large: 1.4 };
  const FREQ_MULT      = { weekly: 1.0, biweekly: 0.6, onetime: 1.0 };

  const sizeEl   = document.getElementById('calc-size');
  const freqEl   = document.getElementById('calc-freq');
  const priceEl  = document.getElementById('calc-price');
  const labelEl  = document.getElementById('calc-label');
  const perEl    = document.getElementById('calc-per');
  const svcLawn  = document.getElementById('svc-lawn');
  const svcLeaf  = document.getElementById('svc-leaves');
  const svcSnow  = document.getElementById('svc-snow');

  function updatePrice() {
    const isOneTime = freqEl.value === 'onetime';
    const bases = isOneTime ? ONETIME_BASE : RECURRING_BASE;

    let total = 0;
    if (svcLawn.checked) total += bases.lawn;
    if (svcLeaf.checked) total += bases.leaves;
    if (svcSnow.checked) total += bases.snow;

    total *= SIZE_MULT[sizeEl.value] || 1;
    total *= FREQ_MULT[freqEl.value] || 1;

    // round to nearest $5
    const rounded = total === 0 ? 0 : Math.round(total / 5) * 5;
    priceEl.textContent = '$' + rounded;

    // swap label + unit so the display matches the pricing model
    if (isOneTime) {
      labelEl.textContent = 'Estimated one-time cost';
      perEl.textContent = '';
    } else {
      labelEl.textContent = 'Estimated monthly cost';
      perEl.textContent = '/mo';
    }
  }

  [sizeEl, freqEl, svcLawn, svcLeaf, svcSnow].forEach(el => {
    el.addEventListener('change', updatePrice);
  });
  updatePrice();

  // ===== 2. BOOKING FORM =====
  const form = document.getElementById('booking-form');
  const submitBtn = form.querySelector('button[type="submit"]');

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
    const freqLabels = {
      weekly: 'Weekly (recurring)',
      biweekly: 'Bi-weekly (recurring)',
      onetime: 'One-time visit'
    };
    const calcServices = [
      svcLawn.checked && 'Lawn mowing',
      svcLeaf.checked && 'Leaf cleanup',
      svcSnow.checked && 'Snow removal'
    ].filter(Boolean).join(', ') || 'None selected';

    const formData = new FormData(form);
    formData.append('Yard size (calculator)', sizeLabels[sizeEl.value] || sizeEl.value);
    formData.append('Services (calculator)', calcServices);
    formData.append('Frequency (calculator)', freqLabels[freqEl.value] || freqEl.value);
    formData.append('Estimated price shown', priceEl.textContent + (perEl.textContent || ''));

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const confirmation = document.createElement('div');
        confirmation.className = 'form-confirmation';
        confirmation.innerHTML = `
          <h3>Thanks — we got it.</h3>
          <p>We'll be in touch within 24 hours to schedule your free on-site visit.</p>
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
