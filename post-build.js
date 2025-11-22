import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy dist/public to server/public
const sourceDir = path.join(__dirname, 'dist', 'public');
const targetDir = path.join(__dirname, 'server', 'public');

console.log('🔧 Post-build: Copiando dist/public para server/public...');

// Criar diretório se não existir
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Função recursiva para copiar
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ Fonte não encontrada: ${src}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

copyDir(sourceDir, targetDir);
console.log('✅ Post-build completo!');
