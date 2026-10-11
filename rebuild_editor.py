import re
with open("public/js/pages/editor.js", "r", encoding="utf-8") as f:
    text = f.read()

# Completely overhaul the HTML layout to match their exact ASCII diagram.
# We will replace the entire innerHTML of renderEditor.
new_layout = """    container.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100vh; background:#f8f9fa; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        
        <!-- TOP TOOLBAR -->
        <div style="height:50px; background:#ffffff; border-bottom:1px solid #dee2e6; display:flex; align-items:center; padding:0 20px; justify-content:space-between;">
            <div style="font-weight:bold; font-size:16px; color:#343a40;" id="editor-project-name">Project Editing</div>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-sm btn-light" onclick="undo()" disabled>? Undo</button>
                <button class="btn btn-sm btn-light" onclick="redo()" disabled>? Redo</button>
                <button class="btn btn-sm btn-outline-primary" onclick="saveState()">?? Save</button>
                <button class="btn btn-sm btn-primary" onclick="exportVideo()">?? EXPORT VIDEO</button>
            </div>
        </div>

        <!-- MIDDLE SECTION: 3 COLUMNS -->
        <div style="display:flex; flex:1; overflow:hidden;">
            
            <!-- LEFT: MEDIA LIBRARY -->
            <div style="width:300px; background:#ffffff; border-right:1px solid #dee2e6; display:flex; flex-direction:column;">
                <div style="padding:12px; font-weight:bold; font-size:12px; letter-spacing:1px; color:#495057; border-bottom:1px solid #dee2e6; background:#f8f9fa;">MEDIA LIBRARY</div>
                <div style="padding:8px; border-bottom:1px solid #dee2e6;">
                    <input type="text" id="sidebar-search" class="form-control form-control-sm" placeholder="Search media..." onkeyup="renderSidebarList()">
                </div>
                <div id="editor-media-body" style="flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:15px;">
                    <!-- Populated by renderSidebarList -->
                </div>
            </div>

            <!-- CENTER: VIDEO PREVIEW -->
            <div style="flex:1; display:flex; flex-direction:column; background:#e9ecef; position:relative; overflow:hidden;">
                <div style="flex:1; position:relative; display:flex; align-items:center; justify-content:center; padding:20px;">
                    <div style="width:100%; max-width:800px; aspect-ratio:16/9; background:#000; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.15); border-radius:4px; overflow:hidden;">
                        <video id="editor-preview-video" style="width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;"></video>
                        <video id="editor-preview-next" style="width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0; display:none;"></video>
                        <audio id="editor-preview-audio"></audio>
                        <div id="editor-text-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:flex; align-items:center; justify-content:center; font-size:24px; color:white; text-shadow:2px 2px 4px rgba(0,0,0,0.8); z-index:10;"></div>
                    </div>
                </div>
                
                <!-- PREVIEW CONTROLS -->
                <div style="height:50px; background:#ffffff; border-top:1px solid #dee2e6; display:flex; align-items:center; justify-content:center; gap:15px; padding:0 20px;">
                    <div style="font-family:monospace; font-size:14px; color:#495057; width:80px;" id="preview-time-display">00:00.0</div>
                    <button class="btn btn-sm btn-light" onclick="seekRelative(-1)">?</button>
                    <button class="btn btn-primary" onclick="togglePlay()" id="play-btn" style="width:40px; height:40px; border-radius:20px; display:flex; align-items:center; justify-content:center;">?</button>
                    <button class="btn btn-sm btn-light" onclick="seekRelative(1)">?</button>
                    <div style="flex:1; max-width:300px; display:flex; align-items:center; margin-left:20px;">
                        <input type="range" id="preview-seekbar" class="form-range" min="0" max="100" value="0" step="0.1" oninput="seekTimeline(this.value)">
                    </div>
                </div>
            </div>

            <!-- RIGHT: PROPERTIES -->
            <div style="width:300px; background:#ffffff; border-left:1px solid #dee2e6; display:flex; flex-direction:column;">
                <div style="padding:12px; font-weight:bold; font-size:12px; letter-spacing:1px; color:#495057; border-bottom:1px solid #dee2e6; background:#f8f9fa;">PROPERTIES</div>
                <div id="inspector-panel" style="flex:1; padding:15px; overflow-y:auto; display:flex; flex-direction:column; gap:15px; font-size:12px;">
                    <div style="color:#6c757d; text-align:center; margin-top:40px;">Select a clip on the timeline to edit properties</div>
                </div>
            </div>
            
        </div>

        <!-- BOTTOM: TIMELINE -->
        <div style="height:320px; background:#ffffff; border-top:1px solid #dee2e6; display:flex; flex-direction:column;">
            
            <!-- TIMELINE TOOLBAR -->
            <div style="height:40px; border-bottom:1px solid #dee2e6; background:#f8f9fa; display:flex; align-items:center; padding:0 15px; gap:10px;">
                <button class="btn btn-sm btn-light" onclick="splitSelectedClip()">? Split</button>
                <button class="btn btn-sm btn-light" onclick="duplicateSelectedClip()">? Duplicate</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSelectedClip()">?? Delete</button>
                <div style="width:1px; height:20px; background:#dee2e6; margin:0 5px;"></div>
                <span style="font-size:12px; color:#6c757d;">Zoom:</span>
                <input type="range" class="form-range" style="width:100px;" min="5" max="50" value="20" oninput="changeZoom(this.value)">
            </div>
            
            <!-- TIMELINE TRACKS -->
            <div style="flex:1; position:relative; overflow-x:auto; overflow-y:auto; background:#ffffff;" id="timeline-container">
                <div id="timeline-ruler" style="height:25px; border-bottom:1px solid #dee2e6; background:#f8f9fa; position:sticky; top:0; z-index:50;"></div>
                <div id="timeline-tracks" style="position:relative; min-height:100%; padding-bottom:20px;" ondragover="timelineDragOver(event)" ondrop="timelineDrop(event)">
                    
                    <div style="display:flex; margin-top:10px;">
                        <div style="width:100px; padding:10px; font-size:11px; font-weight:bold; color:#495057; position:sticky; left:0; background:#ffffff; z-index:40; border-right:1px solid #dee2e6;">VIDEO</div>
                        <div id="track-video" style="flex:1; height:60px; background:#f1f3f5; position:relative; border-radius:4px; margin-right:20px;"></div>
                    </div>
                    
                    <div style="display:flex; margin-top:10px;">
                        <div style="width:100px; padding:10px; font-size:11px; font-weight:bold; color:#495057; position:sticky; left:0; background:#ffffff; z-index:40; border-right:1px solid #dee2e6;">SCENE AUDIO</div>
                        <div id="track-audio" style="flex:1; height:50px; background:#f1f3f5; position:relative; border-radius:4px; margin-right:20px;"></div>
                    </div>
                    
                    <div style="display:flex; margin-top:10px;">
                        <div style="width:100px; padding:10px; font-size:11px; font-weight:bold; color:#495057; position:sticky; left:0; background:#ffffff; z-index:40; border-right:1px solid #dee2e6;">MUSIC</div>
                        <div id="track-music" style="flex:1; height:50px; background:#f1f3f5; position:relative; border-radius:4px; margin-right:20px;"></div>
                    </div>
                    
                    <div style="display:flex; margin-top:10px;">
                        <div style="width:100px; padding:10px; font-size:11px; font-weight:bold; color:#495057; position:sticky; left:0; background:#ffffff; z-index:40; border-right:1px solid #dee2e6;">SFX</div>
                        <div id="track-sfx" style="flex:1; height:40px; background:#f1f3f5; position:relative; border-radius:4px; margin-right:20px;"></div>
                    </div>
                    
                    <div id="playhead" style="position:absolute; top:0; left:0; width:2px; height:100%; background:#dc3545; z-index:60; pointer-events:none;">
                        <div style="position:absolute; top:0; left:-5px; width:12px; height:12px; background:#dc3545; border-radius:50%;"></div>
                    </div>
                    
                </div>
            </div>
            
        </div>
      </div>
      <style>
        .clip-selected { border: 2px solid #0d6efd !important; box-shadow: 0 0 0 2px rgba(13,110,253,0.25); z-index: 100 !important; }
        .timeline-clip { cursor: grab; transition: border 0.1s; border: 1px solid #ced4da; }
        .timeline-clip:hover { border-color: #6c757d; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      </style>
    `;"""

text = re.sub(r'    container\.innerHTML = `.*?      </style>\n    `;', new_layout, text, flags=re.DOTALL)

with open("public/js/pages/editor.js", "w", encoding="utf-8") as f:
    f.write(text)
