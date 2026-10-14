// Directory: access-code screen (mock), search + filters, and the registry detail view.
(function () {
  const STATUS_OPTIONS = ['Active', 'Pending Renewal', 'Suspended', 'Expired', 'Revoked'];
  const LEVEL_OPTIONS = [
    'RightPath Reviewed™',
    'RightPath Aligned™',
    'RightPath Certified™',
    'RightPath Certified with Distinction™',
  ];
  const FILTER_FIELDS = ['institution', 'program', 'subjectArea', 'level', 'location', 'deliveryFormat', 'status'];
  const GATE_KEY = 'rp-directory-unlocked';

  const gate = document.getElementById('directory-gate');
  const app = document.getElementById('directory-app');
  const gateForm = document.getElementById('gate-form');
  const codeInput = document.getElementById('access-code');
  const codeError = document.getElementById('access-code-error');
  const filters = document.getElementById('directory-filters');
  const results = document.getElementById('directory-results');
  const count = document.getElementById('result-count');
  const dialog = document.getElementById('detail-dialog');

  let records = [];

  // ---- Access-code screen ---------------------------------------------------
  // TODO(access): UI MOCK ONLY. Any 6 digits unlock the page and the data file is public.
  // Replace with a real server-side check before relying on this for access control.
  function unlocked() {
    try {
      return sessionStorage.getItem(GATE_KEY) === '1';
    } catch {
      return false;
    }
  }
  function showApp() {
    gate.hidden = true;
    app.hidden = false;
  }
  if (unlocked()) {
    showApp();
  } else {
    gate.hidden = false;
    app.hidden = true;
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const code = codeInput.value.trim();
    if (!/^\d{6}$/.test(code)) {
      codeError.textContent = 'Enter the 6-digit code (numbers only).';
      codeInput.setAttribute('aria-invalid', 'true');
      codeInput.setAttribute('aria-describedby', 'access-code-error');
      codeInput.focus();
      return;
    }
    try {
      sessionStorage.setItem(GATE_KEY, '1');
    } catch {}
    showApp();
    document.getElementById('directory-search').focus();
  });

  // "Search the Certified Directory" call-to-action
  document.querySelectorAll('[data-focus-search]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const target = app.hidden ? codeInput : document.getElementById('directory-search');
      target.scrollIntoView({ block: 'center' });
      target.focus({ preventScroll: true });
    });
  });

  // ---- Data -----------------------------------------------------------------
  fetch('data/directory.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      records = data.records || [];
      populateFilters();
      render();
    })
    .catch(() => {
      results.innerHTML = '<tr><td colspan="6">The directory could not be loaded. Please try again later.</td></tr>';
      count.textContent = '';
    });

  function populateFilters() {
    FILTER_FIELDS.forEach(function (field) {
      const select = filters.elements[field];
      let values;
      if (field === 'status') values = STATUS_OPTIONS;
      else if (field === 'level') values = LEVEL_OPTIONS;
      else values = Array.from(new Set(records.map((r) => r[field]).filter(Boolean))).sort();
      values.forEach(function (v) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
    });
  }

  function currentMatches() {
    const q = filters.elements.q.value.trim().toLowerCase();
    return records.filter(function (r) {
      for (const field of FILTER_FIELDS) {
        const want = filters.elements[field].value;
        if (want && r[field] !== want) return false;
      }
      if (!q) return true;
      return [r.institution, r.program, r.subjectArea, r.level, r.location, r.deliveryFormat, r.status, r.id]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }

  function render() {
    const list = currentMatches();
    count.textContent = `${list.length} ${list.length === 1 ? 'listing' : 'listings'} found`;
    if (!list.length) {
      results.innerHTML = '<tr><td colspan="6">No listings match your search. Try clearing a filter.</td></tr>';
      return;
    }
    results.innerHTML = list
      .map(
        (r) => `<tr>
  <th scope="row">${esc(r.institution)}</th>
  <td data-label="Program">${esc(r.program)}</td>
  <td data-label="Certification Level">${esc(r.level)}</td>
  <td data-label="Status"><span class="status-pill">${esc(r.status)}</span></td>
  <td data-label="Renewal Date">${esc(r.renewalDate)}</td>
  <td><button class="link-button" type="button" data-id="${esc(r.id)}">View details<span class="visually-hidden"> for ${esc(r.program)}</span></button></td>
</tr>`
      )
      .join('');
  }

  filters.addEventListener('input', render);
  filters.addEventListener('change', render);
  filters.addEventListener('submit', (e) => e.preventDefault());
  filters.addEventListener('reset', () => setTimeout(render, 0));

  // ---- Detail view ----------------------------------------------------------
  results.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const r = records.find((x) => x.id === btn.dataset.id);
    if (r) openDetail(r, btn);
  });

  let returnFocus = null;
  function openDetail(r, opener) {
    returnFocus = opener;
    const ph = new Set(r._placeholderFields || []);
    const mark = (field) => (ph.has(field) ? ' <span class="ph-badge">Placeholder</span>' : '');
    document.getElementById('detail-title').textContent = r.program;
    document.getElementById('detail-subtitle').textContent = r.institution;
    document.getElementById('detail-body').innerHTML = `
<p><span class="ph-badge">Sample record</span></p>
<dl>
  <dt>Certification scope and approved materials</dt><dd>${esc(r.scope)}${mark('scope')}</dd>
  <dt>Certification level</dt><dd>${esc(r.level)}</dd>
  <dt>Date awarded</dt><dd>${esc(r.dateAwarded)}${mark('dateAwarded')}</dd>
  <dt>Renewal date</dt><dd>${esc(r.renewalDate)}</dd>
  <dt>Current status</dt><dd><span class="status-pill">${esc(r.status)}</span></dd>
  <dt>Provider website</dt><dd><a href="${esc(r.website)}" rel="noopener">${esc(r.website)}</a>${mark('website')}</dd>
  <dt>Program link</dt><dd><a href="${esc(r.programLink)}" rel="noopener">${esc(r.programLink)}</a>${mark('programLink')}</dd>
  <dt>RightPath™ verification number</dt><dd><strong>${esc(r.id)}</strong></dd>
  <dt>Subject area</dt><dd>${esc(r.subjectArea)}${mark('subjectArea')}</dd>
  <dt>Location</dt><dd>${esc(r.location)}${mark('location')}</dd>
  <dt>Delivery format</dt><dd>${esc(r.deliveryFormat)}${mark('deliveryFormat')}</dd>
  <dt>Notes on material changes or review limitations</dt><dd>${esc(r.notes)}${mark('notes')}</dd>
</dl>`;
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  }

  dialog.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') || e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (returnFocus) returnFocus.focus();
  });

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
})();
