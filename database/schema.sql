-- DIRECTRO AI Database Schema
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS directro_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE directro_ai;

-- Drop tables in reverse FK order
DROP TABLE IF EXISTS timeline_clips;
DROP TABLE IF EXISTS audio_assets;
DROP TABLE IF EXISTS media_assets;
DROP TABLE IF EXISTS shots;
DROP TABLE IF EXISTS storyboards;
DROP TABLE IF EXISTS environments;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Projects
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active','archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tasks (async job tracking)
CREATE TABLE tasks (
  id VARCHAR(100) PRIMARY KEY,
  project_id INT,
  task_type VARCHAR(100),
  status ENUM('queued','generating','processing','completed','failed') DEFAULT 'queued',
  result_path VARCHAR(512),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Characters
CREATE TABLE characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  image_path VARCHAR(512),
  url_path VARCHAR(512),
  source ENUM('upload','generated') DEFAULT 'generated',
  task_id VARCHAR(100),
  status ENUM('pending','queued','generating','completed','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Environments
CREATE TABLE environments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  image_path VARCHAR(512),
  url_path VARCHAR(512),
  source ENUM('upload','generated') DEFAULT 'generated',
  task_id VARCHAR(100),
  status ENUM('pending','queued','generating','completed','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Storyboards
CREATE TABLE storyboards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  character_id INT,
  environment_id INT,
  story_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
  FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Shots
CREATE TABLE shots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  storyboard_id INT NOT NULL,
  shot_number INT NOT NULL DEFAULT 1,
  description TEXT,
  image_path VARCHAR(512),
  image_url VARCHAR(512),
  video_path VARCHAR(512),
  video_url VARCHAR(512),
  video_task_id VARCHAR(100),
  video_status ENUM('none','queued','generating','processing','completed','failed') DEFAULT 'none',
  motion_prompt TEXT,
  camera_movement VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Media Assets (all generated/uploaded files)
CREATE TABLE media_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  asset_type ENUM('character','environment','storyboard_image','video','music','sfx','export') NOT NULL,
  filename VARCHAR(255),
  file_path VARCHAR(512),
  url_path VARCHAR(512),
  source VARCHAR(100),
  task_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Audio Assets
CREATE TABLE audio_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  description TEXT,
  audio_path VARCHAR(512),
  url_path VARCHAR(512),
  audio_type ENUM('music','sfx','ambience') DEFAULT 'music',
  task_id VARCHAR(100),
  status ENUM('pending','generating','completed','failed','skipped','not_configured') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Timeline Clips (editor)
CREATE TABLE timeline_clips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  track_type ENUM('video','audio','sfx') NOT NULL,
  media_asset_id INT,
  clip_label VARCHAR(255),
  position INT DEFAULT 0,
  duration FLOAT DEFAULT 0,
  trim_start FLOAT DEFAULT 0,
  trim_end FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_environments_project ON environments(project_id);
CREATE INDEX idx_storyboards_project ON storyboards(project_id);
CREATE INDEX idx_shots_storyboard ON shots(storyboard_id);
CREATE INDEX idx_media_project ON media_assets(project_id);
CREATE INDEX idx_media_type ON media_assets(asset_type);
CREATE INDEX idx_audio_project ON audio_assets(project_id);
CREATE INDEX idx_timeline_project ON timeline_clips(project_id);

SELECT 'DIRECTRO AI schema created successfully!' AS result;
