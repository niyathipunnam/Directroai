/* Professional Dashboard Page */

async function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  const user = JSON.parse(localStorage.getItem('directro_user') || '{}');
  
  const tbName = document.getElementById('topbar-project-name');
  if(tbName && !ProjectState.id) tbName.textContent = 'Dashboard';

  container.innerHTML = `
    <div class="dash-welcome-banner mb-24">
      <div class="dash-welcome-info">
        <h1 class="dash-title">Production Slate</h1>
        <p class="dash-subtitle">Welcome back, <strong style="color:var(--text-main);">${user.username || 'Filmmaker'}</strong>. Direct your AI films, generate assets, and assemble timeline cuts.</p>
      </div>
      <div class="dash-actions">
        <button class="btn btn-primary" onclick="openNewProjectModal()" style="padding:10px 20px; font-weight:600; font-size:14px; box-shadow:0 4px 14px rgba(79,70,229,0.35);">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>
    </div>

    <!-- Quick Stats Overview -->
    <div id="dash-stats" class="dash-stats-grid mb-24"></div>

    <div class="dash-section-header mb-16">
      <div class="dash-section-title-wrap">
        <h3 class="dash-section-title">Active Film Projects</h3>
        <span class="dash-section-badge" id="dash-project-count-badge">0 Projects</span>
      </div>
    </div>
    
    <div id="dash-projects" style="position:relative; min-height:200px;">
      <div class="loading-overlay">${Cinematic.loader('clapper', 'Loading your slate...')}</div>
    </div>`;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const res = await api.get('/projects');
    const projects = res.data || [];
    const countBadge = document.getElementById('dash-project-count-badge');
    if (countBadge) countBadge.textContent = `${projects.length} Project${projects.length === 1 ? '' : 's'}`;

    const activeCount = projects.filter(p => p.status === 'active').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;

    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Total Productions</span>
          <div class="stat-icon-wrap" style="color:#6366F1; background:rgba(99,102,241,0.1);">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          </div>
        </div>
        <div class="stat-card-value">${projects.length}</div>
        <div class="stat-card-sub">All projects in workspace</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">In Production</span>
          <div class="stat-icon-wrap" style="color:#10B981; background:rgba(16,185,129,0.1);">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
        </div>
        <div class="stat-card-value">${activeCount || projects.length}</div>
        <div class="stat-card-sub">Active timelines & assets</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Studio Status</span>
          <div class="stat-icon-wrap" style="color:#F59E0B; background:rgba(245,158,11,0.1);">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          </div>
        </div>
        <div class="stat-card-value" style="font-size:20px; font-weight:700; color:#10B981; display:flex; align-items:center; gap:8px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#10B981; display:inline-block; box-shadow:0 0 8px #10B981;"></span>
          Operational
        </div>
        <div class="stat-card-sub">AI pipelines ready</div>
      </div>`;

    const el = document.getElementById('dash-projects');
    if (projects.length === 0) {
      el.innerHTML = `
        ${Cinematic.emptyState('clapper', 'No projects found', 'Start your first cinematic AI project to unlock generation tools and timeline editing.')}
        <div class="text-center" style="margin-top:-20px; margin-bottom:20px;">
           <button class="btn btn-primary" onclick="openNewProjectModal()">+ Create Project</button>
        </div>`;
      return;
    }

    el.innerHTML = `<div class="dash-projects-grid">${projects.map(projectCard).join('')}</div>`;
  } catch (err) {
    document.getElementById('dash-projects').innerHTML = `
      <div class="card" style="padding:20px; text-align:center; border-color:var(--error);">
        <div style="color:var(--error); margin-bottom:10px;">Failed to load projects: ${err.message}</div>
        <button class="btn btn-secondary" onclick="loadDashboardData()">Retry Connection</button>
      </div>`;
  }
}

function projectCard(p) {
  const date = new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const statusLabel = (p.status || 'active').toUpperCase();
  return `
    <div class="dash-project-card" onclick="openProject(${p.id})">
      <div class="dash-project-card-header">
        <div class="dash-project-title-area">
          <h4 class="dash-project-title" title="${escHtml(p.name)}">${escHtml(p.name)}</h4>
          <span class="dash-project-status">${statusLabel}</span>
        </div>
      </div>
      <div class="dash-project-card-body">
        <p class="dash-project-desc">${escHtml(p.description || 'No premise or description specified.')}</p>
      </div>
      <div class="dash-project-card-footer">
        <div class="dash-project-date">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${date}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openProject(${p.id})">
          Open Studio
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:2px;"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>`;
}

function openProject(id) {
  ProjectState.id = id;
  const select = document.getElementById('nav-project-select');
  if (select) select.value = id;
  
  const tbName = document.getElementById('topbar-project-name');
  if(tbName) {
      const pData = select ? select.options[select.selectedIndex].textContent : 'Project';
      tbName.textContent = pData;
  }
  window.location.hash = '#character';
}

function openNewProjectModal() {
  Modal.show('New Production', `
    <form id="new-project-form" style="display:flex; flex-direction:column; gap:16px;">
      <div class="form-group" style="margin:0;">
        <label class="form-label">Project Title</label>
        <input type="text" id="proj-name" class="form-control" placeholder="e.g. Cinematic Short Film" required />
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Description (Optional)</label>
        <textarea id="proj-desc" class="form-control" placeholder="Brief premise of your film..." rows="3"></textarea>
      </div>
      <div id="proj-error" class="hidden" style="color:var(--error-light); font-size:12px; padding:10px; background:rgba(200,0,0,0.1); border-radius:var(--radius);"></div>
    </form>`,
    [
      { label: 'Cancel', cls: 'btn-secondary', onclick: 'Modal.close()' },
      { label: 'Create Project', cls: 'btn-primary', onclick: 'submitNewProject()' },
    ]
  );
  setTimeout(() => document.getElementById('proj-name')?.focus(), 100);
}

async function submitNewProject() {
  const name = document.getElementById('proj-name')?.value?.trim();
  const desc = document.getElementById('proj-desc')?.value?.trim();
  const errEl = document.getElementById('proj-error');

  if (!name) {
    errEl.textContent = 'Project title is required.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const res = await api.post('/projects', { name, description: desc });
    Modal.close();
    ProjectState.id = res.data.id;
    refreshNavProjects();
    loadDashboardData();
    window.location.hash = '#character';
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
