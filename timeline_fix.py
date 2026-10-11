import re
with open("public/js/pages/editor.js", "r", encoding="utf-8") as f:
    text = f.read()

# Let's add trim handles to the timeline clips and update clip HTML rendering
render_logic_update = """
      const clipHtml = `
        <div class="timeline-clip ${_selectedClipIdx === i ? 'clip-selected' : ''}" 
             data-index="${i}" 
             style="position:absolute; left:${leftPx}px; width:${widthPx}px; height:100%; background:${c.bg}; border:1px solid ${c.border}; border-radius:4px; cursor:pointer; overflow:hidden; z-index:10;"
             onmousedown="selectClip(event, ${i});">
             
             <!-- Trim Handles -->
             <div class="trim-handle left" onmousedown="startTrim(event, ${i}, 'left')" style="position:absolute; left:0; top:0; bottom:0; width:6px; background:rgba(255,255,255,0.5); cursor:col-resize; z-index:20;"></div>
             <div class="trim-handle right" onmousedown="startTrim(event, ${i}, 'right')" style="position:absolute; right:0; top:0; bottom:0; width:6px; background:rgba(255,255,255,0.5); cursor:col-resize; z-index:20;"></div>
             
             <!-- Content -->
             <div style="position:absolute; top:2px; left:8px; font-size:10px; color:#fff; white-space:nowrap; pointer-events:none; z-index:5;">${clip.clip_label || 'Audio'}</div>
             <div class="audio-waveform"></div>
        </div>
      `;
"""
# This is a complex change, I will do it step by step.
