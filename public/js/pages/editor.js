/* Professional Video Editor Page - Directro AI */

let _clips = [];
let _history = [];
let _historyIdx = -1;
let _zoom = 50; // 50px per second
let _canvasRatio = '16/9';

let _seq = {
  isPlaying: false,
  time: 0,
  duration: 0,
  rafId: null,
  lastFrameTime: 0,
  mediaCache: {},
  activeVideoIdx: 0,
  project_id: null
};

let _dragging = null;
let _html5DragIdx = -1;
let _selectedClipIdx = -1;

window.renderEditorPage = async function() {
  const container = document.getElementById('page-editor');
  if (!container) return;
  const pid = ProjectState.id;
  _seq.project_id = pid;

  if (_seq.rafId) cancelAnimationFrame(_seq.rafId);

  container.innerHTML = `
    <div style="flex:1; display:flex; flex-direction:column; height:calc(100vh - var(--topbar-height, 64px)); overflow:hidden; background:#0B0D10; color:#E2E8F0;">
      
      <!-- TOP ROW: 3 PANELS -->
      <div style="height: 52vh; display: flex; border-bottom: 1px solid #1D2128;">
        
        <!-- LEFT PANEL: AI VIDEO CLIPS -->
        <div style="width: 280px; background: #111419; border-right: 1px solid #1D2128; display: flex; flex-direction: column;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #1D2128; font-weight: 600; font-size: 12px; letter-spacing: 1px; color: #9AA1AD; display:flex; justify-content:space-between; align-items:center;">
            <span>AI VIDEO CLIPS</span>
            <button class="btn btn-sm" onclick="loadEditorMedia()" style="padding:2px 8px; font-size:11px; background:#1c2027; border:1px solid #2d333b; color:#aaa; border-radius:3px; cursor:pointer;" title="Refresh Media">↻</button>
          </div>
          <div id="editor-video-library" style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
            <div style="color: #4A5568; font-size: 13px; text-align: center; margin-top: 20px;">Loading videos...</div>
          </div>
        </div>
        
        <!-- CENTER PANEL: VIDEO PREVIEW -->
        <div style="flex: 1; background: #0B0D10; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
          
          <div id="preview-canvas" style="width: 90%; max-width: 720px; aspect-ratio: 16/9; border: 1px dashed #292E36; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-radius: 8px; overflow: hidden; background: #000;">
            <div id="preview-placeholder" style="display:flex; flex-direction:column; align-items:center; justify-content:center; z-index: 2;">
              <svg viewBox="0 0 24 24" width="44" height="44" stroke="#4A5568" stroke-width="1.5" fill="none" style="margin-bottom:12px;"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
              <div style="color: #4A5568; font-size: 13px;">Add real media to begin</div>
            </div>
            
            <video id="main-preview-video-0" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; opacity:0; z-index: 1; pointer-events: none;"></video>
            <video id="main-preview-video-1" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; opacity:0; pointer-events:none; z-index: 1;"></video>
            <div id="text-overlay-container" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:3;"></div>

            <div style="position: absolute; bottom: 12px; right: 16px; font-family: monospace; font-size: 13px; font-weight: bold; color: #E2E8F0; letter-spacing: 1px; z-index: 3; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px;" id="seq-timecode">00:00 / 00:00</div>
          </div>

          <!-- Playback Controls -->
          <div style="margin-top: 18px; display: flex; align-items: center; gap: 20px;">
            <svg onclick="seekToStart()" viewBox="0 0 24 24" width="20" height="20" stroke="#9AA1AD" stroke-width="2" fill="none" style="cursor:pointer;" title="To Start"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            <button id="btn-play" onclick="togglePlay()" style="width: 44px; height: 44px; border-radius: 50%; background: #7b5ffd; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; box-shadow:0 0 12px rgba(123,95,253,0.4);">
              <svg id="play-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <div style="width: 14px; height: 14px; background: #9AA1AD; border-radius: 2px; cursor:pointer;" onclick="stopPlayback()" title="Stop"></div>
            <svg onclick="seekToEnd()" viewBox="0 0 24 24" width="20" height="20" stroke="#9AA1AD" stroke-width="2" fill="none" style="cursor:pointer;" title="To End"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 16px;">
              <input id="master-volume" type="range" value="1.0" min="0" max="1" step="0.05" oninput="setMasterVolume(this.value)" style="width: 80px; accent-color: #7b5ffd; cursor:pointer;">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#9AA1AD" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: AI AUDIO -->
        <div style="width: 280px; background: #111419; border-left: 1px solid #1D2128; display: flex; flex-direction: column;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #1D2128; font-weight: 600; font-size: 12px; letter-spacing: 1px; color: #9AA1AD; display:flex; justify-content:space-between; align-items:center;">
            <span>AI AUDIO</span>
            <button class="btn btn-sm" onclick="loadEditorMedia()" style="padding:2px 8px; font-size:11px; background:#1c2027; border:1px solid #2d333b; color:#aaa; border-radius:3px; cursor:pointer;" title="Refresh Media">↻</button>
          </div>
          <div id="editor-audio-library" style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
            <div style="color: #4A5568; font-size: 13px; text-align: center; margin-top: 20px;">Loading audio...</div>
          </div>
        </div>

      </div>
      
      <!-- BOTTOM ROW: FULL WIDTH TIMELINE -->
      <div style="flex: 1; background: #0B0D10; display: flex; flex-direction: column; position: relative; min-height: 250px;">
        
        <!-- Timeline Header -->
        <div style="padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1D2128; background:#0e1014;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="color: #9AA1AD; font-size: 11px; letter-spacing: 1.5px; font-weight: 700;">REAL TIMELINE</span>
            <span style="color: #E2E8F0; font-size: 14px;" id="tl-title">00:00 sequence</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm" onclick="undo()" style="background:#181b22; border:1px solid #292e36; color:#ddd; padding:4px 10px; border-radius:4px; cursor:pointer;" title="Undo">↶ Undo</button>
              <button class="btn btn-sm" onclick="redo()" style="background:#181b22; border:1px solid #292e36; color:#ddd; padding:4px 10px; border-radius:4px; cursor:pointer;" title="Redo">↷ Redo</button>
              <button class="btn btn-sm" onclick="saveTimelineSilent(true)" style="background:#4a369e; border:1px solid #5c44c2; color:#fff; padding:4px 12px; border-radius:4px; cursor:pointer; font-weight:600;">💾 Save</button>
              <a href="#export" style="background:#6b4ce6; border:1px solid #7b5cf6; color:#fff; padding:4px 12px; border-radius:4px; text-decoration:none; font-size:12px; display:inline-flex; align-items:center; font-weight:600;">⚡ Merge / Export</a>
            </div>
            <div style="background: #111419; padding: 4px 10px; border-radius: 4px; border: 1px solid #1D2128; color: #E2E8F0; font-family: monospace; font-size: 12px;" id="tl-current">00:00</div>
          </div>
        </div>

        <!-- Ruler -->
        <div style="height: 26px; position: relative; overflow: hidden; background: #0B0D10;" onmousedown="seekTimeline(event)">
            <div id="timeline-ruler" style="position: absolute; height: 100%; left: 100px; border-bottom: 1px solid #1D2128; color: #718096; font-family: monospace; font-size: 10px; cursor:pointer;"></div>
        </div>

        <!-- Tracks Area -->
        <div style="flex: 1; position: relative; overflow-y: auto; overflow-x: auto; padding-left: 100px;" id="timeline-scroll-area">
          
          <!-- Playhead Line -->
          <div id="playhead" style="position: absolute; left: 100px; top: 0; width: 2px; height: 100%; background: #fd5f8e; z-index: 50; pointer-events: none; transition: none;">
            <div style="position: absolute; top: 0; left: -4px; width: 10px; height: 10px; background: #fd5f8e; border-radius: 50%; box-shadow:0 0 6px #fd5f8e;"></div>
          </div>

          <!-- Video Track -->
          <div style="height: 60px; border-bottom: 1px solid #1D2128; display: flex; align-items: center; position: relative; margin-left: -100px;">
            <div style="width: 100px; padding: 0 16px; color: #718096; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-right: 1px solid #1D2128; height: 100%; display: flex; align-items: center; background: #0B0D10; z-index: 40;">VIDEO</div>
            <div id="timeline-track-video" style="flex: 1; position: relative; height: 100%;" ondrop="window.timelineDrop(event, 'video')" ondragover="window.timelineDragOver(event, 'video')" ondragleave="window.timelineDragLeave(event)"></div>
          </div>

          <!-- Music Track -->
          <div style="height: 52px; border-bottom: 1px solid #1D2128; display: flex; align-items: center; position: relative; margin-left: -100px;">
            <div style="width: 100px; padding: 0 16px; color: #e2a54a; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-right: 1px solid #1D2128; height: 100%; display: flex; align-items: center; background: #0B0D10; z-index: 40;">MUSIC</div>
            <div id="timeline-track-music" style="flex: 1; position: relative; height: 100%;" ondrop="window.timelineDrop(event, 'music')" ondragover="window.timelineDragOver(event, 'music')" ondragleave="window.timelineDragLeave(event)"></div>
          </div>

          <!-- Voice / Narration Track -->
          <div style="height: 52px; border-bottom: 1px solid #1D2128; display: flex; align-items: center; position: relative; margin-left: -100px;">
            <div style="width: 100px; padding: 0 16px; color: #06b6d4; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-right: 1px solid #1D2128; height: 100%; display: flex; align-items: center; background: #0B0D10; z-index: 40;">VOICE</div>
            <div id="timeline-track-voice" style="flex: 1; position: relative; height: 100%;" ondrop="window.timelineDrop(event, 'voice')" ondragover="window.timelineDragOver(event, 'voice')" ondragleave="window.timelineDragLeave(event)"></div>
          </div>

          <!-- SFX Track -->
          <div style="height: 52px; border-bottom: 1px solid #1D2128; display: flex; align-items: center; position: relative; margin-left: -100px;">
            <div style="width: 100px; padding: 0 16px; color: #50e3c2; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-right: 1px solid #1D2128; height: 100%; display: flex; align-items: center; background: #0B0D10; z-index: 40;">SFX</div>
            <div id="timeline-track-sfx" style="flex: 1; position: relative; height: 100%;" ondrop="window.timelineDrop(event, 'sfx')" ondragover="window.timelineDragOver(event, 'sfx')" ondragleave="window.timelineDragLeave(event)"></div>
          </div>
          
        </div>

        <!-- Floating Edit Toolbar -->
        <div id="floating-edit-toolbar" style="display:none; position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #111419; border: 1px solid #292E36; border-radius: 20px; padding: 6px 16px; align-items: center; gap: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 100;">
          <div onclick="splitAtPlayhead()" style="display: flex; align-items: center; gap: 6px; color: #fff; font-weight: 600; font-size:12px; padding-right: 12px; border-right: 1px solid #292E36; cursor: pointer;">
            ✂ Split
          </div>
          <div onclick="duplicateSelected()" style="display: flex; align-items: center; gap: 6px; color: #9AA1AD; font-size:12px; cursor: pointer;">
            ⎘ Dup
          </div>
          <div onclick="deleteSelected()" style="display: flex; align-items: center; gap: 6px; color: #fd5f8e; font-size:12px; cursor: pointer;">
            🗑 Delete
          </div>
        </div>
        
      </div>
      
    </div>
  `;

  await loadEditorData();
  initSequencerLoop();
};

window.loadEditorData = async function() {
  const pid = ProjectState.id;
  _seq.project_id = pid;
  if (!pid) return;

  try {
    const res = await api.get('/editor/timeline?project_id=' + pid);
    let allClips = [];
    if (res && res.tracks) {
      if (res.tracks.video) allClips = allClips.concat(res.tracks.video);
      if (res.tracks.audio) allClips = allClips.concat(res.tracks.audio);
      if (res.tracks.music) allClips = allClips.concat(res.tracks.music);
      if (res.tracks.sfx) allClips = allClips.concat(res.tracks.sfx);
    } else if (Array.isArray(res.data)) {
      allClips = res.data;
    } else if (Array.isArray(res)) {
      allClips = res;
    }

    _clips = allClips.map(c => ({
      id: c.id,
      track_type: c.track_type || 'video',
      media_asset_id: c.media_asset_id,
      trim_start: parseFloat(c.trim_start) || 0,
      trim_end: parseFloat(c.trim_end) || 0,
      clip_label: c.clip_label || 'Clip',
      transition: c.transition || null,
      speed: parseFloat(c.speed) || 1.0,
      volume: c.volume !== undefined ? parseFloat(c.volume) : 1.0,
      fade_in: parseFloat(c.fade_in) || 0,
      fade_out: parseFloat(c.fade_out) || 0,
      start_time: parseFloat(c.start_time) || 0,
      linked_to: c.linked_to || null,
      text_overlay: c.text_overlay || ''
    }));

    _history = [JSON.parse(JSON.stringify(_clips))];
    _historyIdx = 0;

    renderTimeline();
    await loadEditorMedia();
  } catch (err) {
    console.error('Error loading timeline:', err);
  }
};

window.loadEditorMedia = async function() {
  const pid = ProjectState.id;
  if (!pid) return;

  try {
    const res = await api.get('/media?project_id=' + pid);
    const media = res.data || res || [];

    let videoHtml = '';
    let audioHtml = '';

    media.forEach(m => {
      const url = m.url_path || m.url;
      _seq.mediaCache[m.id] = {
        url: url,
        duration: parseFloat(m.duration) || 5.0,
        type: m.asset_type,
        name: m.filename || 'Generated Media'
      };

      const isVid = m.asset_type === 'video' || m.asset_type === 'export';
      const isAud = ['audio', 'music', 'sfx', 'voice'].includes(m.asset_type);
      const dur = parseFloat(m.duration || 5.0).toFixed(1);

      if (isVid) {
        videoHtml += `
          <div style="background:#171A20; border:1px solid #292E36; border-radius:6px; padding:10px; cursor:grab; transition:border 0.2s;" draggable="true" ondragstart="window.mediaDragStart(event, '${m.id}')">
            <div style="width:100%; height:90px; background:#000; border-radius:4px; overflow:hidden; margin-bottom:8px; position:relative;">
              <video src="${url}" style="width:100%; height:100%; object-fit:cover;" muted></video>
              <div style="position:absolute; bottom:4px; right:4px; background:rgba(0,0,0,0.7); font-size:10px; padding:1px 5px; border-radius:3px; color:#fff; font-family:monospace;">${dur}s</div>
            </div>
            <div style="font-size:12px; font-weight:600; color:#E2E8F0; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.filename || 'Shot'}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span style="font-size:10px; color:#718096; text-transform:uppercase;">${m.asset_type}</span>
              <button class="btn btn-sm" onclick="addMediaToTimeline('${m.id}', 'video')" style="padding:2px 8px; font-size:11px; background:#4a369e; color:#fff; border:none; border-radius:3px; cursor:pointer;">+ Add</button>
            </div>
          </div>
        `;
      } else if (isAud) {
        const icon = m.asset_type === 'music' ? '🎵' : (m.asset_type === 'sfx' ? '🔊' : '🎙️');
        audioHtml += `
          <div style="background:#171A20; border:1px solid #292E36; border-radius:6px; padding:10px; cursor:grab; transition:border 0.2s;" draggable="true" ondragstart="window.mediaDragStart(event, '${m.id}')">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span style="font-size:16px;">${icon}</span>
              <div style="flex:1; font-size:12px; font-weight:600; color:#E2E8F0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.filename || 'Audio Track'}</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10px; color:#718096; text-transform:uppercase;">${m.asset_type} (${dur}s)</span>
              <button class="btn btn-sm" onclick="addMediaToTimeline('${m.id}', '${m.asset_type}')" style="padding:2px 8px; font-size:11px; background:#2563eb; color:#fff; border:none; border-radius:3px; cursor:pointer;">+ Add</button>
            </div>
          </div>
        `;
      }
    });

    const vLib = document.getElementById('editor-video-library');
    const aLib = document.getElementById('editor-audio-library');
    if (vLib) vLib.innerHTML = videoHtml || '<div style="color:#718096; font-size:12px; text-align:center; margin-top:20px;">No video clips generated yet.</div>';
    if (aLib) aLib.innerHTML = audioHtml || '<div style="color:#718096; font-size:12px; text-align:center; margin-top:20px;">No audio assets generated yet.</div>';

    renderTimeline();
  } catch (err) {
    console.error('Failed to load media:', err);
  }
};

window.mediaDragStart = function(e, id) {
  e.dataTransfer.setData('text/plain', String(id));
  e.dataTransfer.effectAllowed = 'copy';
};

window.timelineDragOver = function(e, trackType) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  const tgt = e.currentTarget;
  tgt.style.background = 'rgba(107, 76, 230, 0.25)';

  let indicator = document.getElementById('drop-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'drop-indicator';
    indicator.style = 'position:absolute; width:2px; height:100%; background:#fd5f8e; top:0; z-index:60; pointer-events:none; box-shadow:0 0 8px #fd5f8e;';
    tgt.appendChild(indicator);
  }
  const rect = tgt.getBoundingClientRect();
  const dropX = e.clientX - rect.left;
  indicator.style.left = dropX + 'px';
};

window.timelineDragLeave = function(e) {
  const tgt = e.currentTarget;
  tgt.style.background = 'transparent';
  const indicator = document.getElementById('drop-indicator');
  if (indicator) indicator.remove();
};

window.timelineDrop = function(e, trackType) {
  e.preventDefault();
  const tgt = e.currentTarget;
  tgt.style.background = 'transparent';
  const indicator = document.getElementById('drop-indicator');
  if (indicator) indicator.remove();

  const mediaId = e.dataTransfer.getData('text/plain');
  if (!mediaId || mediaId === 'undefined') return;

  const rect = tgt.getBoundingClientRect();
  const dropX = Math.max(0, e.clientX - rect.left);
  const dropTime = Math.max(0, dropX / _zoom);

  addMediaToTimeline(mediaId, trackType, dropTime);
};

window.addMediaToTimeline = function(mediaId, dropTrackType, dropTime) {
  const cache = _seq.mediaCache[mediaId];
  const isVideo = cache ? (cache.type === 'video' || cache.type === 'export') : (dropTrackType === 'video');
  let trackType = 'video';
  if (!isVideo) {
    if (dropTrackType && dropTrackType !== 'video') {
      trackType = dropTrackType;
    } else if (cache) {
      trackType = (cache.type === 'voice' || cache.type === 'audio') ? 'voice' : (cache.type === 'sfx' ? 'sfx' : 'music');
    } else {
      trackType = 'music';
    }
  }

  const rawDur = cache ? cache.duration : 5.0;

  _clips.push({
    id: 'clip_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    track_type: trackType,
    media_asset_id: mediaId,
    trim_start: 0,
    trim_end: rawDur,
    clip_label: cache ? cache.name : 'Clip',
    transition: null,
    speed: 1.0,
    volume: 1.0,
    fade_in: 0,
    fade_out: 0,
    start_time: trackType !== 'video' ? (dropTime !== undefined ? dropTime : _seq.time) : 0,
    linked_to: null,
    text_overlay: ''
  });

  saveState();
  saveTimelineSilent();
};

function renderTimeline() {
  const trackV = document.getElementById('timeline-track-video');
  const trackM = document.getElementById('timeline-track-music');
  const trackS = document.getElementById('timeline-track-sfx');
  const ruler = document.getElementById('timeline-ruler');
  if (!trackV || !ruler) return;

  let currentStart = 0;
  let videoHtml = '';
  let musicHtml = '';
  let voiceHtml = '';
  let sfxHtml = '';
  const videoTimings = {};

  // 1. Render Video Clips sequentially
  _clips.forEach((clip, i) => {
    if (clip.track_type && clip.track_type !== 'video') return;

    const cache = _seq.mediaCache[clip.media_asset_id];
    const rawDur = cache ? cache.duration : 5.0;
    const ts = parseFloat(clip.trim_start) || 0;
    const te = parseFloat(clip.trim_end) > 0 && parseFloat(clip.trim_end) > ts ? parseFloat(clip.trim_end) : rawDur;
    const effDur = Math.max(0.2, (te - ts) / (parseFloat(clip.speed) || 1.0));

    const leftPx = currentStart * _zoom;
    const widthPx = Math.max(30, effDur * _zoom);
    const bgUrl = cache ? cache.url : '';
    const clipName = cache ? cache.name : (clip.clip_label || `Shot ${i+1}`);

    videoTimings[clip.id] = { start: currentStart, effDur };

    const isSelected = _selectedClipIdx === i;

    videoHtml += `
      <div class="timeline-clip ${isSelected ? 'clip-selected' : ''}" 
           data-index="${i}" 
           style="position:absolute; left:${leftPx}px; width:${widthPx}px; height:100%; background:#1c2028; border:1px solid ${isSelected ? '#7b5ffd' : '#30363d'}; border-radius:4px; cursor:grab; overflow:hidden; box-sizing:border-box;"
           draggable="true" ondragstart="clipDragStart(event, ${i})" ondragend="clipDragEnd(event)" ondragover="clipDragOver(event, ${i})" ondrop="clipDrop(event, ${i})" onmousedown="selectClip(event, ${i})">
        <video src="${bgUrl}#t=${ts}" style="width:100%; height:100%; object-fit:cover; opacity:0.55; pointer-events:none;"></video>
        <div style="position:absolute; top:4px; left:8px; font-size:11px; color:#fff; font-weight:600; pointer-events:none; z-index:2; text-shadow:0 1px 3px #000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80%;">
          🎬 ${clipName}
        </div>
        <div style="position:absolute; bottom:4px; left:8px; font-size:10px; color:#cbd5e1; font-weight:500; pointer-events:none; z-index:2; font-family:monospace;">
          ${effDur.toFixed(1)}s
        </div>
        <div style="position:absolute; top:4px; right:6px; background:rgba(220,53,69,0.85); color:#fff; width:16px; height:16px; border-radius:50%; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:20;" onclick="event.stopPropagation(); deleteTimelineClip(${i})" title="Remove">✕</div>
        <div class="trim-handle left" style="position:absolute; left:0; top:0; width:8px; height:100%; background:rgba(123,95,253,0.7); cursor:col-resize; z-index:10;" onmousedown="startTrimDrag(event, 'left', ${i})"></div>
        <div class="trim-handle right" style="position:absolute; right:0; top:0; width:8px; height:100%; background:rgba(123,95,253,0.7); cursor:col-resize; z-index:10;" onmousedown="startTrimDrag(event, 'right', ${i})"></div>
      </div>
    `;

    currentStart += effDur;
  });

  let maxAudioEnd = currentStart;

  // 2. Render Audio Clips
  _clips.forEach((clip, i) => {
    if (!clip.track_type || clip.track_type === 'video') return;

    const cache = _seq.mediaCache[clip.media_asset_id];
    const rawDur = cache ? cache.duration : 5.0;
    const ts = parseFloat(clip.trim_start) || 0;
    const te = parseFloat(clip.trim_end) > 0 && parseFloat(clip.trim_end) > ts ? parseFloat(clip.trim_end) : rawDur;
    const effDur = Math.max(0.2, (te - ts) / (parseFloat(clip.speed) || 1.0));

    let audioStart = parseFloat(clip.start_time) || 0;
    if (clip.linked_to && videoTimings[clip.linked_to]) {
      audioStart += videoTimings[clip.linked_to].start;
    }
    clip.computed_start = audioStart;

    const leftPx = audioStart * _zoom;
    const widthPx = Math.max(30, effDur * _zoom);
    const clipName = cache ? cache.name : (clip.clip_label || 'Audio');
    const isSelected = _selectedClipIdx === i;
    const isMusic = clip.track_type === 'music';
    const isVoice = clip.track_type === 'voice' || clip.track_type === 'audio';
    const isSfx = clip.track_type === 'sfx';

    const bgCol = isMusic ? 'rgba(226, 165, 74, 0.25)' : 
                  isVoice ? 'rgba(6, 182, 212, 0.25)' : 
                  'rgba(80, 227, 194, 0.25)';
    const borderCol = isSelected ? '#7b5ffd' : (isMusic ? '#e2a54a' : (isVoice ? '#06b6d4' : '#50e3c2'));
    const trackIcon = isMusic ? '🎵' : (isVoice ? '🎙️' : '🔊');

    const html = `
      <div class="timeline-clip ${isSelected ? 'clip-selected' : ''}" 
           data-index="${i}" 
           style="position:absolute; left:${leftPx}px; width:${widthPx}px; height:100%; background:${bgCol}; border:1px solid ${borderCol}; border-radius:4px; cursor:pointer; overflow:hidden; box-sizing:border-box;"
           onmousedown="selectClip(event, ${i}); startClipMoveDrag(event, ${i});">
        <div style="position:absolute; top:4px; left:8px; font-size:11px; color:#fff; font-weight:600; pointer-events:none; z-index:2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80%;">
          ${trackIcon} ${clipName}
        </div>
        <div style="position:absolute; bottom:4px; left:8px; font-size:10px; color:#cbd5e1; font-weight:500; pointer-events:none; z-index:2; font-family:monospace;">
          ${effDur.toFixed(1)}s
        </div>
        <div style="position:absolute; top:4px; right:6px; background:rgba(220,53,69,0.85); color:#fff; width:16px; height:16px; border-radius:50%; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:20;" onclick="event.stopPropagation(); deleteTimelineClip(${i})" title="Remove">✕</div>
      </div>
    `;

    const end = audioStart + effDur;
    if (end > maxAudioEnd) maxAudioEnd = end;

    if (isMusic) musicHtml += html;
    else if (isVoice) voiceHtml += html;
    else sfxHtml += html;
  });

  _seq.duration = Math.max(currentStart, maxAudioEnd, 1.0);
  const totalWidthPx = Math.max(1200, currentStart * _zoom + 500);

  trackV.innerHTML = videoHtml;
  trackV.style.width = totalWidthPx + 'px';

  if (trackM) {
    trackM.innerHTML = musicHtml;
    trackM.style.width = totalWidthPx + 'px';
  }
  const trackVoice = document.getElementById('timeline-track-voice');
  if (trackVoice) {
    trackVoice.innerHTML = voiceHtml;
    trackVoice.style.width = totalWidthPx + 'px';
  }
  if (trackS) {
    trackS.innerHTML = sfxHtml;
    trackS.style.width = totalWidthPx + 'px';
  }

  ruler.style.width = totalWidthPx + 'px';
  let rulerHtml = '';
  const step = 5;
  for (let s = 0; s <= Math.ceil(currentStart) + 30; s += step) {
    rulerHtml += `<div style="position:absolute; left:${s * _zoom}px; bottom:0; height:12px; border-left:1px solid #444; font-size:10px; color:#888; padding-left:3px; pointer-events:none;">${s}s</div>`;
  }
  ruler.innerHTML = rulerHtml;

  const tlTitle = document.getElementById('tl-title');
  if (tlTitle) {
    const m = Math.floor(currentStart / 60).toString().padStart(2, '0');
    const s = Math.floor(currentStart % 60).toString().padStart(2, '0');
    tlTitle.textContent = `${m}:${s} sequence (${_clips.filter(c => !c.track_type || c.track_type === 'video').length} video clips)`;
  }

  syncPreview();
}

window.selectClip = function(e, idx) {
  _selectedClipIdx = idx;
  document.querySelectorAll('.timeline-clip').forEach(el => el.classList.remove('clip-selected'));
  if (e && e.currentTarget) e.currentTarget.classList.add('clip-selected');

  const toolbar = document.getElementById('floating-edit-toolbar');
  if (toolbar) toolbar.style.display = idx >= 0 ? 'flex' : 'none';
};

window.deleteTimelineClip = function(idx) {
  _clips.splice(idx, 1);
  _selectedClipIdx = -1;
  saveState();
  saveTimelineSilent();
};

window.saveState = function() {
  _history = _history.slice(0, _historyIdx + 1);
  _history.push(JSON.parse(JSON.stringify(_clips)));
  _historyIdx++;
  renderTimeline();
};

window.undo = function() {
  if (_historyIdx > 0) {
    _historyIdx--;
    _clips = JSON.parse(JSON.stringify(_history[_historyIdx]));
    renderTimeline();
    saveTimelineSilent();
  }
};

window.redo = function() {
  if (_historyIdx < _history.length - 1) {
    _historyIdx++;
    _clips = JSON.parse(JSON.stringify(_history[_historyIdx]));
    renderTimeline();
    saveTimelineSilent();
  }
};

window.saveTimeline = function() {
  window.saveTimelineSilent(true);
};

document.addEventListener('undo', () => { if (window.undo) window.undo(); });
document.addEventListener('redo', () => { if (window.redo) window.redo(); });

window.saveTimelineSilent = async function(showFeedback) {
  const pid = ProjectState.id;
  if (!pid) return;

  try {
    const payload = {
      project_id: pid,
      clips: _clips.map((c, i) => ({ ...c, position: i }))
    };
    await api.post('/editor/timeline/bulk', payload);
    if (showFeedback) alert('Timeline successfully saved!');
  } catch (e) {
    console.error('Failed to save timeline:', e);
  }
};

window.splitAtPlayhead = function() {
  if (_selectedClipIdx < 0) return;
  const clip = _clips[_selectedClipIdx];
  if (clip.track_type && clip.track_type !== 'video') return;

  let currentStart = 0;
  for (let i = 0; i < _selectedClipIdx; i++) {
    const c = _clips[i];
    if (c.track_type && c.track_type !== 'video') continue;
    const rawDur = _seq.mediaCache[c.media_asset_id]?.duration || 5.0;
    currentStart += ((c.trim_end || rawDur) - c.trim_start) / (c.speed || 1.0);
  }

  const splitPoint = _seq.time - currentStart;
  const rawDur = _seq.mediaCache[clip.media_asset_id]?.duration || 5.0;
  const totalEff = ((clip.trim_end || rawDur) - clip.trim_start) / (clip.speed || 1.0);

  if (splitPoint > 0.5 && splitPoint < totalEff - 0.5) {
    const origTrimEnd = clip.trim_end || rawDur;
    const splitMediaTime = clip.trim_start + (splitPoint * (clip.speed || 1.0));

    clip.trim_end = splitMediaTime;

    const newClip = JSON.parse(JSON.stringify(clip));
    newClip.id = 'clip_' + Date.now();
    newClip.trim_start = splitMediaTime;
    newClip.trim_end = origTrimEnd;

    _clips.splice(_selectedClipIdx + 1, 0, newClip);
    saveState();
    saveTimelineSilent();
  }
};

window.duplicateSelected = function() {
  if (_selectedClipIdx < 0) return;
  const newClip = JSON.parse(JSON.stringify(_clips[_selectedClipIdx]));
  newClip.id = 'clip_' + Date.now();
  _clips.splice(_selectedClipIdx + 1, 0, newClip);
  saveState();
  saveTimelineSilent();
};

window.deleteSelected = function() {
  if (_selectedClipIdx < 0) return;
  _clips.splice(_selectedClipIdx, 1);
  _selectedClipIdx = -1;
  saveState();
  saveTimelineSilent();
};

window.clipDragStart = function(e, idx) {
  _html5DragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(idx));
};

window.clipDragEnd = function(e) {
  _html5DragIdx = -1;
};

window.clipDragOver = function(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

window.clipDrop = function(e, targetIdx) {
  e.preventDefault();
  if (_html5DragIdx !== -1 && _html5DragIdx !== targetIdx) {
    const item = _clips.splice(_html5DragIdx, 1)[0];
    _clips.splice(targetIdx, 0, item);
    _selectedClipIdx = targetIdx;
    saveState();
    saveTimelineSilent();
  }
};

function startClipMoveDrag(e, idx) {
  if (e.target.classList.contains('trim-handle')) return;
  const clip = _clips[idx];
  if (!clip.track_type || clip.track_type === 'video') return;

  e.preventDefault();
  const startX = e.clientX;
  const origStart = parseFloat(clip.start_time) || 0;

  const onMove = (moveEvt) => {
    const dx = moveEvt.clientX - startX;
    clip.start_time = Math.max(0, origStart + (dx / _zoom));
    renderTimeline();
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    saveState();
    saveTimelineSilent();
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function startTrimDrag(e, side, idx) {
  e.preventDefault();
  e.stopPropagation();
  const clip = _clips[idx];
  const startX = e.clientX;
  const cache = _seq.mediaCache[clip.media_asset_id];
  const rawDur = cache ? cache.duration : 5.0;
  const origTrimStart = clip.trim_start || 0;
  const origTrimEnd = clip.trim_end || rawDur;

  const onMove = (moveEvt) => {
    const dt = (moveEvt.clientX - startX) / _zoom;
    if (side === 'left') {
      clip.trim_start = Math.max(0, Math.min(origTrimEnd - 0.5, origTrimStart + dt));
    } else {
      clip.trim_end = Math.max(origTrimStart + 0.5, Math.min(rawDur, origTrimEnd + dt));
    }
    renderTimeline();
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    saveState();
    saveTimelineSilent();
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

window.seekTimeline = function(e) {
  const ruler = document.getElementById('timeline-ruler');
  if (!ruler) return;
  const rect = ruler.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  _seq.time = Math.max(0, Math.min(_seq.duration, clickX / _zoom));
  syncPreview();
};

window.seekToStart = function() {
  _seq.time = 0;
  syncPreview();
};

window.seekToEnd = function() {
  _seq.time = _seq.duration;
  syncPreview();
};

window.stopPlayback = function() {
  _seq.isPlaying = false;
  _seq.time = 0;
  if (window._audioPlayers) {
    Object.values(window._audioPlayers).forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  }
  updatePlayButton();
  syncPreview();
};

window.togglePlay = function() {
  _seq.isPlaying = !_seq.isPlaying;
  if (_seq.isPlaying && _seq.time >= _seq.duration) _seq.time = 0;
  if (!_seq.isPlaying && window._audioPlayers) {
    Object.values(window._audioPlayers).forEach(a => a.pause());
  }
  updatePlayButton();
  syncPreview();
};

function updatePlayButton() {
  const btn = document.getElementById('play-icon');
  if (btn) {
    if (_seq.isPlaying) {
      btn.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
      btn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }
  }
}

window.setMasterVolume = function(val) {
  const v = parseFloat(val);
  const v0 = document.getElementById('main-preview-video-0');
  const v1 = document.getElementById('main-preview-video-1');
  if (v0) v0.volume = v;
  if (v1) v1.volume = v;
  if (window._audioPlayers) {
    _clips.forEach(clip => {
      if (clip.track_type && clip.track_type !== 'video' && window._audioPlayers[clip.id]) {
        const clipVol = clip.volume !== undefined ? parseFloat(clip.volume) : 1.0;
        window._audioPlayers[clip.id].volume = Math.max(0, Math.min(1, clipVol * v));
      }
    });
  }
};

function initSequencerLoop() {
  _seq.lastFrameTime = performance.now();
  _seq.rafId = requestAnimationFrame(sequencerTick);
}

function sequencerTick(now) {
  if (!document.getElementById('page-editor')) return;
  _seq.rafId = requestAnimationFrame(sequencerTick);
  const delta = (now - _seq.lastFrameTime) / 1000;
  _seq.lastFrameTime = now;

  if (_seq.isPlaying) {
    _seq.time += delta;
    if (_seq.time >= _seq.duration && _seq.duration > 0) {
      _seq.time = 0;
      _seq.isPlaying = false;
      updatePlayButton();
    }
    syncPreview();
  }
}

function getClipAtTime(t) {
  let currentStart = 0;
  for (let i = 0; i < _clips.length; i++) {
    const c = _clips[i];
    if (c.track_type && c.track_type !== 'video') continue;
    const rawDur = _seq.mediaCache[c.media_asset_id]?.duration || 5.0;
    const effDur = Math.max(0.2, ((c.trim_end || rawDur) - c.trim_start) / (c.speed || 1.0));

    if (t >= currentStart && t < currentStart + effDur) {
      return { clipIndex: i, localTime: t - currentStart };
    }
    currentStart += effDur;
  }
  return { clipIndex: -1, localTime: 0 };
}

function syncPreview() {
  const min = Math.floor(_seq.time / 60).toString().padStart(2, '0');
  const sec = Math.floor(_seq.time % 60).toString().padStart(2, '0');
  const durMin = Math.floor(_seq.duration / 60).toString().padStart(2, '0');
  const durSec = Math.floor(_seq.duration % 60).toString().padStart(2, '0');

  const tc = document.getElementById('seq-timecode');
  if (tc) tc.textContent = `${min}:${sec} / ${durMin}:${durSec}`;

  const tlCurrent = document.getElementById('tl-current');
  if (tlCurrent) tlCurrent.textContent = `${min}:${sec}`;

  const playhead = document.getElementById('playhead');
  if (playhead) playhead.style.left = `${100 + (_seq.time * _zoom)}px`;

  const v0 = document.getElementById('main-preview-video-0');
  const v1 = document.getElementById('main-preview-video-1');
  const placeholder = document.getElementById('preview-placeholder');
  if (!v0 || !v1) return;

  const { clipIndex, localTime } = getClipAtTime(_seq.time);

  if (clipIndex !== -1) {
    if (placeholder) placeholder.style.display = 'none';

    const clip = _clips[clipIndex];
    const cache = _seq.mediaCache[clip.media_asset_id];
    const activeV = _seq.activeVideoIdx === 0 ? v0 : v1;
    const inactiveV = _seq.activeVideoIdx === 0 ? v1 : v0;

    if (cache && activeV.dataset.clipId !== String(clip.id)) {
      inactiveV.src = cache.url;
      inactiveV.dataset.clipId = clip.id;
      inactiveV.currentTime = clip.trim_start + (localTime * (clip.speed || 1.0));
      _seq.activeVideoIdx = _seq.activeVideoIdx === 0 ? 1 : 0;
      activeV.style.opacity = 0;
      inactiveV.style.opacity = 1;
    }

    const currActive = _seq.activeVideoIdx === 0 ? v0 : v1;
    const targetMediaTime = clip.trim_start + (localTime * (clip.speed || 1.0));

    if (Math.abs(currActive.currentTime - targetMediaTime) > 0.25 || (!currActive.paused && !_seq.isPlaying)) {
      currActive.currentTime = targetMediaTime;
    }

    if (_seq.isPlaying && currActive.paused) currActive.play().catch(e => {});
    else if (!_seq.isPlaying && !currActive.paused) currActive.pause();

    currActive.style.opacity = 1;
  } else {
    v0.pause();
    v1.pause();
    v0.style.opacity = 0;
    v1.style.opacity = 0;
    if (placeholder && _clips.filter(c => !c.track_type || c.track_type === 'video').length === 0) {
      placeholder.style.display = 'flex';
    }
  }

  // Synchronize Audio Tracks (Voice, Music, SFX)
  if (!window._audioPlayers) window._audioPlayers = {};
  const masterVol = parseFloat(document.getElementById('master-volume')?.value || 1.0);

  _clips.forEach((clip) => {
    if (!clip.track_type || clip.track_type === 'video') return;

    const cache = _seq.mediaCache[clip.media_asset_id];
    if (!cache || !cache.url) return;

    const rawDur = cache.duration || 5.0;
    const ts = parseFloat(clip.trim_start) || 0;
    const te = parseFloat(clip.trim_end) > 0 && parseFloat(clip.trim_end) > ts ? parseFloat(clip.trim_end) : rawDur;
    const effDur = Math.max(0.2, (te - ts) / (parseFloat(clip.speed) || 1.0));

    const start = clip.computed_start !== undefined ? clip.computed_start : (parseFloat(clip.start_time) || 0);
    const end = start + effDur;

    if (!window._audioPlayers[clip.id]) {
      const audioEl = new Audio();
      audioEl.preload = 'auto';
      window._audioPlayers[clip.id] = audioEl;
    }
    const a = window._audioPlayers[clip.id];
    if (a.src !== cache.url && !a.src.endsWith(cache.url)) {
      a.src = cache.url;
    }

    const clipVol = clip.volume !== undefined ? parseFloat(clip.volume) : 1.0;
    a.volume = Math.max(0, Math.min(1, clipVol * masterVol));

    if (_seq.time >= start && _seq.time < end) {
      const localAudioTime = ts + ((_seq.time - start) * (parseFloat(clip.speed) || 1.0));
      if (Math.abs(a.currentTime - localAudioTime) > 0.25) {
        a.currentTime = localAudioTime;
      }
      if (_seq.isPlaying && a.paused) {
        a.play().catch(e => console.log('Audio playback note:', e));
      } else if (!_seq.isPlaying && !a.paused) {
        a.pause();
      }
    } else {
      if (!a.paused) {
        a.pause();
      }
    }
  });

  // Clean up removed audio players
  const currentClipIds = new Set(_clips.map(c => String(c.id)));
  Object.keys(window._audioPlayers).forEach(id => {
    if (!currentClipIds.has(String(id))) {
      window._audioPlayers[id].pause();
      delete window._audioPlayers[id];
    }
  });
}
