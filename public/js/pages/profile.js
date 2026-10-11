function renderProfilePage() {
  const container = document.getElementById('page-profile');
  const storedUser = JSON.parse(localStorage.getItem('directro_user') || '{}');
  const user = AppRouter.user || storedUser || { username: 'Filmmaker', email: 'director@studio.com', created_at: new Date().toISOString() };
  const displayName = user.username || user.name || 'Filmmaker';
  const initial = displayName.charAt(0).toUpperCase() || 'U';
  
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
         <div>
           <h1>User Profile</h1>
           <p>Manage your account settings and preferences.</p>
         </div>
      </div>
    </div>

    <div style="display:flex; justify-content:center; padding-top: 40px;">
      <div class="card" style="width: 100%; max-width: 500px;">
        <div class="card-header">Account Details</div>
        <div class="card-body" style="display:flex; flex-direction:column; align-items:center; gap: 24px; padding: 40px 24px;">
          
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #7b5ffd, #5a55d1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32px; font-weight: bold; box-shadow: 0 4px 12px rgba(123,95,253,0.3);">
            ${initial}
          </div>
          
          <div style="text-align:center;">
            <div style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px;">${escHtml(displayName)}</div>
            <div style="color: #9AA1AD; font-size: 14px;">${escHtml(user.email || 'No email attached')}</div>
          </div>
          
          <div style="width: 100%; border-top: 1px solid var(--border-light); padding-top: 24px; display:flex; flex-direction:column; gap: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#9AA1AD; font-size:13px;">Account Status</span>
              <span class="badge badge-completed">Active</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#9AA1AD; font-size:13px;">Member Since</span>
              <span style="color:#E2E8F0; font-size:13px; font-weight:500;">${new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="width: 100%; border-top: 1px solid var(--border-light); padding-top: 24px; margin-top: 8px;">
            <button onclick="AppRouter.logout()" style="width: 100%; background: transparent; border: 1px solid #fd5f8e; color: #fd5f8e; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(253,95,142,0.1)'" onmouseout="this.style.background='transparent'">
              Logout
            </button>
          </div>
          
        </div>
      </div>
    </div>
  `;
}
window.renderProfilePage = renderProfilePage;
