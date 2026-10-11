/* Professional Navigation Component */

const Icons = {
  dash: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  proj: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  char: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  env: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  story: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  video: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  audio: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  media: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  export: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  save: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
};

async function renderNav() {
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const user = JSON.parse(localStorage.getItem('directro_user') || '{}');

  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <a href="#dashboard" class="sidebar-logo-icon" title="DIRECTRO AI - Dashboard">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="26" height="26" rx="6" stroke="#4F46E5" stroke-width="2" fill="none" opacity="0.4"/>
            <rect x="6" y="6" width="20" height="20" rx="4" fill="#0B0D10" stroke="#6366F1" stroke-width="1.8"/>
            <circle cx="16" cy="16" r="4.5" fill="#4F46E5"/>
            <path d="M16 8V11.5M16 20.5V24M8 16H11.5M20.5 16H24" stroke="#818CF8" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="23" cy="9" r="1.5" fill="#A5B4FC"/>
          </svg>
        </a>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-title">
            DIRECTRO <span class="sidebar-brand-badge">AI</span>
          </div>
          <div class="sidebar-brand-tagline">Studio Hub</div>
        </div>
      </div>
      <div class="sidebar-nav">
        <div class="sidebar-section-title">Production</div>
        <a class="nav-item" data-hash="#dashboard" href="#dashboard" title="Dashboard"><span class="nav-icon">${Icons.dash}</span><span class="nav-label">Dashboard</span></a>
        <a class="nav-item" data-hash="#character" href="#character" title="Character Design"><span class="nav-icon">${Icons.char}</span><span class="nav-label">Characters</span></a>
        <a class="nav-item" data-hash="#environment" href="#environment" title="Environment"><span class="nav-icon">${Icons.env}</span><span class="nav-label">Worlds</span></a>
        <a class="nav-item" data-hash="#storyboard" href="#storyboard" title="Storyboard"><span class="nav-icon">${Icons.story}</span><span class="nav-label">Storyboard</span></a>
        
        <div class="sidebar-section-title" style="margin-top:6px;">Generation & Cut</div>
        <a class="nav-item" data-hash="#aiclips" href="#aiclips" title="AI Video Clips"><span class="nav-icon">${Icons.video}</span><span class="nav-label">Video AI</span></a>
        <a class="nav-item" data-hash="#audio" href="#audio" title="Audio & Voice"><span class="nav-icon">${Icons.audio}</span><span class="nav-label">Voice / Audio</span></a>
        <a class="nav-item" data-hash="#editor" href="#editor" title="Timeline Editor"><span class="nav-icon">${Icons.edit}</span><span class="nav-label">Timeline</span></a>
        <a class="nav-item" data-hash="#media" href="#media" title="Media Library"><span class="nav-icon">${Icons.media}</span><span class="nav-label">Library</span></a>
        
        <div class="sidebar-divider"></div>
        <a class="nav-item" data-hash="#settings" href="#settings" title="Settings"><span class="nav-icon">${Icons.settings}</span><span class="nav-label">Settings</span></a>
      </div>
    `;
  }

  
  
  
  if (topbar) {
    const displayName = user.username || user.name || 'Filmmaker';
    const email = user.email || 'director@studio.com';
    const initial = displayName.charAt(0).toUpperCase() || 'U';

    const currentHash = window.location.hash || '#dashboard';
    const pageLabels = {
      '#dashboard': 'Dashboard',
      '#character': 'Character Design',
      '#environment': 'Environment',
      '#storyboard': 'Storyboard',
      '#aiclips': 'AI Video Clips',
      '#audio': 'Audio & Voice',
      '#media': 'Media Library',
      '#editor': 'Timeline Editor',
      '#export': 'Export & Render',
      '#settings': 'Studio Settings',
      '#profile': 'User Profile'
    };
    const currentPageLabel = pageLabels[currentHash] || 'Studio Workspace';

    topbar.innerHTML = `
      <!-- LEFT SECTION: DIRECTRO AI LOGO & BRAND IDENTITY -->
      <div class="header-left">
        <a class="header-brand" href="#dashboard" title="DIRECTRO AI - Home">
          <div class="header-brand-logo">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="26" height="26" rx="6" stroke="#4F46E5" stroke-width="2" fill="none" opacity="0.4"/>
              <rect x="6" y="6" width="20" height="20" rx="4" fill="#0B0D10" stroke="#6366F1" stroke-width="1.8"/>
              <circle cx="16" cy="16" r="4.5" fill="#4F46E5"/>
              <path d="M16 8V11.5M16 20.5V24M8 16H11.5M20.5 16H24" stroke="#818CF8" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="23" cy="9" r="1.5" fill="#A5B4FC"/>
            </svg>
          </div>
          <div class="header-brand-text">
            <div class="header-brand-title">
              DIRECTRO <span class="header-brand-badge">AI</span>
            </div>
            <div class="header-brand-tagline">Direct Every Frame.</div>
          </div>
        </a>
      </div>

      <!-- CENTER SECTION: ACTIVE PROJECT & CURRENT WORKSPACE -->
      <div class="header-center">
        <div class="header-project-pill">
          <div class="header-project-indicator" id="header-project-indicator"></div>
          <div class="header-project-info">
            <div class="header-project-name" id="topbar-project-name">No Project Selected</div>
            <div class="header-project-page" id="topbar-page-label">${currentPageLabel}</div>
          </div>
        </div>
        <select class="header-project-select" id="nav-project-select" title="Switch Active Production">
          <option value="">Select Project</option>
        </select>
      </div>

      <!-- RIGHT SECTION: PROFILE & USER CONTROLS -->
      <div class="header-right">
        <!-- User Profile & Dropdown -->
        <div style="position: relative;">
          <div class="header-profile-trigger" id="header-profile-btn" onclick="toggleHeaderProfile(event)" title="User Profile & Settings">
            <div class="header-avatar">${initial}</div>
            <span class="header-profile-name">${displayName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9AA1AD" stroke-width="2" style="margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <div class="header-dropdown-menu" id="profile-dropdown">
            <div class="header-dropdown-header">
              <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; line-height:1.2;">${displayName}</div>
              <div style="font-size: 11px; color: #9AA1AD; margin-top: 3px; word-break: break-all;">${email}</div>
            </div>

            <div class="header-dropdown-item" onclick="closeHeaderProfile(); window.location.hash='#profile';">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
              <span>Profile Settings</span>
            </div>

            <div class="header-dropdown-item" onclick="closeHeaderProfile(); window.location.hash='#settings';">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Studio Preferences</span>
            </div>

            <div style="height:1px; background:#20242E; margin:4px 0;"></div>

            <div class="header-dropdown-item danger" onclick="closeHeaderProfile(); AppRouter.logout();">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sign Out</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  loadNavProjects();
  setActiveNav(window.location.hash);
  updateHeaderPageLabel(window.location.hash);
  window.addEventListener('hashchange', () => {
    setActiveNav(window.location.hash);
    updateHeaderPageLabel(window.location.hash);
  });
}

function toggleHeaderProfile(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profile-dropdown');
  if (menu) {
    const isShown = menu.style.display === 'block';
    menu.style.display = isShown ? 'none' : 'block';
  }
}

function closeHeaderProfile() {
  const menu = document.getElementById('profile-dropdown');
  if (menu) menu.style.display = 'none';
}

document.addEventListener('click', (e) => {
  const trigger = document.getElementById('header-profile-btn');
  const menu = document.getElementById('profile-dropdown');
  if (menu && menu.style.display === 'block') {
    if (!trigger || (!trigger.contains(e.target) && !menu.contains(e.target))) {
      menu.style.display = 'none';
    }
  }
});

function updateHeaderPageLabel(hash) {
  const cleanHash = (hash || window.location.hash || '#dashboard').split('?')[0];
  const pageLabels = {
    '#dashboard': 'Dashboard',
    '#character': 'Character Design',
    '#environment': 'Environment',
    '#storyboard': 'Storyboard',
    '#aiclips': 'AI Video Clips',
    '#audio': 'Audio & Voice',
    '#media': 'Media Library',
    '#editor': 'Timeline Editor',
    '#export': 'Export & Render',
    '#settings': 'Studio Settings',
    '#profile': 'User Profile'
  };
  const el = document.getElementById('topbar-page-label');
  if (el) el.textContent = pageLabels[cleanHash] || 'Studio Workspace';
}

async function loadNavProjects() {
  try {
    const res = await api.get('/projects');
    const select = document.getElementById('nav-project-select');
    const tbName = document.getElementById('topbar-project-name');
    const indicator = document.getElementById('header-project-indicator');
    if (!select) return;

    const projects = res.data || [];
    let currentId = ProjectState.id;
    select.innerHTML = '<option value="">Select Project</option>';
    let foundActive = false;

    // If no project is selected but projects exist, default to the most recent one
    if (!currentId && projects.length > 0) {
      currentId = projects[0].id;
      ProjectState.id = currentId;
    }

    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === currentId) {
        opt.selected = true;
        foundActive = true;
        if (tbName) tbName.textContent = p.name;
        if (indicator) indicator.style.background = '#10B981';
      }
      select.appendChild(opt);
    });

    if (!foundActive) {
      if (tbName) tbName.textContent = 'No Project Selected';
      if (indicator) indicator.style.background = '#6B7280';
    }

    select.onchange = () => {
      const val = parseInt(select.value) || null;
      ProjectState.id = val;
      const opt = select.options[select.selectedIndex];
      if (tbName) tbName.textContent = val ? opt.textContent : 'No Project Selected';
      if (indicator) indicator.style.background = val ? '#10B981' : '#6B7280';
      
      document.dispatchEvent(new CustomEvent('projectChanged', { detail: { project_id: val } }));
      const hash = window.location.hash || '#dashboard';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
  } catch (e) {}
}

function setActiveNav(hash) {
  const cleanHash = hash.split('?')[0] || '#dashboard';
  document.querySelectorAll('.nav-item').forEach(el => {
    const h = el.getAttribute('data-hash');
    if (h === cleanHash) {
       el.classList.add('active');
    } else {
       el.classList.remove('active');
    }
  });
}

function refreshNavProjects() { loadNavProjects(); }

