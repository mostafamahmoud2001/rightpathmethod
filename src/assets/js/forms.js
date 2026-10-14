// Client-side validation and submission for the Apply and Contact forms.

// ============================================================================
// FORM ENDPOINTS: configure before launch.
// Paste the endpoint URL for each form (e.g. a Formspree form URL such as
// "https://formspree.io/f/abcdwxyz", or another service that accepts a
// multipart POST and answers with a 2xx status).
// While an endpoint is empty, a valid form is NOT sent anywhere and the
// visitor is told so. The site never shows a "sent" message unless the
// endpoint actually accepted the submission.
// ============================================================================
const FORM_ENDPOINTS = {
  apply: '',
  contact: '',
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

(function () {
  document.querySelectorAll('form[data-form]').forEach(setUpForm);

  function setUpForm(form) {
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearStatus(status);

      const errors = validate(form);
      if (errors.length) {
        showStatus(
          status,
          'error',
          `<p><strong>Please fix ${errors.length === 1 ? '1 field' : errors.length + ' fields'}:</strong></p><ul>${errors
            .map((er) => `<li><a href="#${er.id}">${er.label}</a>: ${er.message}</li>`)
            .join('')}</ul>`
        );
        status.focus();
        return;
      }

      const endpoint = FORM_ENDPOINTS[form.dataset.form];
      if (!endpoint) {
        showStatus(
          status,
          'info',
          '<p><strong>Your entries look complete, but this form is not connected yet.</strong> Nothing was sent. This is a draft website; please use the contact details on the Contact page for now.</p>'
        );
        status.focus();
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showStatus(
          status,
          'success',
          form.dataset.form === 'apply'
            ? '<p><strong>Application received.</strong> Thank you. The review team will confirm eligibility and next steps by email.</p>'
            : '<p><strong>Message sent.</strong> Thank you. The certification office will reply by email.</p>'
        );
      } catch (err) {
        showStatus(
          status,
          'error',
          '<p><strong>Your submission could not be sent.</strong> Please try again, or use the contact details on the Contact page.</p>'
        );
      } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        status.focus();
      }
    });

    // Clear a field's error as soon as it is corrected.
    form.addEventListener('input', function (e) {
      const field = e.target;
      if (field.getAttribute('aria-invalid') === 'true' && checkField(field) === '') setError(field, '');
    });
    form.addEventListener('change', function (e) {
      const field = e.target;
      if (field.type === 'radio') {
        form.querySelectorAll(`input[name="${field.name}"]`).forEach((r) => r.removeAttribute('aria-invalid'));
        const err = errorElFor(field);
        if (err) err.textContent = '';
      } else if (field.type === 'file') {
        setError(field, checkField(field));
      }
    });
  }

  function validate(form) {
    const errors = [];
    const seenRadio = new Set();
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (field.type === 'radio') {
        if (seenRadio.has(field.name)) return;
        seenRadio.add(field.name);
      }
      const message = checkField(field);
      setError(field, message);
      if (message) errors.push({ id: field.id || firstRadio(field).id, label: labelText(field), message });
    });
    return errors;
  }

  function checkField(field) {
    if (field.type === 'radio') {
      const group = field.form.querySelectorAll(`input[name="${field.name}"]`);
      const required = Array.from(group).some((r) => r.required);
      return required && !Array.from(group).some((r) => r.checked) ? 'Choose one option.' : '';
    }
    if (field.type === 'file') {
      const file = field.files && field.files[0];
      return file && file.size > MAX_FILE_BYTES ? 'File is larger than 10 MB.' : '';
    }
    const value = field.value.trim();
    if (field.required && !value) return 'This field is required.';
    if (field.type === 'email' && value && !EMAIL_RE.test(value)) return 'Enter a valid email address, like name@example.org.';
    return '';
  }

  function setError(field, message) {
    if (field.type === 'radio') {
      field.form.querySelectorAll(`input[name="${field.name}"]`).forEach(function (r) {
        if (message) r.setAttribute('aria-invalid', 'true');
        else r.removeAttribute('aria-invalid');
      });
    } else if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
    const err = errorElFor(field);
    if (!err) return;
    err.textContent = message;
    if (field.type !== 'radio') {
      const ids = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      if (message) ids.add(err.id);
      else ids.delete(err.id);
      if (ids.size) field.setAttribute('aria-describedby', Array.from(ids).join(' '));
      else field.removeAttribute('aria-describedby');
    }
  }

  function errorElFor(field) {
    const container = field.closest('.field');
    return container ? container.querySelector('.field-error') : null;
  }

  function firstRadio(field) {
    return field.form.querySelector(`input[name="${field.name}"]`);
  }

  function labelText(field) {
    if (field.type === 'radio') {
      const legend = field.closest('fieldset')?.querySelector('legend');
      return legend ? legend.textContent.replace('*', '').trim() : field.name;
    }
    const label = field.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }

  function showStatus(el, kind, html) {
    el.dataset.kind = kind;
    el.innerHTML = html;
  }
  function clearStatus(el) {
    delete el.dataset.kind;
    el.innerHTML = '';
  }
})();
