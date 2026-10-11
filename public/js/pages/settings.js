/* Professional Settings Page */

function renderSettingsPage() {
  const container = document.getElementById('page-settings');
  const user = JSON.parse(localStorage.getItem('directro_user') || '{}');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>Application Settings</h1>
           <p>Configure your DIRECTRO AI studio workspace and AI integrations.</p>
         </div>
         <button class="btn btn-primary" onclick="alert('Settings saved successfully.')">Save Preferences</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
         <div class="card-header">Account Profile</div>
         <div class="card-body">
            <div class="form-group">
               <label class="form-label">Username</label>
               <input type="text" class="form-control" value="${user.username || ''}" disabled />
            </div>
            <div class="form-group">
               <label class="form-label">Email</label>
               <input type="text" class="form-control" value="${user.email || ''}" disabled />
            </div>
         </div>
      </div>
      
      <div class="card">
         <div class="card-header">Studio Preferences</div>
         <div class="card-body">
            <div class="form-group">
               <label class="form-label">Default Export Resolution</label>
               <select class="form-control">
                  <option>1920x1080 (1080p)</option>
                  <option>1280x720 (720p)</option>
                  <option>3840x2160 (4K)</option>
               </select>
            </div>
            <div class="form-group">
               <label class="form-label">Default Aspect Ratio</label>
               <select class="form-control">
                  <option>16:9 (Cinematic Widescreen)</option>
                  <option>9:16 (Vertical/Mobile)</option>
                  <option>1:1 (Square)</option>
               </select>
            </div>
         </div>
      </div>
    </div>
  `;
}
