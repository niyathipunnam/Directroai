import re
with open('public/js/pages/editor.js', 'r', encoding='utf-8') as f:
    code = f.read()

def replace_media_section(match):
    return '''function mediaSection(title, items, trackType) {
  if (items.length === 0) return '';
  return `
    <div class=\"editor-media-section\">
      <div class=\"editor-media-section-title\">${title}</div>
      ${items.map(item => `
        <div class=\"editor-media-item\" onclick=\"addToTimeline(${item.id}, '${trackType}', '${escHtml(item.filename || item.asset_type)}')\">
          ${item.url_path && (item.asset_type === 'character' || item.asset_type === 'environment' || item.asset_type === 'storyboard_image')
            ? `<img class=\"editor-media-thumb\" src=\"${item.url_path}\" alt=\"\" />`
            : item.url_path && item.asset_type === 'video'
            ? `<video class=\"editor-media-thumb\" src=\"${item.url_path}\" muted></video>`
            : `<div class=\"editor-media-icon\">${item.asset_type === 'music' ? '🎵' : '🔊'}</div>`}
          <div class=\"editor-media-name\" title=\"${escHtml(item.filename || '')}\">${escHtml((item.filename || item.asset_type).substring(0, 20))}</div>
          <button class=\"editor-media-add\" title=\"Add to timeline\">+</button>
        </div>`).join('')}
    </div>`;
}'''

code = re.sub(r'function mediaSection\(.*?\n\}', replace_media_section, code, flags=re.DOTALL)
code = code.replace(r'return \`', 'return `')
code = code.replace(r'</div>\`', '</div>`')
code = code.replace(r'</div>\`;', '</div>`;')
code = code.replace(r'item => \`', 'item => `')
code = code.replace(r'</div>\`).join', '</div>`).join')

with open('public/js/pages/editor.js', 'w', encoding='utf-8') as f:
    f.write(code)
print('Fixed!')
