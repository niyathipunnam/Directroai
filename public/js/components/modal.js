/* Modal Component */
const Modal = {
  show(title, contentHTML, buttons = []) {
    Modal.close();
    const btns = buttons.map(b =>
      `<button class="btn ${b.cls || 'btn-secondary'}" onclick="${b.onclick}">${b.label}</button>`
    ).join('');

    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.id = 'active-modal';
    el.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="Modal.close()" title="Close">&times;</button>
        </div>
        <div class="modal-body">${contentHTML}</div>
        ${btns ? `<div class="modal-footer">${btns}</div>` : ''}
      </div>`;

    // Click outside to close
    el.addEventListener('click', e => {
      if (e.target === el) Modal.close();
    });

    document.getElementById('modal-container').appendChild(el);
  },

  close() {
    const existing = document.getElementById('active-modal');
    if (existing) existing.remove();
  },

  confirm(title, message, onConfirm, confirmLabel = 'Confirm', confirmCls = 'btn-primary') {
    Modal._confirmCb = onConfirm;
    Modal.show(title, `<p style="color:var(--text-muted);font-size:14px;margin:0;">${message}</p>`, [
      { label: 'Cancel', cls: 'btn-secondary', onclick: 'Modal.close()' },
      { label: confirmLabel, cls: confirmCls, onclick: 'if (Modal._confirmCb) { Modal._confirmCb(); Modal._confirmCb = null; } Modal.close();' },
    ]);
  },

  alert(title, message, type = 'info') {
    const icons = {
      info: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--primary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      success: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--success)" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      warning: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      error: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--error)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };
    Modal.show(title, `
      <div class="alert alert-${type}">
        <span class="alert-icon">${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
      </div>`, [
      { label: 'OK', cls: 'btn-primary', onclick: 'Modal.close()' },
    ]);
  },
};

// Keyboard handler
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Modal.close();
});
