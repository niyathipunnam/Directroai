/* Professional Environment Page */

let _envPolling = null;

function renderEnvironmentPage() {
  if (_envPolling) { clearInterval(_envPolling); _envPolling = null; }

  const container = document.getElementById('page-environment');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Environment</h1>
           <p>Define the setting and upload visual references to maintain location consistency.</p>
         </div>
      </div>
    </div>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <!-- Left Col -->
      <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
        <div class="card">
          <div class="card-header">Setting Identity</div>
          <div class="card-body">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Environment Description</label>
              <textarea id="env-desc" class="form-control" placeholder="Describe the world, lighting, time of day, atmosphere..." rows="4"></textarea>
            </div>
            <div class="mt-16 text-right">
               <button class="btn btn-primary" onclick="alert('Environment identity saved.')">Save Setting</button>
            </div>
          </div>
        </div>

        <div class="card">
           <div class="card-header">Upload References</div>
           <div class="card-body text-center">
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Provide reference images of the location for the AI to base shots on.</p>
              <input type="file" id="env-upload" accept="image/*" class="hidden" onchange="uploadEnvImage()" />
              <button class="btn btn-secondary btn-block" onclick="document.getElementById('env-upload').click()">+ Upload Environment Image</button>
           </div>
        </div>
      </div>

      <!-- Right Col -->
      <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
        <div class="card">
          <div class="card-header">AI Environment Generation</div>
          <div class="card-body">
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Generate location concepts if you don't have reference images.</p>
            <div class="form-group">
               <label class="form-label">Generation Prompt</label>
               <textarea id="env-gen-prompt" class="form-control" placeholder="E.g. A dystopian cyberpunk city alleyway at night with neon puddles..." rows="3"></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="generateEnvironment()" id="btn-env-gen">Generate Environment with AI</button>
            <div id="env-gen-status" class="mt-16" style="font-size:12px; color:var(--primary); text-align:center;"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Environment Assets</div>
          <div class="card-body" id="env-list" style="min-height:150px; padding-top:20px;">
             <div class="loading-overlay" id="env-loading">`+Cinematic.loader("camera", "Loading Assets...")+`</div>
          </div>
        </div>
      </div>
    </div>`;

  if (pid) loadEnvironment();
}

async function uploadEnvImage() {
  const fileInput = document.getElementById('env-upload');
  const file = fileInput.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('project_id', ProjectState.id);
  fd.append('asset_type', 'environment');
  
  try {
    await api.post('/media/upload', fd, true);
    loadEnvironment();
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

async function loadEnvironment() {
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    const envs = (res.data || res).filter(a => a.asset_type === 'environment');
    const elist = document.getElementById('env-list');
    const loader = document.getElementById('env-loading');
    if(loader) loader.remove();
    
    if (envs.length === 0) {
      elist.innerHTML = Cinematic.emptyState("camera", "No Environment Assets", "Generate or upload references to begin.");
      return;
    }

    elist.innerHTML = '<div class="grid-3">' + envs.map(c => `
      <div class="media-item">
         <div class="media-thumbnail media-thumbnail-square">
            <img src="${c.url_path}" />
         </div>
         <div class="media-info">
            <div class="media-title">${c.filename || 'Generated Asset'}</div>
            <button class="btn btn-secondary btn-sm btn-block mt-8" onclick="animateAsset(${c.id})">Animate Image</button>
            <button class="btn btn-danger btn-sm btn-block mt-8" onclick="deleteEnvMedia(${c.id})">Delete</button>
         </div>
      </div>
    `).join('') + '</div>';
  } catch (err) {}
}

async function deleteEnvMedia(id) {
  if(!confirm('Permanently delete this environment asset?')) return;
  try { await api.delete('/media/' + id); loadEnvironment(); } catch(err) { alert(err.message); }
}

async function generateEnvironment() {
  const prompt = document.getElementById('env-gen-prompt').value.trim();
  if (!prompt) return alert('Please enter a generation prompt');

  document.getElementById('btn-env-gen').disabled = true;
  document.getElementById('btn-env-gen').textContent = 'Requesting...';
  
  try {
    const envRes = await api.post('/environments', {
       project_id: ProjectState.id,
       name: name,
       description: prompt
    });
    const envId = envRes.data.id;
    
    await api.post('/environments/' + envId + '/generate');
    
    document.getElementById('env-gen-status').textContent = 'Generation task queued...';
    
    _envPolling = setInterval(async () => {
       try {
         const pollRes = await api.get('/environments/' + envId + '/status');
         const st = pollRes.data.status;
         if (st === 'completed') {
            clearInterval(_envPolling); _envPolling = null;
            document.getElementById('env-gen-status').textContent = 'Generation complete!';
            document.getElementById('btn-env-gen').disabled = false;
            document.getElementById('btn-env-gen').textContent = 'Generate Environment with AI';
            loadEnvironment();
         } else if (st === 'failed') {
            clearInterval(_envPolling); _envPolling = null;
            document.getElementById('env-gen-status').textContent = 'Generation failed: ' + (pollRes.data.error || 'Unknown error');
            document.getElementById('btn-env-gen').disabled = false;
            document.getElementById('btn-env-gen').textContent = 'Generate Environment with AI';
         } else {
            document.getElementById('env-gen-status').textContent = 'AI is generating...';
         }
       } catch (e) {}
    }, 3000);
    
  } catch (err) {
    document.getElementById('btn-env-gen').disabled = false;
    document.getElementById('btn-env-gen').textContent = 'Generate Environment with AI';
    alert(err.message);
  }
}

// Dummy placeholder
async function pollEnvTask() {}


