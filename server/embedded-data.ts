// This file provides a fallback mechanism to load data from files
// or from environment if files are not available in autoscale deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded data
let strongDataCache: any[] | null = null;
let studyDataCache: any | null = null;

function findDataFile(filename: string): string | null {
  const possiblePaths = [
    path.resolve(__dirname, filename),
    path.resolve(__dirname, `../${filename}`),
    path.resolve(__dirname, `../server/${filename}`),
    path.resolve(process.cwd(), `dist/${filename}`),
    path.resolve(process.cwd(), `server/${filename}`),
    path.resolve(process.cwd(), filename),
    `/app/dist/${filename}`,
    `/app/server/${filename}`,
    `/app/${filename}`,
    `/home/runner/workspace/dist/${filename}`,
    `/home/runner/workspace/server/${filename}`,
    `./dist/${filename}`,
    `./server/${filename}`,
    `./${filename}`,
  ];

  console.log(`[EmbeddedData] Looking for ${filename}:`);
  for (const p of possiblePaths) {
    const exists = fs.existsSync(p);
    console.log(`  ${p} - ${exists ? '✅' : '❌'}`);
    if (exists) {
      return p;
    }
  }
  return null;
}

export function getStrongData(): any[] | null {
  if (strongDataCache !== null) {
    return strongDataCache;
  }

  const filePath = findDataFile('strong-data.json');
  if (filePath) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      strongDataCache = JSON.parse(raw);
      console.log(`[EmbeddedData] Loaded ${strongDataCache?.length || 0} Strong entries from ${filePath}`);
      return strongDataCache;
    } catch (error) {
      console.error(`[EmbeddedData] Error reading ${filePath}:`, error);
    }
  }

  console.log('[EmbeddedData] Strong data not available');
  return null;
}

export function getStudyModulesData(): any | null {
  if (studyDataCache !== null) {
    return studyDataCache;
  }

  const filePath = findDataFile('study-modules-data.json');
  if (filePath) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      studyDataCache = JSON.parse(raw);
      console.log(`[EmbeddedData] Loaded study modules from ${filePath}`);
      return studyDataCache;
    } catch (error) {
      console.error(`[EmbeddedData] Error reading ${filePath}:`, error);
    }
  }

  console.log('[EmbeddedData] Study modules data not available');
  return null;
}

export function logEnvironmentInfo(): void {
  console.log('[EmbeddedData] Environment info:');
  console.log(`  __dirname: ${__dirname}`);
  console.log(`  process.cwd(): ${process.cwd()}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  
  // List contents of likely directories
  const dirsToCheck = [
    process.cwd(),
    path.join(process.cwd(), 'dist'),
    '/app',
    '/app/dist',
  ];
  
  for (const dir of dirsToCheck) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        console.log(`  ${dir}: [${files.join(', ') || 'no JSON files'}]`);
      }
    } catch (e) {
      // Ignore access errors
    }
  }
}
