const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);
const exportTasks = {};

function toUrlPath(filePath) {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/');
  const idx = rel.indexOf('/uploads');
  if (idx !== -1) return rel.substring(idx);
  return null;
}

function resolveFilePath(filePath) {
  if (!filePath) return null;
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }
  const clean = filePath.replace(/^[\\\/]+/, '');
  const candidate = path.join(process.cwd(), clean);
  if (fs.existsSync(candidate)) return candidate;
  return null;
}

router.post('/', async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' });

  const taskId = uuidv4();
  exportTasks[taskId] = { status: 'processing', progress: 0, url: null, error: null };
  res.json({ success: true, task_id: taskId });
  runExport(project_id, taskId).catch(err => {
    console.error('Export failed:', err);
    if (exportTasks[taskId]) {
      exportTasks[taskId].status = 'failed';
      exportTasks[taskId].error = err.message;
    }
  });
});

router.get('/status/:taskId', (req, res) => {
  const task = exportTasks[req.params.taskId];
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, task });
});

async function runExport(projectId, taskId) {
  const [clips] = await db.query(`
    SELECT tc.*, ma.file_path, ma.asset_type 
    FROM timeline_clips tc
    JOIN media_assets ma ON tc.media_asset_id = ma.id
    WHERE tc.project_id = ?
    ORDER BY tc.position ASC
  `, [projectId]);

  clips.forEach(c => {
    c.resolved_path = resolveFilePath(c.file_path);
  });

  const videoClips = clips.filter(c => c.track_type === 'video' && c.resolved_path);
  let audioClips = clips.filter(c => c.track_type !== 'video' && c.resolved_path);

  if (videoClips.length === 0) {
    throw new Error('No valid video clips found on the timeline.');
  }

  const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const outputFilename = `export_${taskId}.mp4`;
  const outputPath = path.join(exportsDir, outputFilename);
  const listPath = path.join(exportsDir, `list_${taskId}.txt`);

  // 1. Compile video concat list
  const listContent = videoClips
    .map(c => {
       let str = `file '${c.resolved_path.replace(/\\/g, '/')}'`;
       const ts = parseFloat(c.trim_start) || 0;
       const te = parseFloat(c.trim_end) || 0;
       if (ts > 0) str += `\ninpoint ${ts}`;
       if (te > 0 && te > ts) str += `\noutpoint ${te}`;
       return str;
    }).join('\n');
  fs.writeFileSync(listPath, listContent);

  // Calculate global start times for video clips
  let currentVideoTime = 0;
  const videoTimings = {};
  videoClips.forEach(vc => {
      const rDur = parseFloat(vc.duration) || 5.0;
      const effDur = ((parseFloat(vc.trim_end) || rDur) - (parseFloat(vc.trim_start) || 0)) / (parseFloat(vc.speed) || 1.0);
      videoTimings[vc.id] = { start: currentVideoTime, end: currentVideoTime + effDur };
      currentVideoTime += effDur;
  });

  // Calculate true start times for audio tracks
  audioClips = audioClips.map(ac => {
      let startTime = parseFloat(ac.start_time) || 0;
      if (ac.linked_to && videoTimings[ac.linked_to]) {
          startTime += videoTimings[ac.linked_to].start;
      }
      return { ...ac, computed_start: startTime };
  });

  let ffmpegArgs = ['-y', '-f', 'concat', '-safe', '0', '-i', listPath];
  let filterComplex = '';
  
  if (audioClips.length === 0) {
    // Only video
    ffmpegArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23', outputPath);
  } else {
    // We have audio clips to mix
    audioClips.forEach(ac => {
      ffmpegArgs.push('-i', ac.resolved_path);
    });

    let mixInputs = '';
    // For each audio file (inputs 1 to N, since input 0 is the video concat list)
    audioClips.forEach((ac, idx) => {
       const inputIdx = idx + 1;
       const delayMs = Math.floor((ac.computed_start || 0) * 1000);
       const ts = parseFloat(ac.trim_start) || 0;
       const te = parseFloat(ac.trim_end) || 0;
       const vol = ac.volume !== undefined ? ac.volume : 1.0;
       
       let filter = `[${inputIdx}:a]`;
       if (ts > 0 || te > ts) {
           const endFilter = te > ts ? `:end=${te}` : '';
           filter += `atrim=start=${ts}${endFilter},asetpts=PTS-STARTPTS,`;
       }
       filter += `volume=${vol}`;
       if (delayMs > 0) {
           filter += `,adelay=${delayMs}|${delayMs}`;
       }
       filter += `[a${inputIdx}];`;
       filterComplex += filter;
       mixInputs += `[a${inputIdx}]`;
    });

    filterComplex += `${mixInputs}amix=inputs=${audioClips.length}:duration=longest:dropout_transition=0[aout]`;

    ffmpegArgs.push('-filter_complex', filterComplex);
    ffmpegArgs.push('-map', '0:v');
    ffmpegArgs.push('-map', '[aout]');
    ffmpegArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23');
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    ffmpegArgs.push('-shortest', outputPath);
  }

  return new Promise((resolve, reject) => {
    const ffmpegCmd = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const proc = spawn(ffmpegCmd, ffmpegArgs);
    let outputLog = '';

    proc.stderr.on('data', d => {
      const str = d.toString();
      outputLog += str;
      const timeMatch = str.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch && exportTasks[taskId]) {
        const hrs = parseInt(timeMatch[1]);
        const mins = parseInt(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const totalSecs = (hrs * 3600) + (mins * 60) + secs;
        const progress = Math.min(Math.round((totalSecs / currentVideoTime) * 100), 99);
        exportTasks[taskId].progress = progress || 10;
      }
    });

    proc.on('close', async code => {
      if (code === 0) {
        if (exportTasks[taskId]) {
          exportTasks[taskId].status = 'completed';
          exportTasks[taskId].progress = 100;
          exportTasks[taskId].url = toUrlPath(outputPath);
        }
        
        try {
          await db.query(
            "INSERT INTO media_assets (project_id, asset_type, filename, file_path, url_path, source, task_id) VALUES (?, 'export', ?, ?, ?, 'export', ?)",
            [projectId, outputFilename, outputPath, toUrlPath(outputPath), taskId]
          );
        } catch (e) { console.error('Failed to save export to DB:', e); }

        resolve(outputPath);
      } else {
        const errMsg = 'FFmpeg exited with code ' + code + '. Log: ' + outputLog;
        if (exportTasks[taskId]) {
          exportTasks[taskId].status = 'failed';
          exportTasks[taskId].error = errMsg;
        }
        reject(new Error(errMsg));
      }
    });
  });
}

module.exports = router;
