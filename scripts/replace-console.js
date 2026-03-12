#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, 'logs', 'backups', 'console_replacements');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { nodir: true });
let changedCount = 0;
let fileChanges = [];

files.forEach((rel) => {
  const abs = path.join(ROOT, rel);
  let src = fs.readFileSync(abs, 'utf8');
  if (!/console\./.test(src)) return;

  const backupPath = path.join(BACKUP_DIR, rel.replace(/[\/]/g, '__') + '.bak');
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, src, 'utf8');

  // Replace console.* -> logger.* mapping
  const mapping = {
    'console.error': 'logger.error',
    'console.warn': 'logger.warn',
    'console.info': 'logger.info',
    'console.debug': 'logger.debug',
    'console.log': 'logger.info'
  };

  Object.keys(mapping).forEach((k) => {
    const re = new RegExp(k.replace('.', '\\.'), 'g');
    src = src.replace(re, mapping[k]);
  });

  // Ensure import { logger } from '@/lib/logger'; exists for TS/TSX/JS
  if (!/from\s+['"]@\/lib\/logger['"]/m.test(src) && !/logger\s*[:=]/m.test(src)) {
    // Find first import block to insert after, otherwise add at top
    const lines = src.split('\n');
    let insertAt = 0;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      if (/^import\s.+from\s+['"].+['"];?/.test(lines[i])) insertAt = i + 1;
    }
    lines.splice(insertAt, 0, "import { logger } from '@/lib/logger';");
    src = lines.join('\n');
  }

  fs.writeFileSync(abs, src, 'utf8');
  changedCount++;
  fileChanges.push(rel);
});

console.log(`Replaced console.* in ${changedCount} files.`);
if (fileChanges.length) console.log(fileChanges.join('\n'));
else console.log('No files changed.');
