/* Professional Audio Page */

function renderAudioPage() {
  const container = document.getElementById('page-audio');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Audio Production</h1>
           <p>Generate dialogue, background scores, and cinematic sound effects.</p>
         </div>
      </div>
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <!-- Generator Col -->
      <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
         <div class="card">
            <div class="card-header">AI Audio Generation</div>
            <div class="card-body">
               <div class="form-group">
                  <label class="form-label">Audio Classification</label>
                  <select id="audio-type" class="form-control">
                     <option value="voice">Scene Audio (Voice / Dialogue)</option>
                     <option value="music">Background Music (Score)</option>
                     <option value="sfx">Cinematic Sound Effect</option>
                  </select>
               </div>
               <div class="form-group">
                  <label class="form-label">Prompt / Script</label>
                  <textarea id="audio-prompt" class="form-control" rows="4" placeholder="E.g. A deep cinematic bass impact, or 'Hello, I am ready for the mission.'"></textarea>
               </div>
               <div class="mt-16">
                  <button class="btn btn-primary btn-block" id="btn-gen-audio" onclick="generateAudio()">Generate Audio Asset</button>
               </div>
               <div id="audio-gen-status" class="mt-16 text-center" style="font-size:12px; color:var(--primary);"></div>
            </div>
         </div>
         
         <div class="card">
           <div class="card-header">Upload Existing Audio</div>
           <div class="card-body text-center">
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Have your own voiceover or music? Upload it here.</p>
              <input type="file" id="audio-upload" accept="audio/*" class="hidden" onchange="uploadAudioFile()" />
              <button class="btn btn-secondary btn-block" onclick="document.getElementById('audio-upload').click()">+ Upload Audio File</button>
           </div>
         </div>
      </div>
      
      <!-- Audio Library Col -->
      <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
         <div class="card">
            <div class="card-header">Audio Assets</div>
            <div class="card-body" id="audio-list" style="min-height:200px;">
               <div class="loading-overlay" id="audio-loading">`+Cinematic.loader("audio", "Loading Audio Assets...")+`</div>
            </div>
         </div>
      </div>
    </div>`;

  if (pid) loadAudioAssets();
}

async function uploadAudioFile() {
  const fileInput = document.getElementById('audio-upload');
  const file = fileInput.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('project_id', ProjectState.id);
  fd.append('asset_type', 'audio');
  
  try {
    await api.post('/media/upload', fd, true);
    loadAudioAssets();
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

async function generateAudio() {
  const pid = ProjectState.id;
  const prompt = document.getElementById('audio-prompt').value.trim();
  const type = document.getElementById('audio-type').value;

  if (!prompt) return alert('Please enter a prompt or script.');
  
  const btn = document.getElementById('btn-gen-audio');
  const status = document.getElementById('audio-gen-status');
  btn.disabled = true;
  status.textContent = 'Generating audio...';

  try {
    await api.post('/audio', { project_id: pid, description: prompt, audio_type: type });
    status.textContent = 'Generation task queued...';
    // Mock polling for demo
    setTimeout(() => {
        status.textContent = 'Audio generated successfully!';
        btn.disabled = false;
        loadAudioAssets();
        setTimeout(()=>status.textContent='', 3000);
    }, 4000);
  } catch(err) {
    status.textContent = err.message;
    status.style.color = 'var(--error)';
    btn.disabled = false;
  }
}

async function loadAudioAssets() {
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    const audios = (res.data || res).filter(a => ['audio','music','sfx','voice'].includes(a.asset_type));
    const container = document.getElementById('audio-list');
    const loader = document.getElementById('audio-loading');
    if (loader) loader.remove();

    if (audios.length === 0) {
      container.innerHTML = Cinematic.emptyState("audio", "No Audio", "Generate or upload audio files.");
      return;
    }

    container.innerHTML = '<div style="display:flex; flex-direction:column; gap:12px;">' + audios.map(a => `
      <div style="background:var(--bg-panel); border:1px solid var(--border-light); border-radius:var(--radius); padding:12px; display:flex; flex-direction:column; gap:12px;">
         <div style="display:flex; justify-content:space-between; align-items:center;">
             <div style="font-size:13px; font-weight:600; color:var(--text-main);">${escHtml(a.filename)}</div>
             <span class="badge badge-completed">${a.asset_type.toUpperCase()}</span>
         </div>
         <audio src="${a.url_path}" controls style="width:100%; height:32px;"></audio>
         <div style="display:flex; justify-content:space-between; align-items:center;">
             <div style="font-size:11px; color:var(--text-subtle);">${new Date(a.created_at).toLocaleDateString()}</div>
             <div style="display:flex; gap:8px;">
               <button class="btn btn-primary btn-sm" onclick="addAudioToEditor(${a.id}, '${a.asset_type}')">+ Add to Timeline</button>
               <button class="btn btn-danger btn-sm" onclick="deleteAudio(${a.id})">Delete</button>
             </div>
         </div>
      </div>
    `).join('') + '</div>';
  } catch(e) {
    const container = document.getElementById('audio-list');
    if (container) container.innerHTML = `<div class="alert alert-error">Failed to load audio: ${e.message}</div>`;
  }
}

async function addAudioToEditor(id, assetType) {
  if (!ProjectState.id) {
    alert('Please select an active project first.');
    return;
  }
  const track = assetType === 'music' ? 'music' : (assetType === 'sfx' ? 'sfx' : 'voice');
  try {
    await api.post('/editor/timeline', {
      project_id: ProjectState.id,
      media_asset_id: id,
      track_type: track,
      clip_label: 'Audio Track',
      duration: assetType === 'music' ? 10.0 : 5.0
    });
    alert('Audio clip added to ' + track.toUpperCase() + ' timeline!');
  } catch(err) {
    alert('Failed to add audio to timeline: ' + err.message);
  }
}

async function deleteAudio(id) {
  if(!confirm('Delete this audio asset?')) return;
  try { await api.delete('/media/' + id); loadAudioAssets(); } catch(err) { alert(err.message); }
}
