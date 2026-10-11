
/* Professional Auth Page with Cinematic Animation */

function renderAuthPage() {
  const container = document.getElementById('page-auth');
  const isRegister = window.location.hash === '#register';
  
  const svgDirector = `
    <svg class="director-svg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMax meet">
       <defs>
          <linearGradient id="jacket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stop-color="#ffffff"/>
             <stop offset="100%" stop-color="#e0e0e0"/>
          </linearGradient>
       </defs>
       
       <g class="director-body" style="transform-origin: 250px 500px;">
           <!-- Head / Shoulders -->
           <path d="M 220,120 C 220,70 280,70 280,120 C 280,160 270,170 250,170 C 230,170 220,160 220,120 Z" fill="url(#jacket-grad)" stroke="#cccccc"/>
           <!-- Torso / Jacket -->
           <path d="M 250,170 C 250,170 190,190 170,250 C 150,310 130,500 130,500 L 370,500 C 370,500 350,310 330,250 C 310,190 250,170 250,170 Z" fill="url(#jacket-grad)" stroke="#cccccc"/>
           <!-- Collar details -->
           <path d="M 230,170 L 250,220 L 270,170 Z" fill="#111" stroke="#333"/>
           
           <!-- Arms holding Clapperboard -->
           <g class="director-arms-holding">
              <!-- Left Arm -->
              <path d="M 330,220 C 310,220 290,260 270,300 C 260,280 250,240 260,220 Z" fill="url(#jacket-grad)" stroke="#cccccc"/>
              <!-- Right Arm -->
              <path d="M 170,220 C 190,220 210,260 230,300 C 240,280 250,240 240,220 Z" fill="url(#jacket-grad)" stroke="#cccccc"/>
              
              <!-- Clapperboard (Centered) -->
              <g class="director-clapperboard">
                 <rect x="180" y="270" width="140" height="90" rx="4" fill="#ffffff" stroke="#999" stroke-width="2"/>
                 <text x="250" y="310" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#050505" text-anchor="middle" letter-spacing="1">DIRECTRO AI</text>
                 <text x="250" y="330" font-family="-apple-system, sans-serif" font-size="10" font-weight="600" fill="#333" text-anchor="middle" letter-spacing="2">— LOGIN —</text>
                 <rect x="210" y="340" width="80" height="3" fill="var(--primary)"/>
                 
                 <!-- Clapper Stick -->
                 <g class="director-clapper-stick">
                    <rect x="180" y="255" width="140" height="15" rx="2" fill="#ffffff" stroke="#999" stroke-width="2"/>
                    <path d="M200 255 L190 270 M230 255 L220 270 M260 255 L250 270 M290 255 L280 270 M320 255 L310 270" stroke="#999" stroke-width="2"/>
                 </g>
              </g>
           </g>
       </g>
    </svg>
  `;

  container.innerHTML = `
    <div class="cinematic-auth-wrapper">
       <div class="cinematic-scene">
          <div class="cinematic-spotlight"></div>
          ${svgDirector}
       </div>
       
       <div class="cinematic-auth-form-container">
          <div class="auth-card" style="width:100%;">
            <div class="auth-logo" style="text-align:left;">DIRECTRO AI</div>
            <div class="auth-tagline" style="text-align:left; margin-bottom:40px;">Cinematic Content Creation</div>

            <div id="auth-error" class="alert alert-error hidden" style="margin-bottom:16px;">
              <span class="alert-icon">⚠️</span>
              <span id="auth-error-msg"></span>
            </div>

            ${isRegister ? renderRegisterForm() : renderLoginForm()}
          </div>
       </div>
    </div>`;
}

function renderLoginForm() {
  return `
    <form id="login-form">
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" id="login-email" class="form-control" placeholder="director@studio.com" autocomplete="email" required />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="login-password" class="form-control" placeholder="••••••••" autocomplete="current-password" required />
      </div>
      <button type="submit" class="btn btn-primary btn-block mt-16" style="padding:12px;">
        Sign In to Workspace
      </button>
    </form>
    <div class="auth-switch mt-24" style="text-align:left;">
      Don't have an account? <a href="#register">Create account</a>
    </div>`;
}

function renderRegisterForm() {
  return `
    <form id="register-form">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" id="reg-username" class="form-control" placeholder="filmmaker123" autocomplete="username" required />
      </div>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" id="reg-email" class="form-control" placeholder="director@studio.com" autocomplete="email" required />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="reg-password" class="form-control" placeholder="At least 6 characters" autocomplete="new-password" required />
      </div>
      <button type="submit" class="btn btn-primary btn-block mt-16" style="padding:12px;">
        Create Account
      </button>
    </form>
    <div class="auth-switch mt-24" style="text-align:left;">
      Already have an account? <a href="#login">Sign in</a>
    </div>`;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  const msgEl = document.getElementById('auth-error-msg');
  if (el && msgEl) {
    msgEl.textContent = msg;
    el.classList.remove('hidden');
  }
}

function hideAuthError() {
  const el = document.getElementById('auth-error');
  if (el) el.classList.add('hidden');
}

document.addEventListener('submit', async (e) => {
  if (e.target.id === 'login-form') {
    e.preventDefault();
    hideAuthError();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Authenticating...';

    try {
      const res = await api.post('/auth/login', { email, password });
      api.setToken(res.data.token);
      localStorage.setItem('directro_user', JSON.stringify(res.data.user));
      AppRouter.user = res.data.user;
      AppRouter.showAppLayout();
      window.location.hash = '#dashboard';
    } catch (err) {
      showAuthError(err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In to Workspace';
    }
  }

  if (e.target.id === 'register-form') {
    e.preventDefault();
    hideAuthError();
    const btn = e.target.querySelector('button[type="submit"]');
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const res = await api.post('/auth/register', { username, email, password });
      api.setToken(res.data.token);
      localStorage.setItem('directro_user', JSON.stringify(res.data.user));
      AppRouter.user = res.data.user;
      AppRouter.showAppLayout();
      window.location.hash = '#dashboard';
    } catch (err) {
      showAuthError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }
});
