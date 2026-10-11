/* ============================================================
   DIRECTRO AI — Professional Media Library
   ============================================================ */

let _mediaTab = 'all';
let _mediaSearchQuery = '';
let _mediaSortOrder = 'newest';
let _mediaAssets = [];
let _activeAudioInstance = null;
let _activeAudioUrl = null;

async function renderMediaPage() {
  const container = document.getElementById('page-media');
  if (!container) return;
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <h1 style="margin:0 0 4px 0; font-size:24px; font-weight:700;">Media Library</h1>
          <p style="margin:0; color:var(--text-muted); font-size:14px;">Centralized asset repository. Inspect, upload, and organize all project media.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn btn-secondary" onclick="renderMediaPage()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button class="btn btn-primary" onclick="openMediaUploadModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Asset
          </button>
        </div>
      </div>
    </div>

    <div>
      <!-- Filter Toolbar -->
      <div style="background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); padding:12px 16px; margin-bottom:20px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;">
        <!-- Category Tabs -->
        <div id="media-tabs-bar" style="display:flex; flex-wrap:wrap; gap:6px;">
          <!-- Dynamically populated with counts -->
        </div>

        <!-- Search and Sort -->
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <div style="position:relative; min-width:200px;">
            <input type="text" id="media-search-input" class="form-control" placeholder="Search assets..." value="${_mediaSearchQuery}" oninput="handleMediaSearch(this.value)" style="padding-left:32px; font-size:13px; height:34px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute; left:10px; top:10px; color:var(--text-muted); pointer-events:none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <select class="form-control" style="font-size:13px; height:34px; padding:4px 8px;" onchange="handleMediaSort(this.value)">
            <option value="newest" ${_mediaSortOrder==='newest'?'selected':''}>Newest First</option>
            <option value="oldest" ${_mediaSortOrder==='oldest'?'selected':''}>Oldest First</option>
            <option value="name" ${_mediaSortOrder==='name'?'selected':''}>Name (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Media Grid -->
      <div id="media-grid" class="grid-5" style="min-height:320px; position:relative;">
        <div class="loading-overlay">` + (typeof Cinematic !== 'undefined' ? Cinematic.loader('filmstrip', 'Loading Library...') : 'Loading...') + `</div>
      </div>
    </div>
  `;

  if (pid) {
    await loadMediaLibrary();
  }
}

async function loadMediaLibrary() {
  const grid = document.getElementById('media-grid');
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    _mediaAssets = (res && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []);
    renderMediaTabs();
    renderMediaGrid();
  } catch(e) {
    if (grid) grid.innerHTML = `<div class="alert alert-error">Failed to load media: ${e.message}</div>`;
  }
}

function renderMediaTabs() {
  const tabsBar = document.getElementById('media-tabs-bar');
  if (!tabsBar) return;

  const getCount = (types) => {
    if (!Array.isArray(types)) types = [types];
    return _mediaAssets.filter(a => types.includes(a.asset_type)).length;
  };

  const tabsConfig = [
    { id: 'all', label: 'All', count: _mediaAssets.length },
    { id: 'video', label: 'AI Videos', count: getCount('video') },
    { id: 'character', label: 'Characters', count: getCount('character') },
    { id: 'environment', label: 'Environments', count: getCount('environment') },
    { id: 'storyboard_image', label: 'Storyboards', count: getCount('storyboard_image') },
    { id: 'audio', label: 'Voice / Audio', count: getCount(['audio', 'voice']) },
    { id: 'music', label: 'Music', count: getCount('music') },
    { id: 'sfx', label: 'SFX', count: getCount('sfx') },
    { id: 'export', label: 'Exports', count: getCount('export') }
  ];

  tabsBar.innerHTML = tabsConfig.map(t => `
    <button class="btn ${(_mediaTab === t.id) ? 'btn-primary' : 'btn-secondary'}" style="font-size:12px; padding:5px 10px; border-radius:20px;" onclick="setMediaTab('${t.id}')">
      ${t.label} <span style="opacity:0.75; font-size:11px; margin-left:3px; background:rgba(255,255,255,0.15); padding:1px 6px; border-radius:10px;">${t.count}</span>
    </button>
  `).join('');
}

function setMediaTab(tab) {
  _mediaTab = tab;
  renderMediaTabs();
  renderMediaGrid();
}

function handleMediaSearch(query) {
  _mediaSearchQuery = (query || '').toLowerCase().trim();
  renderMediaGrid();
}

function handleMediaSort(order) {
  _mediaSortOrder = order;
  renderMediaGrid();
}

function renderMediaGrid() {
  const container = document.getElementById('media-grid');
  if (!container) return;

  let filtered = _mediaAssets.slice();

  // Category filter
  if (_mediaTab !== 'all') {
    if (_mediaTab === 'audio') {
      filtered = filtered.filter(a => a.asset_type === 'audio' || a.asset_type === 'voice');
    } else {
      filtered = filtered.filter(a => a.asset_type === _mediaTab);
    }
  }

  // Search filter
  if (_mediaSearchQuery) {
    filtered = filtered.filter(a => {
      const name = (a.filename || '').toLowerCase();
      const type = (a.asset_type || '').toLowerCase();
      return name.includes(_mediaSearchQuery) || type.includes(_mediaSearchQuery);
    });
  }

  // Sorting
  if (_mediaSortOrder === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (_mediaSortOrder === 'oldest') {
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (_mediaSortOrder === 'name') {
    filtered.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:50px 20px; color:var(--text-muted); background:var(--bg-panel); border:1px dashed var(--border-light); border-radius:var(--radius);">
        <div style="font-size:36px; margin-bottom:12px;">📁</div>
        <h3 style="margin:0 0 6px 0; font-size:16px; color:var(--text-main);">No Assets Found</h3>
        <p style="margin:0 0 16px 0; font-size:13px;">No items match "${_mediaTab}" or your search query.</p>
        <button class="btn btn-primary btn-sm" onclick="openMediaUploadModal()">Upload New Asset</button>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(a => {
    const isVideo = a.asset_type === 'video' || a.asset_type === 'export';
    const isAudio = ['audio', 'music', 'sfx', 'voice'].includes(a.asset_type);
    const isImage = !isVideo && !isAudio;
    const isPlaying = (_activeAudioUrl === a.url_path);

    let previewContent = '';
    if (isVideo) {
      previewContent = `
        <video src="${a.url_path}" preload="metadata" style="width:100%; height:100%; object-fit:cover; background:#000;" onmouseover="this.play().catch(()=>{})" onmouseout="this.pause()"></video>
        <div style="position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,0.7); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; pointer-events:none;">▶ Video</div>
      `;
    } else if (isAudio) {
      previewContent = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(20,25,35,0.9), rgba(10,15,25,0.95)); padding:12px; text-align:center;">
          <div style="font-size:32px; margin-bottom:6px;">${a.asset_type === 'music' ? '🎵' : (a.asset_type === 'sfx' ? '⚡' : '🎙️')}</div>
          <div style="font-size:11px; color:var(--primary); font-weight:600; text-transform:uppercase;">${a.asset_type}</div>
        </div>
      `;
    } else {
      previewContent = `
        <img src="${a.url_path}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/favicon.ico'" />
      `;
    }

    const badgeColor = a.asset_type === 'export' ? 'var(--success)' : 
                       a.asset_type === 'video' ? 'var(--primary)' : 
                       a.asset_type === 'music' ? '#a855f7' : 
                       a.asset_type === 'sfx' ? '#f59e0b' : 
                       a.asset_type === 'audio' || a.asset_type === 'voice' ? '#06b6d4' : 
                       'rgba(0,0,0,0.65)';

    const typeLabel = (a.asset_type || 'ASSET').toUpperCase();
    const title = a.filename || 'Untitled Asset';
    const dateFormatted = a.created_at ? new Date(a.created_at).toLocaleDateString() : '';

    return `
      <div class="media-item" style="display:flex; flex-direction:column; background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); overflow:hidden; transition:transform 0.2s, box-shadow 0.2s;">
        <div class="media-thumbnail media-thumbnail-square" style="position:relative; width:100%; aspect-ratio:1/1; cursor:pointer;" onclick="openMediaInspectModal(${a.id})">
          ${previewContent}
          <div class="media-badge" style="position:absolute; top:8px; left:8px; background:${badgeColor}; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
            ${typeLabel}
          </div>
        </div>
        
        <div class="media-info" style="padding:10px 12px; display:flex; flex-direction:column; flex:1; justify-content:space-between;">
          <div>
            <div class="media-title" title="${escHtml(title)}" style="font-size:13px; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escHtml(title)}
            </div>
            <div class="media-meta" style="font-size:11px; color:var(--text-muted); margin-top:3px;">
              ${dateFormatted}
            </div>
          </div>

          <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
            <!-- Primary Action -->
            ${isAudio ? `
              <button class="btn ${isPlaying ? 'btn-danger' : 'btn-secondary'} btn-sm btn-block" style="font-size:11px; padding:5px 8px;" onclick="toggleAudioPreview('${a.url_path}', this)">
                ${isPlaying ? '⏹ Stop Audio' : '▶ Play Preview'}
              </button>
            ` : ''}

            <!-- Add to Timeline Button -->
            <button class="btn btn-primary btn-sm btn-block" style="font-size:11px; padding:5px 8px;" onclick="addAssetToTimeline(${a.id}, '${a.asset_type}')">
              ➕ Add to Timeline
            </button>

            <!-- Card Sub-actions -->
            <div style="display:flex; gap:4px; align-items:center;">
              <button class="btn btn-secondary btn-sm" style="flex:1; font-size:11px; padding:4px;" title="Inspect details" onclick="openMediaInspectModal(${a.id})">
                👁️ View
              </button>
              <a href="${a.url_path}" download="${escHtml(a.filename)}" target="_blank" class="btn btn-secondary btn-sm" style="flex:1; font-size:11px; padding:4px; text-align:center; text-decoration:none;" title="Download asset">
                ⬇ Save
              </a>
              <button class="btn btn-danger btn-sm" style="padding:4px 8px; font-size:11px;" title="Delete permanently" onclick="deleteLibraryAsset(${a.id})">
                🗑
              </button>
            </div>

            ${isImage ? `
              <button class="btn btn-secondary btn-sm btn-block" style="font-size:11px; padding:4px;" onclick="animateAsset(${a.id})">
                ✨ Animate to Video
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   Audio Preview Player Controller
   ============================================================ */
function toggleAudioPreview(url, btnElement) {
  if (_activeAudioInstance && _activeAudioUrl === url) {
    _activeAudioInstance.pause();
    _activeAudioInstance = null;
    _activeAudioUrl = null;
    renderMediaGrid();
    return;
  }

  if (_activeAudioInstance) {
    _activeAudioInstance.pause();
    _activeAudioInstance = null;
    _activeAudioUrl = null;
  }

  const audio = new Audio(url);
  _activeAudioInstance = audio;
  _activeAudioUrl = url;

  audio.onended = () => {
    _activeAudioInstance = null;
    _activeAudioUrl = null;
    renderMediaGrid();
  };

  audio.onerror = () => {
    alert('Failed to play audio file.');
    _activeAudioInstance = null;
    _activeAudioUrl = null;
    renderMediaGrid();
  };

  audio.play().catch(e => {
    console.warn('Audio play prevented:', e);
  });

  renderMediaGrid();
}

/* ============================================================
   Add Media directly to Active Timeline
   ============================================================ */
async function addAssetToTimeline(assetId, assetType) {
  if (!ProjectState.id) {
    alert('Please select or open an active project first.');
    return;
  }

  let trackType = 'video';
  let defaultDuration = 5.0;

  if (assetType === 'video' || assetType === 'export') {
    trackType = 'video';
    defaultDuration = 5.0;
  } else if (assetType === 'music') {
    trackType = 'music';
    defaultDuration = 10.0;
  } else if (assetType === 'sfx') {
    trackType = 'sfx';
    defaultDuration = 3.0;
  } else if (assetType === 'audio' || assetType === 'voice') {
    trackType = 'voice';
    defaultDuration = 5.0;
  } else {
    // image clips (character, environment, storyboard)
    trackType = 'video';
    defaultDuration = 4.0;
  }

  const asset = _mediaAssets.find(a => a.id === assetId);
  const label = asset ? asset.filename : 'Timeline Clip';

  try {
    await api.post('/editor/timeline', {
      project_id: ProjectState.id,
      media_asset_id: assetId,
      track_type: trackType,
      clip_label: label,
      duration: defaultDuration
    });

    if (typeof showToast === 'function') {
      showToast('success', `Added "${label}" to ${trackType.toUpperCase()} timeline!`);
    } else {
      alert(`Successfully added "${label}" to ${trackType.toUpperCase()} timeline!`);
    }
  } catch(err) {
    alert('Failed to add to timeline: ' + err.message);
  }
}

/* ============================================================
   Inspect Modal
   ============================================================ */
function openMediaInspectModal(assetId) {
  const asset = _mediaAssets.find(a => a.id === assetId);
  if (!asset) return;

  const isVideo = asset.asset_type === 'video' || asset.asset_type === 'export';
  const isAudio = ['audio', 'music', 'sfx', 'voice'].includes(asset.asset_type);

  let previewHtml = '';
  if (isVideo) {
    previewHtml = `<video src="${asset.url_path}" controls autoplay style="width:100%; max-height:360px; border-radius:var(--radius); background:#000;"></video>`;
  } else if (isAudio) {
    previewHtml = `
      <div style="background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); padding:24px; text-align:center;">
        <div style="font-size:42px; margin-bottom:12px;">🎵</div>
        <audio src="${asset.url_path}" controls autoplay style="width:100%;"></audio>
      </div>`;
  } else {
    previewHtml = `<img src="${asset.url_path}" style="width:100%; max-height:380px; object-fit:contain; border-radius:var(--radius); background:#000;" />`;
  }

  const content = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      ${previewHtml}
      <div style="background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); padding:14px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:var(--text-muted);">Filename:</span> <span style="font-weight:600; color:var(--text-main); word-break:break-all;">${escHtml(asset.filename)}</span></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:var(--text-muted);">Category:</span> <span style="text-transform:uppercase; font-weight:600; color:var(--primary);">${asset.asset_type}</span></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:var(--text-muted);">Source:</span> <span>${asset.source || 'Directro AI'}</span></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:var(--text-muted);">Created:</span> <span>${asset.created_at ? new Date(asset.created_at).toLocaleString() : 'N/A'}</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">URL:</span> <a href="${asset.url_path}" target="_blank" style="color:var(--primary); text-decoration:none;">Open in new tab ↗</a></div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" style="flex:1;" onclick="addAssetToTimeline(${asset.id}, '${asset.asset_type}'); Modal.close();">
          ➕ Add to Timeline
        </button>
        <a href="${asset.url_path}" download="${escHtml(asset.filename)}" class="btn btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center;">
          ⬇ Download
        </a>
      </div>
    </div>
  `;

  if (typeof Modal !== 'undefined' && Modal.show) {
    Modal.show(`Asset Details — ${asset.filename}`, content);
  } else {
    window.open(asset.url_path, '_blank');
  }
}

/* ============================================================
   Upload Asset Modal
   ============================================================ */
function openMediaUploadModal() {
  if (!ProjectState.id) {
    alert('Please select or create a project first.');
    return;
  }

  const content = `
    <form id="media-upload-form" onsubmit="handleMediaUploadSubmit(event)">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label" style="display:block; margin-bottom:6px; font-size:13px; font-weight:600;">Choose File</label>
        <input type="file" id="media-upload-file" class="form-control" required style="padding:6px;" accept="image/*,video/*,audio/*">
        <small style="color:var(--text-muted); font-size:11px; margin-top:4px; display:block;">Supports Images (PNG, JPG, WEBP), Videos (MP4, WEBM, MOV), and Audio (MP3, WAV, AAC).</small>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label" style="display:block; margin-bottom:6px; font-size:13px; font-weight:600;">Asset Category</label>
        <select id="media-upload-type" class="form-control" style="width:100%; height:36px;">
          <option value="video">AI Video</option>
          <option value="character">Character Image</option>
          <option value="environment">Environment Image</option>
          <option value="storyboard_image">Storyboard Image</option>
          <option value="voice">Voice / Narration</option>
          <option value="music">Background Music</option>
          <option value="sfx">Sound Effect (SFX)</option>
        </select>
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label" style="display:block; margin-bottom:6px; font-size:13px; font-weight:600;">Display Name (Optional)</label>
        <input type="text" id="media-upload-name" class="form-control" placeholder="e.g. Hero Close Up, Epic Theme, Laser Sound">
      </div>

      <div id="media-upload-status" style="margin-bottom:12px; display:none;"></div>

      <button type="submit" id="media-upload-submit-btn" class="btn btn-primary btn-block">
        Upload to Media Library
      </button>
    </form>
  `;

  Modal.show('Upload Project Asset', content);
}

async function handleMediaUploadSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById('media-upload-file');
  const typeSelect = document.getElementById('media-upload-type');
  const nameInput = document.getElementById('media-upload-name');
  const statusDiv = document.getElementById('media-upload-status');
  const submitBtn = document.getElementById('media-upload-submit-btn');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please choose a file to upload.');
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', ProjectState.id);
  formData.append('asset_type', typeSelect.value);
  if (nameInput.value.trim()) {
    formData.append('name', nameInput.value.trim());
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = '<div class="alert alert-info">Uploading asset to project repository...</div>';

  try {
    await api.post('/media/upload', formData);
    statusDiv.innerHTML = '<div class="alert alert-success">Asset uploaded successfully!</div>';
    setTimeout(() => {
      Modal.close();
      loadMediaLibrary();
    }, 900);
  } catch(err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload to Media Library';
    statusDiv.innerHTML = `<div class="alert alert-error">Upload failed: ${err.message}</div>`;
  }
}

/* ============================================================
   Delete Asset
   ============================================================ */
async function deleteLibraryAsset(id) {
  if (!confirm('Are you sure you want to permanently delete this asset from the repository?')) return;
  try {
    await api.delete('/media/' + id);
    if (_activeAudioInstance) {
      _activeAudioInstance.pause();
      _activeAudioInstance = null;
      _activeAudioUrl = null;
    }
    loadMediaLibrary();
  } catch(e) {
    alert('Failed to delete asset: ' + e.message);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
