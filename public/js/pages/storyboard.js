/* Professional Storyboard Page */

let _currentStoryboardId = null;
let _shotPollings = {};

function renderStoryboardPage() {
  Object.values(_shotPollings).forEach(clearInterval);
  _shotPollings = {};

  const container = document.getElementById('page-storyboard');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Storyboard & Shot Generation</h1>
           <p>Break your story into cinematic shots. Maintain visual consistency by linking your character and environment references.</p>
         </div>
      </div>
    </div>

    <div>
      <div class="card mb-24">
        <div class="card-header">Storyboard Configuration</div>
        <div class="card-body" style="display:flex; gap:24px; flex-wrap:wrap;">
           <div style="flex:2; min-width:300px;">
              <div class="form-group">
                 <label class="form-label">Sequence Description / Script Action</label>
                 <textarea id="sb-story" class="form-control" rows="5" placeholder="E.g. A tense standoff in the rainy alleyway. The character slowly draws their weapon..."></textarea>
              </div>
           </div>
           <div style="flex:1; min-width:250px; display:flex; flex-direction:column; gap:16px;">
              <div class="form-group" style="margin:0;">
                 <label class="form-label">ACTIVE CHARACTER REFERENCE</label>
                 <select id="sb-char-select" class="form-control" onchange="updateActiveReferences()"><option value="">-- No Character (Generative) --</option></select>
                 <div id="sb-char-preview" style="margin-top:8px; display:none; border:1px solid var(--border-light); border-radius:var(--radius); overflow:hidden; aspect-ratio:1/1; max-width:150px; background:#111;"></div>
              </div>
              <div class="form-group" style="margin:0;">
                 <label class="form-label">ACTIVE ENVIRONMENT REFERENCE</label>
                 <select id="sb-env-select" class="form-control" onchange="updateActiveReferences()"><option value="">-- No Environment (Generative) --</option></select>
                 <div id="sb-env-preview" style="margin-top:8px; display:none; border:1px solid var(--border-light); border-radius:var(--radius); overflow:hidden; aspect-ratio:16/9; max-width:200px; background:#111;"></div>
              </div>
              <div class="form-group" style="margin:0;">
                 <label class="form-label">Number of Shots to Generate</label>
                 <input type="number" id="sb-num-shots" class="form-control" value="4" min="1" max="12" />
              </div>
              <div class="mt-8">
                 <button class="btn btn-primary btn-block" id="sb-gen-btn" onclick="generateStoryboard()">Generate Storyboard Sequence</button>
              </div>
           </div>
        </div>
        <div id="sb-gen-status" style="padding:0 16px 16px 16px;"></div>
      </div>

      <div id="sb-shots-area"></div>
    </div>`;

  if (pid) {
    loadStoryboardAssets();
    loadStoryboards();
  }
}

async function loadStoryboardAssets() {
  const pid = ProjectState.id;
  try {
    const charRes = await api.get('/characters?project_id=' + pid);
    const chars = (charRes.data || charRes).filter(c => c.status === 'completed');

    const envRes = await api.get('/environments?project_id=' + pid);
    const envs = (envRes.data || envRes).filter(e => e.status === 'completed');

    const charSel = document.getElementById('sb-char-select');
    if (charSel) {
      charSel.innerHTML = '<option value="">-- No Character --</option>' + chars.map(c => `<option value="${c.id}">${escHtml(c.name || 'Character ' + c.id)}</option>`).join('');
    }

    const envSel = document.getElementById('sb-env-select');
    if (envSel) {
      envSel.innerHTML = '<option value="">-- No Environment --</option>' + envs.map(c => `<option value="${c.id}">${escHtml(c.name || 'Environment ' + c.id)}</option>`).join('');
    }
  } catch (e) {
    console.error('Failed to load storyboard assets', e);
  }
}

function renderShotsArea(board) {
  const area = document.getElementById('sb-shots-area');
  if (!area) return;

  const shots = board.shots || [];

  area.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div style="font-size:16px; font-weight:600; color:var(--text-main); letter-spacing:0.5px;">Storyboard Sequence</div>
      <button class="btn btn-secondary btn-sm" onclick="addNewShot()">+ Add Manual Shot</button>
    </div>
    <div class="grid-3" id="shots-grid">
      ${shots.map(shotCard).join('')}
    </div>`;
}

function shotCard(shot) {
  const vs = shot.video_status;
  let vHtml = '';
  if (vs === 'completed' && shot.video_url) {
    vHtml = `<div style="margin-top:12px; border-radius:var(--radius); overflow:hidden; border:1px solid var(--border-light);"><video src="${shot.video_url}" controls style="width:100%; display:block; aspect-ratio:16/9; background:#000;"></video></div>`;
  } else if (vs === 'generating' || vs === 'queued' || vs === 'processing') {
    vHtml = `<div style="margin-top:12px; padding:12px; background:var(--bg-panel); border:1px dashed var(--primary); border-radius:var(--radius); display:flex; align-items:center; justify-content:center; gap:8px; font-size:11px; color:var(--primary);">`+Cinematic.loader("camera", "Generating Video...")+`</div>`;
  } else if (vs === 'failed') {
    vHtml = `<div style="margin-top:12px; padding:8px 12px; background:var(--bg-panel); border:1px solid var(--error); border-radius:var(--radius); display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--error-light);">
      Video Failed
      <button class="btn btn-secondary btn-sm" style="padding:2px 6px; font-size:10px;" onclick="generateShotVideo(${shot.id})">Retry</button>
    </div>`;
  }

  return `
    <div class="card" id="shot-card-${shot.id}">
      <div class="media-thumbnail media-thumbnail-square">
        ${shot.image_url 
           ? `<img src="${shot.image_url}" alt="Shot ${shot.shot_number}" />`
           : `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-subtle);font-size:11px;">NO IMAGE</div>`}
        <div class="media-badge">SHOT ${String(shot.shot_number).padStart(2, '0')}</div>
      </div>
      <div class="card-body" style="display:flex; flex-direction:column;">
        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px; flex:1;" title="${escHtml(shot.description||'')}">
           ${escHtml((shot.description || 'No description').substring(0, 100))}${(shot.description||'').length>100?'...':''}
        </div>
        ${shot.camera_movement ? `<div style="font-size:10px; color:var(--text-subtle); margin-bottom:12px; padding-left:8px; border-left:2px solid var(--border-strong);">📷 ${escHtml(shot.camera_movement)}</div>` : ''}
        
        ${vHtml}
        
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;">
          <button class="btn btn-primary btn-block" onclick="generateShotVideo(${shot.id})" ${vs==='generating'||vs==='processing'?'disabled':''}>🎥 Generate Video</button>
          <div style="display:flex; gap:8px; width:100%;">
             <button class="btn btn-secondary" style="flex:1;" onclick="regenerateShot(${shot.id})">🔄 Regen Image</button>
             <button class="btn btn-secondary" style="flex:1;" onclick="editShot(${shot.id})">⚙️ Edit</button>
             <button class="btn btn-danger" style="width:36px; padding:0;" title="Delete" onclick="deleteShot(${shot.id})">×</button>
          </div>
        </div>
      </div>
    </div>`;
}

function editShot(shotId) { alert('Edit shot functionality to be updated...'); }
async function regenerateShot(shotId) { 
  if(!confirm('Are you sure you want to regenerate this shot image?')) return;
  try {
    const btn = event.target;
    const oldText = btn.innerHTML;
    btn.innerHTML = Cinematic.loader("image", "Regenerating...");
    btn.disabled = true;
    await api.post(`/shots/${shotId}/regenerate`);
    loadStoryboards();
  } catch(err) {
    alert('Regeneration failed: ' + err.message);
  }
}
async function deleteShot(shotId) { if(confirm('Delete shot?')) { await api.delete('/shots/'+shotId); loadStoryboards(); } }

async function generateShotVideo(shotId) {
  try {
    await api.post(`/shots/${shotId}/video`);
    loadStoryboards();
    if (!_shotPollings[shotId]) {
      _shotPollings[shotId] = setInterval(() => pollShotVideo(shotId), 3000);
    }
  } catch (err) { alert('Video generation failed: ' + err.message); }
}

async function pollShotVideo(shotId) {
  try {
    const res = await api.get(`/shots/${shotId}/video/status`);
    const shot = res.data.data || {};
    if (shot.video_status === 'completed' || shot.video_status === 'failed') {
      clearInterval(_shotPollings[shotId]);
      delete _shotPollings[shotId];
      loadStoryboards();
    }
  } catch (e) {
    clearInterval(_shotPollings[shotId]);
    delete _shotPollings[shotId];
  }
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}


window.generateStoryboard = async function() {
  const pid = ProjectState.id;
  const story = document.getElementById('sb-story').value.trim();
  const charId = document.getElementById('sb-char-select').value;
  const envId = document.getElementById('sb-env-select').value;
  const numShots = document.getElementById('sb-num-shots').value || 4;

  if (!story) return alert('Please enter a sequence description.');

  const btn = document.getElementById('sb-gen-btn');
  const status = document.getElementById('sb-gen-status');
  btn.disabled = true;
  btn.innerHTML = Cinematic.loader("filmstrip", "Creating Sequence...");
  status.textContent = '';

  try {
    // 1. Create Storyboard
    const sbRes = await api.post('/storyboards', {
      project_id: pid,
      character_id: charId || null,
      environment_id: envId || null,
      story_description: story
    });
    
    const sb = sbRes.data;
    
    // 2. Generate Shots
    btn.innerHTML = Cinematic.loader("filmstrip", "AI Generating Shots...");
    await api.post(`/storyboards/${sb.id}/generate`, { num_shots: parseInt(numShots) });
    
    status.textContent = 'Storyboard sequence generated!';
    status.style.color = 'var(--primary)';
    
    loadStoryboards();
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    status.style.color = 'var(--error)';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Storyboard Sequence';
  }
};


window.loadStoryboards = async function() {
  const pid = ProjectState.id;
  if (!pid) return;
  try {
    const res = await api.get('/storyboards?project_id=' + pid);
    const boards = res.data || res;
    if (boards && boards.length > 0) {
      _currentStoryboardId = boards[0].id;
      // Populate fields if they exist
      const storyEl = document.getElementById('sb-story');
      if (storyEl && !storyEl.value) storyEl.value = boards[0].story_description || '';
      
      renderShotsArea(boards[0]);
    } else {
      const area = document.getElementById('sb-shots-area');
      if (area) area.innerHTML = '<div style="color:var(--text-subtle); text-align:center; padding: 40px;">No storyboard sequence generated yet. Enter a description and click Generate.</div>';
    }
  } catch(e) {
    console.error('Failed to load storyboards', e);
  }
};

window.updateActiveReferences = function() {};
window.addNewShot = function() { alert('Manual shot addition coming soon!'); };
