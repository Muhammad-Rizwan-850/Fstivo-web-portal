/**
 * Automated script to replace console statements with proper logger
 * Run: npx tsx scripts/replace-console.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PATTERNS = {
  consoleLog: /console\.log\(/g,
  consoleError: /console\.error\(/g,
  consoleWarn: /console\.warn\(/g,
  consoleDebug: /console\.debug\(/g,
  consoleInfo: /console\.info\(/g,
};

const REPLACEMENTS = {
  consoleLog: 'logger.info(',
  consoleError: 'logger.error(',
  consoleWarn: 'logger.warn(',
  consoleDebug: 'logger.debug(',
  consoleInfo: 'logger.info(',
};

function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    'scripts/replace-console.ts',
  ];
  return skipPatterns.some(pattern => filePath.includes(pattern));
}

function replaceConsoleInFile(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    const hasLoggerImport = content.includes("from '@/lib/utils/logger'");

    Object.entries(PATTERNS).forEach(([key, pattern]) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, REPLACEMENTS[key as keyof typeof REPLACEMENTS]);
        modified = true;
      }
    });

    if (modified && !hasLoggerImport) {
      const isServerFile = filePath.includes('/api/') || 
                          filePath.includes('/actions/') ||
                          filePath.includes('route.ts') ||
                          content.includes("'use server'");

      const importStatement = "import { logger } from '@/lib/utils/logger';\n";

      const firstImportMatch = content.match(/^import .+;/m);
      if (firstImportMatch) {
        content = content.replace(firstImportMatch[0], importStatement + firstImportMatch[0]);
      } else {
        if (content.includes("'use client'") || content.includes("'use server'")) {
          content = content.replace(/('use (client|server)';?\n)/, '$1' + importStatement + '\n');
        } else {
          content = importStatement + '\n' + content;
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error processing ' + filePath + ':', error);
    return false;
  }
}

function processDirectory(dirPath: string): { modified: number; total: number } {
  let modified = 0;
  let total = 0;

  const items = readdirSync(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);

    if (shouldSkipFile(fullPath)) continue;

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const result = processDirectory(fullPath);
      modified += result.modified;
      total += result.total;
    } else if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
      total++;
      if (replaceConsoleInFile(fullPath)) {
        modified++;
        console.log('✅ Modified: ' + fullPath);
      }
    }
  }

  return { modified, total };
}

console.log('🔍 Scanning for console statements...\n');

const srcPath = join(process.cwd(), 'src');
const result = processDirectory(srcPath);

console.log('\n📊 Summary:');
console.log('   Files scanned: ' + result.total);
console.log('   Files modified: ' + result.modified);
console.log('\n✨ Done! Run \'npm run lint\' to check for issues.');
