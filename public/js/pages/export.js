/* Professional Export Page */

let _exportTaskId = null;
let _exportPolling = null;

async function renderExportPage() {
  if (_exportPolling) { clearInterval(_exportPolling); _exportPolling = null; }

  const container = document.getElementById('page-export');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Export Final Master</h1>
           <p>Render your timeline into a high-quality video using FFmpeg.</p>
         </div>
      </div>
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <div style="flex:1; min-width:300px;">
        <div class="card">
          <div class="card-header">Timeline Analysis</div>
          <div class="card-body" id="export-timeline-summary" style="min-height:100px;">
             <div class="loading-overlay">`+Cinematic.loader("filmstrip", "Loading...")+`</div>
          </div>
        </div>

        <div class="card mt-24">
          <div class="card-header">Render Configuration</div>
          <div class="card-body">
             <div class="form-group">
                <label class="form-label">Format</label>
                <select class="form-control" disabled><option>MP4 (H.264 + AAC)</option></select>
             </div>
             <div class="form-group">
                <label class="form-label">Resolution</label>
                <select class="form-control" disabled><option>Match Source</option></select>
             </div>
             <button class="btn btn-primary btn-block mt-16" id="btn-export-start" onclick="startExport()">Render Timeline</button>
             <div id="export-progress-container" class="hidden mt-16" style="padding:16px; background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); text-align:center;">`+Cinematic.loader("filmstrip", "")+`<div style="display:flex; justify-content:space-between; margin-bottom:8px; margin-top:16px; font-size:11px; font-weight:600; color:var(--primary);"><span>RENDERING FINAL MASTER</span><span id="export-progress-text">0%</span></div><div style="width:100%; height:6px; background:var(--bg-card); border-radius:3px; overflow:hidden;"><div id="export-progress-bar" style="height:100%; width:0%; background:var(--primary); transition:width 0.3s;"></div></div></div>
          </div>
        </div>
      </div>

      <div style="flex:1; min-width:300px;">
         <div class="card">
            <div class="card-header">Recent Exports</div>
            <div class="card-body" id="export-list" style="min-height:200px;">
               <div class="loading-overlay" id="export-loading">`+Cinematic.loader("filmstrip", "Loading...")+`</div>
            </div>
         </div>
      </div>
    </div>`;

  if (pid) {
    analyzeTimeline();
    loadExports();
  }
}

async function analyzeTimeline() {
  const summary = document.getElementById('export-timeline-summary');
  try {
    const res = await api.get('/editor/timeline?project_id=' + ProjectState.id);
    let allClips = [];
    if (res && res.tracks) {
      allClips = (res.tracks.video || []).concat(res.tracks.audio || []).concat(res.tracks.music || []).concat(res.tracks.sfx || []);
    } else if (Array.isArray(res.data)) {
      allClips = res.data;
    } else if (Array.isArray(res)) {
      allClips = res;
    }

    const video = allClips.filter(c => !c.track_type || c.track_type === 'video');
    const audio = allClips.filter(c => c.track_type === 'audio' || c.track_type === 'voice');
    const music = allClips.filter(c => c.track_type === 'music');
    const sfx = allClips.filter(c => c.track_type === 'sfx');
    
    if (video.length === 0) {
      summary.innerHTML = '<div class="alert alert-error">Timeline has no video clips. Add video clips in the Editor first.</div>';
      document.getElementById('btn-export-start').disabled = true;
      return;
    }

    document.getElementById('btn-export-start').disabled = false;
    summary.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span style="color:var(--text-muted);">Video Clips</span> <span class="font-bold">${video.length}</span></div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span style="color:var(--text-muted);">Scene Audio</span> <span class="font-bold">${audio.length}</span></div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span style="color:var(--text-muted);">Music Tracks</span> <span class="font-bold">${music.length}</span></div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span style="color:var(--text-muted);">Sound Effects</span> <span class="font-bold">${sfx.length}</span></div>
      <hr style="border:0; border-bottom:1px solid var(--border-light); margin:12px 0;" />
      <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--success); font-weight:600;"><span>Status</span> <span>Ready to Render (${allClips.length} total tracks)</span></div>
    `;
  } catch(e) { summary.innerHTML = '<div class="alert alert-error">Failed to analyze timeline.</div>'; }
}

async function startExport() {
  document.getElementById('btn-export-start').disabled = true;
  document.getElementById('export-progress-container').classList.remove('hidden');
  
  try {
    const res = await api.post('/export', { project_id: ProjectState.id });
    _exportTaskId = res.task_id || (res.data && res.data.task_id);
    _exportPolling = setInterval(pollExportStatus, 1500);
  } catch(err) {
    alert(err.message);
    document.getElementById('btn-export-start').disabled = false;
    document.getElementById('export-progress-container').classList.add('hidden');
  }
}

async function pollExportStatus() {
  if (!_exportTaskId) return;
  try {
    const res = await api.get('/export/status/' + _exportTaskId);
    const data = res.task || res.data || res;
    
    const pct = data.progress || 0;
    document.getElementById('export-progress-bar').style.width = pct + '%';
    document.getElementById('export-progress-text').textContent = pct + '%';
    
    if (data.status === 'completed') {
       clearInterval(_exportPolling); _exportPolling = null;
       document.getElementById('export-progress-text').textContent = '100% - COMPLETED';
       document.getElementById('btn-export-start').disabled = false;
       loadExports();
       setTimeout(() => document.getElementById('export-progress-container').classList.add('hidden'), 5000);
    } else if (data.status === 'failed' || data.status === 'error') {
       clearInterval(_exportPolling); _exportPolling = null;
       document.getElementById('export-progress-text').textContent = 'FAILED';
       document.getElementById('export-progress-bar').style.background = 'var(--error)';
       document.getElementById('btn-export-start').disabled = false;
       alert('Export failed: ' + (data.error || 'Unknown error'));
    }
  } catch(e) {}
}

async function loadExports() {
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    const exports = (res.data || res).filter(a => a.asset_type === 'export');
    const elist = document.getElementById('export-list');
    const loader = document.getElementById('export-loading');
    if (loader) loader.remove();
    
    if (exports.length === 0) {
      elist.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">' + (typeof Cinematic !== 'undefined' ? Cinematic.emptyState("filmstrip", "No Exports", "Your finished videos will appear here.") : '<h3>No Exports</h3><p>Your finished videos will appear here.</p>') + '</div>';
      return;
    }
    
    elist.innerHTML = '<div style="display:flex; flex-direction:column; gap:12px;">' + exports.map(e => `
      <div style="background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); padding:12px;">
         <video src="${e.url_path}" style="width:100%; aspect-ratio:16/9; background:#000; border-radius:var(--radius-sm);" controls></video>
         <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
            <div style="font-size:12px; font-weight:600; color:var(--text-main);">${escHtml(e.filename)}</div>
            <div style="font-size:10px; color:var(--text-subtle);">${new Date(e.created_at).toLocaleString()}</div>
         </div>
         <div style="display:flex; gap:8px; margin-top:12px;">
            <a href="${e.url_path}" download class="btn btn-primary btn-sm" style="flex:1; text-align:center;">Download</a>
            <button class="btn btn-danger btn-sm" onclick="deleteLibraryAsset(${e.id})">Delete</button>
         </div>
      </div>
    `).join('') + '</div>';
  } catch(e) {}
}
