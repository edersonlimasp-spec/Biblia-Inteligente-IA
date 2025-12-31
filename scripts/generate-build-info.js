import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildInfo = {
  buildId: new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19),
  env: process.env.NODE_ENV || 'production',
  timestamp: new Date().toISOString(),
};

const distPath = path.resolve(__dirname, '..', 'dist');
const buildInfoPath = path.resolve(distPath, 'build-info.json');

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
console.log('[Build] Generated build-info.json:', buildInfo);

const swTimestamp = buildInfo.buildId.replace('T', '-');
const swPath = path.resolve(distPath, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf-8');
  swContent = swContent.replace(
    /const BUILD_TIMESTAMP = '[^']+';/,
    `const BUILD_TIMESTAMP = '${swTimestamp}';`
  );
  fs.writeFileSync(swPath, swContent);
  console.log('[Build] Updated sw.js BUILD_TIMESTAMP to:', swTimestamp);
}
