/* ==========================================================
   DIRECTRO AI - Cinematic SVGs (Dark Theme)
   ========================================================== */

const Cinematic = {
  // 1. Clapperboard (Dashboard / Storyboard)
  getClapperboard: () => `
    <svg class="anim-clapper" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Base Board -->
      <rect x="4" y="16" width="40" height="26" rx="2" fill="#202020" stroke="#444" stroke-width="2"/>
      <!-- Clapper Stick -->
      <g class="anim-clapper-stick">
        <rect x="4" y="6" width="40" height="8" rx="2" fill="#202020" stroke="#eeeeee" stroke-width="2"/>
        <path d="M12 6L8 14 M22 6L18 14 M32 6L28 14 M42 6L38 14" stroke="#eeeeee" stroke-width="2"/>
      </g>
    </svg>
  `,

  // 2. Camera (AI Video Generation / Environment)
  getCamera: () => `
    <svg class="anim-camera" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <rect x="8" y="20" width="22" height="16" rx="2" fill="#202020" stroke="#444" stroke-width="2"/>
      <!-- Lens -->
      <path d="M30 22 L38 18 L38 38 L30 34 Z" fill="#202020" stroke="#444" stroke-width="2"/>
      <circle cx="36" cy="28" r="4" fill="#0a0a0a"/>
      <!-- Reels -->
      <g class="anim-cam-reel" style="transform-origin: 14px 14px;">
         <circle cx="14" cy="14" r="6" fill="#202020" stroke="#707070" stroke-width="2"/>
         <path d="M14 8 L14 20 M8 14 L20 14" stroke="#707070" stroke-width="2"/>
      </g>
      <g class="anim-cam-reel" style="transform-origin: 26px 14px;">
         <circle cx="26" cy="14" r="6" fill="#202020" stroke="#707070" stroke-width="2"/>
         <path d="M26 8 L26 20 M20 14 L32 14" stroke="#707070" stroke-width="2"/>
      </g>
      <!-- Rec Dot -->
      <circle class="anim-cam-dot" cx="25" cy="24" r="2" fill="#ff3333"/>
    </svg>
  `,

  // 3. Audio (Audio Generation)
  getAudio: () => `
    <div class="anim-audio">
      <div class="anim-audio-bar"></div>
      <div class="anim-audio-bar"></div>
      <div class="anim-audio-bar"></div>
      <div class="anim-audio-bar"></div>
      <div class="anim-audio-bar"></div>
    </div>
  `,

  // 4. Filmstrip (Media Library / Exports)
  getFilmstrip: () => `
    <div class="anim-filmstrip">
      <div class="anim-strip-inner">
        <svg width="48" height="96" viewBox="0 0 48 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="0" width="32" height="96" fill="#141414" stroke="#444" stroke-width="2"/>
          <!-- Frames -->
          <rect x="14" y="6" width="20" height="14" fill="#202020"/>
          <rect x="14" y="26" width="20" height="14" fill="#202020"/>
          <rect x="14" y="46" width="20" height="14" fill="#202020"/>
          <rect x="14" y="66" width="20" height="14" fill="#202020"/>
          <rect x="14" y="86" width="20" height="14" fill="#202020"/>
          <!-- Holes Left -->
          <circle cx="10" cy="8" r="1" fill="#444"/><circle cx="10" cy="14" r="1" fill="#444"/><circle cx="10" cy="20" r="1" fill="#444"/>
          <circle cx="10" cy="28" r="1" fill="#444"/><circle cx="10" cy="34" r="1" fill="#444"/><circle cx="10" cy="40" r="1" fill="#444"/>
          <circle cx="10" cy="48" r="1" fill="#444"/><circle cx="10" cy="54" r="1" fill="#444"/><circle cx="10" cy="60" r="1" fill="#444"/>
          <circle cx="10" cy="68" r="1" fill="#444"/><circle cx="10" cy="74" r="1" fill="#444"/><circle cx="10" cy="80" r="1" fill="#444"/>
          <circle cx="10" cy="88" r="1" fill="#444"/><circle cx="10" cy="94" r="1" fill="#444"/>
          <!-- Holes Right -->
          <circle cx="38" cy="8" r="1" fill="#444"/><circle cx="38" cy="14" r="1" fill="#444"/><circle cx="38" cy="20" r="1" fill="#444"/>
          <circle cx="38" cy="28" r="1" fill="#444"/><circle cx="38" cy="34" r="1" fill="#444"/><circle cx="38" cy="40" r="1" fill="#444"/>
          <circle cx="38" cy="48" r="1" fill="#444"/><circle cx="38" cy="54" r="1" fill="#444"/><circle cx="38" cy="60" r="1" fill="#444"/>
          <circle cx="38" cy="68" r="1" fill="#444"/><circle cx="38" cy="74" r="1" fill="#444"/><circle cx="38" cy="80" r="1" fill="#444"/>
          <circle cx="38" cy="88" r="1" fill="#444"/><circle cx="38" cy="94" r="1" fill="#444"/>
        </svg>
      </div>
    </div>
  `,

  // 5. Lens Focus (Character)
  getLens: () => `
    <svg class="anim-lens" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" fill="#141414" stroke="#444" stroke-width="2"/>
      <g class="anim-lens-ring" style="transform-origin: 24px 24px;">
         <circle cx="24" cy="24" r="12" stroke="#707070" stroke-width="1.5" stroke-dasharray="4 4"/>
         <circle cx="24" cy="24" r="6" fill="#0a0a0a" stroke="#444" stroke-width="1"/>
      </g>
      <circle cx="28" cy="20" r="2" fill="#fff" opacity="0.2"/>
    </svg>
  `,

  // 6. Editing Scissors (Editor)
  getScissor: () => `
    <svg class="anim-edit" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g class="anim-edit-scissor-top">
         <circle cx="14" cy="18" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 15 L38 22" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <g class="anim-edit-scissor-bottom">
         <circle cx="14" cy="30" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 33 L38 26" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <circle cx="23" cy="24" r="2" fill="var(--primary)"/>
    </svg>
  `,

  
  // 6. Editing Scissors (Editor)
  getScissor: () => `
    <svg class="anim-edit" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g class="anim-edit-scissor-top">
         <circle cx="14" cy="18" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 15 L38 22" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <g class="anim-edit-scissor-bottom">
         <circle cx="14" cy="30" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 33 L38 26" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <circle cx="23" cy="24" r="2" fill="var(--primary)"/>
    </svg>
  `,
  
  // 6. Editing Scissors (Editor)
  getScissor: () => `
    <svg class="anim-edit" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g class="anim-edit-scissor-top">
         <circle cx="14" cy="18" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 15 L38 22" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <g class="anim-edit-scissor-bottom">
         <circle cx="14" cy="30" r="4" stroke="#eeeeee" stroke-width="2"/>
         <path d="M17 33 L38 26" stroke="#eeeeee" stroke-width="2"/>
      </g>
      <circle cx="23" cy="24" r="2" fill="var(--primary)"/>
    </svg>
  `,
  // Helper for generating standard loader wrappers
  loader: (type, text = 'Loading...') => `<div style="padding:12px; font-size:11px; color:var(--text-subtle);">${text}</div>`,
  
  // Helper for empty states
  emptyState: (type, title, subtitle) => {
    let icon = '';
    switch(type) {
      case 'clapper': icon = Cinematic.getClapperboard(); break;
      case 'camera': icon = Cinematic.getCamera(); break;
      case 'audio': icon = Cinematic.getAudio(); break;
      case 'filmstrip': icon = Cinematic.getFilmstrip(); break;
      case 'lens': icon = Cinematic.getLens(); break;
      case 'edit': icon = Cinematic.getScissor(); break;
      case 'edit': icon = Cinematic.getScissor(); break;
      case 'edit': icon = Cinematic.getScissor(); break;
      default: icon = Cinematic.getClapperboard();
    }
    return `
      <div class="empty-state page-animate-enter">
        <div style="margin-bottom:20px; opacity:0.8;">${icon}</div>
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
    `;
  }
};
