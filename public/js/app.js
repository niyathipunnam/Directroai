/* ============================================================
   DIRECTRO AI - Main App Router
   ============================================================ */

const AppRouter = {
  user: null,

  async init() {
    const token = api.getToken();
    if (!token) {
      this.showAuthPage();
      return;
    }

    try {
      const res = await api.get('/auth/me');
      this.user = res.data;
      localStorage.setItem('directro_user', JSON.stringify(res.data));
      this.showAppLayout();
      const hash = window.location.hash || '#dashboard';
      this.routeTo(hash);
    } catch (e) {
      api.clearToken();
      this.showAuthPage();
    }
  },

  showAuthPage() {
    document.getElementById('page-auth').classList.remove('hidden');
          
    document.getElementById('page-auth').classList.add('page-animate-enter');
    document.getElementById('app-layout').classList.add('hidden');
    renderAuthPage();
  },

  showAppLayout() {
    document.getElementById('page-auth').classList.add('hidden');
    document.getElementById('page-auth').classList.remove('page-animate-enter');
    document.getElementById('app-layout').classList.remove('hidden');
          
    renderNav();
  },

  routeTo(hash) {
    const cleanHash = hash.split('?')[0] || '#dashboard';

    // Hide all pages and remove animations
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('page-animate-enter');
    });

    if (typeof setActiveNav === 'function') setActiveNav(cleanHash);

    // Cancel any running polls when navigating away
    if (api && api.cancelPoll) api.cancelPoll();

    const showPage = (id, renderFn) => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
          
          
            el.classList.add('page-animate-enter');
        }
        if (typeof renderFn === 'function') renderFn();
    };

    switch (cleanHash) {
      case '#dashboard':
        showPage('page-dashboard', window.renderDashboard);
        break;
      case '#character':
        showPage('page-character', window.renderCharacterPage);
        break;
      case '#environment':
        showPage('page-environment', window.renderEnvironmentPage);
        break;
      case '#storyboard':
        showPage('page-storyboard', window.renderStoryboardPage);
        break;
      case '#aiclips':
        showPage('page-aiclips', window.renderAiclipsPage);
        break;
      case '#audio':
        showPage('page-audio', window.renderAudioPage);
        break;
      case '#media':
        showPage('page-media', window.renderMediaPage);
        break;
      case '#editor':
        showPage('page-editor', window.renderEditorPage);
        break;
      case '#settings':
        showPage('page-settings', window.renderSettingsPage);
        break;
      case '#profile':
        showPage('page-profile', window.renderProfilePage);
        break;
      case '#export':
        showPage('page-export', window.renderExportPage);
        break;
      case '#login':
      case '#register':
        this.showAuthPage();
        break;
      default:
        showPage('page-dashboard', window.renderDashboard);
    }
  },

  logout() {
    if (typeof Modal !== 'undefined') {
        Modal.confirm(
          'Sign Out',
          'Are you sure you want to sign out?',
          () => {
            api.clearToken();
            if (typeof ProjectState !== 'undefined') ProjectState.clear();
            window.location.hash = '#login';
            this.showAuthPage();
          },
          'Sign Out',
          'btn-danger'
        );
    }
  },
};

// Hash-based routing
window.addEventListener('hashchange', () => {
  AppRouter.routeTo(window.location.hash);
});

// Boot
document.addEventListener('DOMContentLoaded', () => AppRouter.init());


window.animateAsset = async function(id) {
  if(!confirm('Animate this image into a video? This will take a few minutes.')) return;
  try {
    const prompt = window.prompt('Enter motion prompt (optional):', 'slow pan');
    await api.post('/media/' + id + '/animate', { prompt });
    alert('Video generation started! Check the AI Videos tab in the Media Library shortly.');
  } catch (err) {
    alert('Animation failed: ' + err.message);
  }
};

