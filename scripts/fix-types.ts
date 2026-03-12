// scripts/fix-types.ts
// Automated type fixing utility

import * as fs from 'fs';
import * as path from 'path';

const anyTypeRegex = /:\s*any\b/g;

function replaceAnyTypes(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Replace common any types with proper types
  newContent = newContent.replace(/params: any/g, 'params: { id: string }');
  newContent = newContent.replace(/error: any/g, 'error: Error | unknown');
  newContent = newContent.replace(/data: any/g, 'data: Record<string, unknown>');
  newContent = newContent.replace(/props: any/g, 'props: Record<string, unknown>');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed types in: ${filePath}`);
  }
}

// Recursively process files
function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceAnyTypes(filePath);
    }
  });
}

processDirectory('src');
console.log('Type fixing complete!');
