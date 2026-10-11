const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure directories exist
const dirs = ['uploads/characters', 'uploads/environments', 'uploads/storyboards', 'uploads/videos', 'uploads/audio', 'uploads/exports'];
dirs.forEach(d => fs.mkdirSync(path.join(process.cwd(), d), { recursive: true }));

const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    // Determine subfolder from route
    let folder = 'uploads';
    const url = req.originalUrl;
    if (url.includes('characters')) folder = 'uploads/characters';
    else if (url.includes('environments')) folder = 'uploads/environments';
    else if (url.includes('storyboards') || url.includes('shots')) folder = 'uploads/storyboards';
    cb(null, path.join(process.cwd(), folder));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, jpeg, png, webp, gif)'), false);
};

const audioStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/audio'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const audioFilter = (req, file, cb) => {
  const allowed = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, aac)'), false);
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const mediaStorage = multer.diskStorage({
  destination(req, file, cb) {
    let folder = 'uploads';
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) folder = 'uploads/videos';
    else if (['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext)) folder = 'uploads/audio';
    else if (req.body.asset_type === 'character') folder = 'uploads/characters';
    else if (req.body.asset_type === 'environment') folder = 'uploads/environments';
    else folder = 'uploads/storyboards';
    cb(null, path.join(process.cwd(), folder));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const mediaFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm', '.mkv', '.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, MP3, WAV, AAC'), false);
};

const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB
});

module.exports = { uploadImage, uploadAudio, uploadMedia };

