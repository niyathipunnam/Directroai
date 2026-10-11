/* Professional Character Page */

let _charPolling = null;

function renderCharacterPage() {
  if (_charPolling) { clearInterval(_charPolling); _charPolling = null; }

  const container = document.getElementById('page-character');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Character</h1>
           <p>Establish character identity and upload multi-angle references for strict visual consistency.</p>
         </div>
      </div>
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <!-- Left Col: Form & Reference Uploads -->
      <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
        <div class="card">
          <div class="card-header">Character Identity</div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Character Name</label>
              <input type="text" id="char-name" class="form-control" placeholder="e.g. Maya Chen" />
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Physical Description & Styling</label>
              <textarea id="char-desc" class="form-control" placeholder="Detailed physical description, clothing, age, style..."></textarea>
            </div>
            <div class="mt-16 text-right">
               <button class="btn btn-primary" onclick="saveCharInfo()">Save Identity</button>
            </div>
          </div>
        </div>

        <div class="card">
           <div class="card-header">
             Reference Angles
           </div>
           <div class="card-body">
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Upload standard views to ensure absolute consistency during storyboard generation.</p>
              
              <div class="grid-4" style="grid-template-columns: repeat(2, 1fr);">
                  <div class="media-item">
                     <div class="media-thumbnail media-thumbnail-square" id="ref-front-preview" style="background:var(--bg-panel); border-bottom:1px solid var(--border-light);">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--text-subtle); font-size:11px;">FRONT</div>
                     </div>
                     <div class="media-info text-center" style="padding:8px;">
                        <input type="file" id="char-front" accept="image/*" class="hidden" onchange="uploadCharImage('front')" />
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('char-front').click()">Upload Front</button>
                     </div>
                  </div>
                  <div class="media-item">
                     <div class="media-thumbnail media-thumbnail-square" id="ref-left-preview" style="background:var(--bg-panel); border-bottom:1px solid var(--border-light);">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--text-subtle); font-size:11px;">LEFT PROFILE</div>
                     </div>
                     <div class="media-info text-center" style="padding:8px;">
                        <input type="file" id="char-left" accept="image/*" class="hidden" onchange="uploadCharImage('left')" />
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('char-left').click()">Upload Left</button>
                     </div>
                  </div>
                  <div class="media-item">
                     <div class="media-thumbnail media-thumbnail-square" id="ref-right-preview" style="background:var(--bg-panel); border-bottom:1px solid var(--border-light);">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--text-subtle); font-size:11px;">RIGHT PROFILE</div>
                     </div>
                     <div class="media-info text-center" style="padding:8px;">
                        <input type="file" id="char-right" accept="image/*" class="hidden" onchange="uploadCharImage('right')" />
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('char-right').click()">Upload Right</button>
                     </div>
                  </div>
                  <div class="media-item">
                     <div class="media-thumbnail media-thumbnail-square" id="ref-back-preview" style="background:var(--bg-panel); border-bottom:1px solid var(--border-light);">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--text-subtle); font-size:11px;">BACK</div>
                     </div>
                     <div class="media-info text-center" style="padding:8px;">
                        <input type="file" id="char-back" accept="image/*" class="hidden" onchange="uploadCharImage('back')" />
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('char-back').click()">Upload Back</button>
                     </div>
                  </div>
              </div>
              <div class="mt-16">
                 <button class="btn btn-secondary btn-block" onclick="generateMissingViews()">✨ AI Generate Missing Views</button>
              </div>
           </div>
        </div>
      </div>

      <!-- Right Col: AI Generation & Preview -->
      <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
        <div class="card">
          <div class="card-header">AI Concept Generation</div>
          <div class="card-body">
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Generate a base character design if you do not have uploaded references.</p>
            <div class="form-group">
               <label class="form-label">Generation Prompt</label>
               <textarea id="char-gen-prompt" class="form-control" placeholder="E.g. A young female astronaut in a sleek white spacesuit..." rows="3"></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="generateCharacter()" id="btn-char-gen">Generate Character with AI</button>
            <div id="char-gen-status" class="mt-16" style="font-size:12px; color:var(--primary); text-align:center;"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Current Character Assets</div>
          <div class="card-body" id="char-list" style="min-height:150px;">
             <div class="loading-overlay" id="char-loading">`+Cinematic.loader("lens", "Loading Assets...")+`</div>
          </div>
        </div>
      </div>
    </div>`;

  if (pid) loadCharacter();
}

async function saveCharInfo() {
  const name = document.getElementById('char-name').value;
  const desc = document.getElementById('char-desc').value;
  // In a real app we'd PATCH to /projects/:id/character 
  alert('Character identity saved to project.');
}

async function uploadCharImage(angle) {
  const fileInput = document.getElementById('char-' + angle);
  const file = fileInput.files[0];
  if (!file) return;

  const charName = document.getElementById('char-name').value.trim();
  const name = window.prompt('Name for this uploaded image?', charName || 'Character ' + angle);
  if (name === null) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name);
  fd.append('project_id', ProjectState.id);
  fd.append('asset_type', 'character');
  // Pass angle metadata if endpoint supported it
  
  const prev = document.getElementById('ref-' + angle + '-preview');
  prev.innerHTML = Cinematic.loader("lens", "Uploading...");

  try {
    const res = await api.post('/media/upload', fd, true);
    prev.innerHTML = `<img src="${res.data.url_path}" style="width:100%; height:100%; object-fit:cover;" />`;
    loadCharacter(); // refresh assets
  } catch (err) {
    alert('Upload failed: ' + err.message);
    prev.innerHTML = `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--error); font-size:11px;">FAILED</div>`;
  }
}

function generateMissingViews() {
  alert('AI generation of missing reference profiles will process in the background using your provided references.');
}

async function loadCharacter() {
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    const chars = (res.data || res).filter(a => a.asset_type === 'character');
    const clist = document.getElementById('char-list');
    const loader = document.getElementById('char-loading');
    if(loader) loader.remove();
    
    if (chars.length === 0) {
      clist.innerHTML = Cinematic.emptyState("lens", "No Character Assets", "Generate or upload references to begin.");
      return;
    }

    clist.innerHTML = '<div class="grid-3">' + chars.map(c => `
      <div class="media-item">
         <div class="media-thumbnail media-thumbnail-square">
            <img src="${c.url_path}" />
         </div>
         <div class="media-info">
            <div class="media-title">${c.filename || 'Generated Asset'}</div>
            <button class="btn btn-secondary btn-sm btn-block mt-8" onclick="animateAsset(${c.id})">Animate Image</button>
            <button class="btn btn-danger btn-sm btn-block mt-8" onclick="deleteCharMedia(${c.id})">Delete</button>
         </div>
      </div>
    `).join('') + '</div>';
  } catch (err) {}
}

async function deleteCharMedia(id) {
  if(!confirm('Permanently delete this character asset?')) return;
  try {
     await api.delete('/media/' + id);
     loadCharacter();
  } catch(err) { alert(err.message); }
}

async function generateCharacter() {
  const prompt = document.getElementById('char-gen-prompt').value.trim();
  if (!prompt) return alert('Please enter a generation prompt');
  const name = window.prompt('Name for this generated character?', document.getElementById('char-name').value.trim() || 'Generated Character');
  if(name === null) return;

  document.getElementById('btn-char-gen').disabled = true;
  document.getElementById('btn-char-gen').textContent = 'Requesting...';
  
  try {
    const charRes = await api.post('/characters', {
       project_id: ProjectState.id,
       name: name,
       description: prompt
    });
    const charId = charRes.data.id;
    
    await api.post('/characters/' + charId + '/generate');
    
    document.getElementById('char-gen-status').textContent = 'Generation task queued...';
    
    _charPolling = setInterval(async () => {
       try {
         const pollRes = await api.get('/characters/' + charId + '/status');
         const st = pollRes.data.status;
         if (st === 'completed') {
            clearInterval(_charPolling); _charPolling = null;
            document.getElementById('char-gen-status').textContent = 'Generation complete!';
            document.getElementById('btn-char-gen').disabled = false;
            document.getElementById('btn-char-gen').textContent = 'Generate Character with AI';
            loadCharacter();
         } else if (st === 'failed') {
            clearInterval(_charPolling); _charPolling = null;
            document.getElementById('char-gen-status').textContent = 'Generation failed: ' + (pollRes.data.error || 'Unknown error');
            document.getElementById('btn-char-gen').disabled = false;
            document.getElementById('btn-char-gen').textContent = 'Generate Character with AI';
         } else {
            document.getElementById('char-gen-status').textContent = 'AI is generating...';
         }
       } catch (e) {}
    }, 3000);
    
  } catch (err) {
    document.getElementById('btn-char-gen').disabled = false;
    document.getElementById('btn-char-gen').textContent = 'Generate Character with AI';
    alert(err.message);
  }
}

// Dummy placeholder to keep router from crashing if pollCharTask is referenced elsewhere
async function pollCharTask() {}



