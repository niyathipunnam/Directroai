/* Status Badge Component */
function statusBadge(status) {
  const map = {
    queued:         { cls: 'badge-queued',         icon: '⏳', label: 'Queued' },
    generating:     { cls: 'badge-generating',     icon: '✨', label: 'Generating' },
    processing:     { cls: 'badge-processing',     icon: '⚙️', label: 'Processing' },
    completed:      { cls: 'badge-completed',      icon: '✅', label: 'Completed' },
    failed:         { cls: 'badge-failed',         icon: '❌', label: 'Failed' },
    pending:        { cls: 'badge-pending',        icon: '○',  label: 'Pending' },
    none:           { cls: 'badge-pending',        icon: '○',  label: 'No Video' },
    skipped:        { cls: 'badge-skipped',        icon: '⏭️', label: 'Skipped' },
    not_configured: { cls: 'badge-not_configured', icon: 'ℹ️', label: 'Not Configured' },
    upload:         { cls: 'badge-upload',         icon: '📤', label: 'Uploaded' },
    exporting:      { cls: 'badge-generating',     icon: '⚙️', label: 'Exporting' },
  };
  const s = map[status] || { cls: 'badge-pending', icon: '○', label: status || 'Unknown' };
  return `<span class="badge ${s.cls}">${s.icon} ${s.label}</span>`;
}

function sourceBadge(source) {
  if (source === 'upload') return `<span class="badge badge-upload">📤 Uploaded</span>`;
  if (source === 'generated') return `<span class="badge badge-generated">✨ Generated</span>`;
  return '';
}
