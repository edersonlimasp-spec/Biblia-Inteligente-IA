#!/usr/bin/env node
/**
 * Generates embedded data modules from JSON files
 * These modules are included in the esbuild bundle for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..', 'server');

console.log('📦 Generating embedded data modules...');

// Generate Strong data module
const strongPath = path.join(serverDir, 'strong-data.json');
if (fs.existsSync(strongPath)) {
  const strongData = fs.readFileSync(strongPath, 'utf-8');
  const strongModule = `// Auto-generated - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
export const STRONG_DATA = ${strongData};
`;
  fs.writeFileSync(path.join(serverDir, 'strong-data-embedded.ts'), strongModule);
  console.log('✅ Generated strong-data-embedded.ts');
} else {
  console.log('⚠️ strong-data.json not found');
}

// Generate Study modules data
const studyPath = path.join(serverDir, 'study-modules-data.json');
if (fs.existsSync(studyPath)) {
  const studyData = fs.readFileSync(studyPath, 'utf-8');
  const studyModule = `// Auto-generated - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
export const STUDY_MODULES_DATA = ${studyData};
`;
  fs.writeFileSync(path.join(serverDir, 'study-modules-data-embedded.ts'), studyModule);
  console.log('✅ Generated study-modules-data-embedded.ts');
} else {
  console.log('⚠️ study-modules-data.json not found');
}

console.log('✅ Embedded data generation complete!');
