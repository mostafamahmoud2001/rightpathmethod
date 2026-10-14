// Site-wide behaviour: mobile nav toggle and small button helpers.
(function () {
  document.documentElement.classList.add('js');

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.hidden = false;
    nav.dataset.collapsed = 'true';
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.dataset.collapsed = String(open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        nav.dataset.collapsed = 'true';
        toggle.focus();
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-print]')) window.print();
  });
})();
