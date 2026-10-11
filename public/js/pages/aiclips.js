/* Professional AI Clips Page */

function renderAiclipsPage() {
  const container = document.getElementById('page-aiclips');
  const pid = ProjectState.id;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>AI Generated Clips</h1>
           <p>Manage all your successfully generated AI video clips ready for the timeline.</p>
         </div>
      </div>
    </div>

    <div>
       <div class="card mb-24">
          <div class="card-header">Video Arsenal</div>
          <div class="card-body" id="ai-clips-container" style="min-height:300px;">
             <div class="loading-overlay" id="ai-clips-loading">`+Cinematic.loader("filmstrip", "Loading Clips...")+`</div>
          </div>
       </div>
    </div>`;

  if (pid) loadAiClips();
}

async function loadAiClips() {
  try {
    const res = await api.get('/media?project_id=' + ProjectState.id);
    const clips = (res.data || res).filter(a => a.asset_type === 'video');
    const container = document.getElementById('ai-clips-container');
    const loader = document.getElementById('ai-clips-loading');
    if (loader) loader.remove();

    if (clips.length === 0) {
      container.innerHTML = `
        `+Cinematic.emptyState("filmstrip", "No Video Clips Yet", "Generate AI shots from the Storyboard page first.")+``;
      return;
    }

    container.innerHTML = '<div class="grid-3">' + clips.map(c => `
      <div class="media-item">
         <div class="media-thumbnail">
            <video src="${c.url_path}" style="width:100%; height:100%; object-fit:cover;" controls></video>
         </div>
         <div class="media-info">
            <div class="media-title">${c.filename || 'Generated AI Clip'}</div>
            <div class="media-meta mt-8">
               <span class="badge badge-completed">READY</span>
               <span>${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div class="media-actions" style="display:flex; gap:8px;">
               <button class="btn btn-primary btn-sm" style="flex:1;" onclick="addVideoToEditor(${c.id})">+ Add to Timeline</button>
               <button class="btn btn-danger btn-sm" title="Delete" onclick="deleteAiClip(${c.id})">Delete</button>
            </div>
         </div>
      </div>
    `).join('') + '</div>';
  } catch(e) {
    const container = document.getElementById('ai-clips-container');
    if (container) container.innerHTML = `<div class="alert alert-error">Failed to load AI clips: ${e.message}</div>`;
  }
}

async function deleteAiClip(id) {
  if(!confirm('Permanently delete this AI clip?')) return;
  try {
     await api.delete('/media/' + id);
     loadAiClips();
  } catch(err) { alert(err.message); }
}

async function addVideoToEditor(id) {
  if (!ProjectState.id) {
    alert('Please select an active project first.');
    return;
  }
  try {
    await api.post('/editor/timeline', {
      project_id: ProjectState.id,
      media_asset_id: id,
      track_type: 'video',
      clip_label: 'AI Clip',
      duration: 5.0
    });
    alert('Clip added to your timeline! Opening editor...');
    window.location.hash = '#editor';
  } catch(err) {
    alert('Failed to add clip: ' + err.message);
  }
}
