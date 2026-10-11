/* ============================================================
   DIRECTRO AI – API Client
   All API calls go through Node.js backend.
   NO API KEYS ARE STORED HERE.
   ============================================================ */

const API_BASE = '/api';

const api = {
  _token: null,

  getToken() {
    return this._token || localStorage.getItem('directro_token');
  },

  setToken(t) {
    this._token = t;
    localStorage.setItem('directro_token', t);
  },

  clearToken() {
    this._token = null;
    localStorage.removeItem('directro_token');
    localStorage.removeItem('directro_user');
  },

  async fetch(path, options = {}) {
    const token = this.getToken();
    const headers = { ...(options.headers || {}) };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(API_BASE + path, { ...options, headers });
    } catch (networkErr) {
      throw new Error('Network error: Could not connect to server. Is it running?');
    }

    // Handle non-JSON responses
    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      if (res.status === 401) {
        this.clearToken();
        if (window.location.hash !== '#login' && window.location.hash !== '#register') {
          window.location.hash = '#login';
        }
      }
      const errMsg = data.error || data.message || data.detail || `Request failed (HTTP ${res.status})`;
      throw new Error(errMsg);
    }

    return data;
  },

  get(path) {
    return this.fetch(path, { method: 'GET' });
  },

  post(path, body) {
    if (body instanceof FormData) {
      return this.fetch(path, { method: 'POST', body });
    }
    return this.fetch(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put(path, body) {
    return this.fetch(path, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(path) {
    return this.fetch(path, { method: 'DELETE' });
  },

  /**
   * Poll a status endpoint until completed or failed.
   * @param {string} statusPath - API path to poll
   * @param {Function} onUpdate - callback with latest data each poll
   * @param {number} intervalMs - polling interval
   * @param {number} maxAttempts - max poll attempts before timeout
   */
  pollStatus(statusPath, onUpdate, intervalMs = 3000, maxAttempts = 60) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let stopped = false;

      const interval = setInterval(async () => {
        if (stopped) return;
        try {
          attempts++;
          const res = await this.get(statusPath);
          onUpdate(res.data || res);

          const d = res.data || res;
          const status = d.status || d.video_status;

          if (status === 'completed') {
            stopped = true;
            clearInterval(interval);
            resolve(res);
          } else if (status === 'failed') {
            stopped = true;
            clearInterval(interval);
            reject(new Error(d.error || 'Generation failed. Please retry.'));
          } else if (attempts >= maxAttempts) {
            stopped = true;
            clearInterval(interval);
            reject(new Error('Timeout: generation is taking too long. Check the AI service.'));
          }
        } catch (e) {
          stopped = true;
          clearInterval(interval);
          reject(e);
        }
      }, intervalMs);

      // Return a cancel function
      this._lastPollCancel = () => {
        stopped = true;
        clearInterval(interval);
      };
    });
  },

  cancelPoll() {
    if (this._lastPollCancel) {
      this._lastPollCancel();
      this._lastPollCancel = null;
    }
  },
};

// Active project helper
const ProjectState = {
  get id() { return parseInt(localStorage.getItem('directro_project_id')) || null; },
  set id(v) {
    if (v) localStorage.setItem('directro_project_id', v);
    else localStorage.removeItem('directro_project_id');
  },
  clear() { localStorage.removeItem('directro_project_id'); },
};
